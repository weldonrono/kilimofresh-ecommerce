import { ArchitectureNode, ProductItem } from '../types/architecture';

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-avocado-01',
    name: 'Kirinyaga Export Hass Avocados',
    tagline: 'Fresh Grade 1 creamy organic harvest, cold-pressed quality',
    region: 'Mount Kenya Foothills, Kirinyaga',
    farmer: 'Njeri & Sons Family Farm',
    priceKES: 450,
    stock: 5,
    initialStock: 5,
    image: '/images/kilimofresh_hass_avocados_1791967925276.jpg',
    harvestTime: 'Picked today 05:30 AM EAT'
  },
  {
    id: 'prod-strawberry-02',
    name: 'Naivasha Highland Strawberries',
    tagline: 'Artisan basket with natural morning dew, naturally sweet',
    region: 'Lake Naivasha Highlands',
    farmer: 'Kariuki Hydro Greens',
    priceKES: 620,
    stock: 8,
    initialStock: 8,
    image: '/images/kilimofresh_strawberries_1791967925103.jpg',
    harvestTime: 'Picked today 06:15 AM EAT'
  },
  {
    id: 'prod-crate-03',
    name: 'Kinangop Morning Harvest Crate',
    tagline: 'Mixed crate of kale, beefsteak tomatoes & Highland red potatoes',
    region: 'Kinangop Plateau, Nyandarua',
    farmer: 'Mbolea Organic Cooperative',
    priceKES: 1250,
    stock: 12,
    initialStock: 12,
    image: '/images/kilimofresh_hero_produce_1791967923472.jpg',
    harvestTime: 'Packed today 05:00 AM EAT'
  }
];

export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'mobile-client',
    name: 'Mobile PWA / 3G Shopper',
    subname: 'Edge Client',
    category: 'edge',
    tech: 'Next.js 14 · Service Worker · Tailwind',
    description: 'Kenyan shoppers purchasing produce on patchy mobile 3G/4G connections. Initiates STK Push prompt and polls checkout status via resilient backoff.',
    roleInFlow: 'Sends cart checkout -> receives M-Pesa USSD SIM popup -> transitions to order tracking.',
    codeSnippet: `// 1. Initiate STK Push via Daraja Proxy
const res = await fetch('/api/checkout/mpesa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+254712345678', amountKES: 450, cartId })
});
// 2. Poll checkout status with exponential jitter backoff
pollOrderStatus(res.checkoutRequestId, { maxAttempts: 12, intervalMs: 1500 });`,
    metrics: {
      latency: '240ms on 3G',
      throughput: '4,200+ WAU',
      resilience: 'Offline-ready PWA cache'
    }
  },
  {
    id: 'daraja-api',
    name: 'Safaricom Daraja STK Push',
    subname: 'External Telecom Payment Gateway',
    category: 'external',
    tech: 'M-Pesa Express · USSD PIN Prompt',
    description: 'Safaricom mobile money payment gateway. Sends USSD prompt to customer phone, processes cryptographic PIN, and fires asynchronous HTTP POST webhook callbacks.',
    roleInFlow: 'Fires webhook callbacks out-of-order, often retrying within 150ms if response latency exceeds thresholds.',
    codeSnippet: `// Sample Safaricom Daraja STK Callback Payload
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_141020260155_78921",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 450.00 },
          { "Name": "MpesaReceiptNumber", "Value": "SJ14KP89X2" },
          { "Name": "TransactionDate", "Value": 20261014061522 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}`,
    metrics: {
      latency: '1.2s - 2.8s PIN entry',
      throughput: '150 callbacks/sec burst',
      resilience: 'Up to 3 aggressive retries'
    }
  },
  {
    id: 'api-gateway',
    name: 'Next.js API & Webhook Listener',
    subname: 'Stateless Edge Controller',
    category: 'gateway',
    tech: 'Node.js 20 · Express / Next.js Route Handler',
    description: 'High-speed ingestion layer. Performs cryptographic HMAC signature checks and dispatches into the idempotency pipeline. Responds within <85ms.',
    roleInFlow: 'Validates webhook authentication -> attempts Redis lock -> returns 200 OK immediately.',
    codeSnippet: `export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-safaricom-signature');
  
  // 1. Verify HMAC SHA-256 payload integrity
  if (!verifyDarajaHmac(rawBody, signature, env.DARAJA_CALLBACK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: DarajaPayload = JSON.parse(rawBody);
  return await processIdempotentWebhook(payload);
}`,
    metrics: {
      latency: '< 18ms processing',
      throughput: '1,400 req/sec',
      resilience: 'Zero-downtime rolling deploys'
    }
  },
  {
    id: 'redis-lock',
    name: 'Redis SETNX Idempotency Engine',
    subname: 'Distributed Atomic Lock Layer',
    category: 'cache',
    tech: 'Redis 7 · Upstash / Cluster · Atomic SETNX',
    description: 'Prevents race conditions from duplicated Safaricom callbacks. Uses atomic SET key NX with 60-second TTL keyed on M-Pesa transaction reference (TransID).',
    roleInFlow: 'Only ONE callback can acquire lock. Duplicates immediately return HTTP 200 { duplicate: true } without touching the DB.',
    codeSnippet: `// Redis Atomic Distributed Idempotency Lock
const lockKey = \`idemp:mpesa:\${transId}\`;
const lockTtlSeconds = 60;

// SETNX key "PROCESSING" EX 60 NX
const acquired = await redis.set(lockKey, 'PROCESSING', {
  nx: true,
  ex: lockTtlSeconds
});

if (!acquired) {
  // Duplicate webhook callback detected!
  logger.warn('Duplicate webhook discarded', { transId });
  return { status: 'duplicate_ignored', transId };
}`,
    metrics: {
      latency: '1.2ms atomic lock',
      throughput: '45,000 ops/sec',
      resilience: '100% duplicate rejection'
    }
  },
  {
    id: 'postgres-db',
    name: 'PostgreSQL Row-Level Lock Engine',
    subname: 'Pessimistic Concurrency Storage',
    category: 'database',
    tech: 'PostgreSQL 16 · Explicit FOR UPDATE Transactions',
    description: 'Prevents overselling during morning produce harvest drops. Locks specific product rows exclusively inside BEGIN ... COMMIT transactions.',
    roleInFlow: 'Acquires row lock -> verifies stock >= requested -> decrements stock -> inserts order record.',
    codeSnippet: `// Explicit Row-Level Lock prevents inventory overselling
await db.transaction(async (tx) => {
  // 1. Acquire exclusive lock on the produce row
  const [product] = await tx.$queryRaw\`
    SELECT id, name, stock 
    FROM products 
    WHERE id = \${productId} 
    FOR UPDATE
  \`;

  if (product.stock < quantity) {
    throw new OutOfStockError(\`Sold out during checkout!\`);
  }

  // 2. Decrement stock safely
  await tx.execute\`
    UPDATE products 
    SET stock = stock - \${quantity} 
    WHERE id = \${productId}
  \`;

  // 3. Record confirmed order
  await tx.insert(orders).values({ orderId, transId, amountKES, status: 'CONFIRMED' });
});`,
    metrics: {
      latency: '6.4ms write transaction',
      throughput: '850 tx/sec',
      resilience: 'Zero overselling guarantee'
    }
  },
  {
    id: 'bullmq-workers',
    name: 'BullMQ Async Queue & Workers',
    subname: 'Decoupled Background Message Pipeline',
    category: 'queue',
    tech: 'BullMQ · Redis Backed · Worker Threadpool',
    description: 'Offloads slow third-party SMS delivery and farmer dispatch notifications. Ensures webhook response returns to Safaricom in under 85ms.',
    roleInFlow: 'Enqueues SMS confirmation job -> worker executes with 3 automatic retries and exponential backoff.',
    codeSnippet: `// 1. Producer inside Webhook Handler (< 2ms)
await smsQueue.add('send-customer-receipt', {
  phone: order.phone,
  receiptNo: order.transId,
  amountKES: order.amountKES,
  pickupHub: 'Nairobi Westlands Hub'
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
});

// 2. BullMQ Worker in background
new Worker('sms-queue', async (job) => {
  await africasTalking.sendSMS({
    to: job.data.phone,
    message: \`KilimoFresh: Payment received for \${job.data.receiptNo}. Amount KES \${job.data.amountKES}. Dispatching fresh!\`
  });
});`,
    metrics: {
      latency: '< 2ms queue write',
      throughput: '2,500 jobs/sec',
      resilience: 'Dead-letter queue fallback'
    }
  }
];

export const TECHNICAL_DECISIONS = [
  {
    title: 'Redis SETNX vs. Database Unique Constraints',
    verdict: 'Redis SETNX as First Line of Defense',
    rationale: 'Relying solely on PostgreSQL unique constraints on `mpesa_receipt_number` forces concurrent duplicate callbacks to initiate full DB connections and transaction rollbacks under high peak bursts. Redis SETNX absorbs duplicate storms in RAM at 1.2ms without putting load on the relational database connection pool.'
  },
  {
    title: 'Pessimistic (FOR UPDATE) vs. Optimistic Locking',
    verdict: 'PostgreSQL SELECT ... FOR UPDATE',
    rationale: 'During 06:00 AM organic produce flash sales, 50+ shoppers compete for 5 crates within a 500ms window. Optimistic locking with version numbers causes cascading retries and high transaction abort rates. Explicit pessimistic row locks guarantee serialized deterministic decrements with zero overselling.'
  },
  {
    title: 'Decoupled BullMQ Queues vs. Synchronous SMS Dispatch',
    verdict: 'BullMQ Asynchronous Background Workers',
    rationale: 'Safaricom Daraja requires webhook response ACK within 3 seconds, or it marks the callback timed out and fires a retry. Third-party SMS gateways (like Africa\'s Talking) can take 800ms–2500ms. Offloading SMS to BullMQ drops webhook latency from 1,800ms to <85ms.'
  }
];
