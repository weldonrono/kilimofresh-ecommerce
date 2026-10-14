import React, { useState } from 'react';
import { Copy, Check, FileCode, CheckCircle2, Lock, ShieldCheck, Cpu } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  annotation: string;
  code: string;
}

const CODE_FILES: CodeFile[] = [
  {
    name: 'daraja-webhook.controller.ts',
    path: 'src/controllers/daraja-webhook.controller.ts',
    language: 'typescript',
    annotation: 'Redis atomic SETNX prevents duplicate webhook race conditions with 60s TTL',
    code: `import { Request, Response } from 'express';
import crypto from 'crypto';
import { redis } from '../lib/redis';
import { checkoutService } from '../services/inventory-checkout.service';
import { smsQueue, dispatchQueue } from '../workers/bullmq-queue';
import { logger } from '../lib/logger';
import { DarajaWebhookPayload } from '../types/daraja-mpesa';

/**
 * KilimoFresh Resilient M-Pesa Webhook Ingestion Controller
 * Handles aggressive Safaricom Daraja retries and mobile handoff duplicates.
 */
export async function handleDarajaWebhook(req: Request, res: Response) {
  const startTime = performance.now();
  const signature = req.headers['x-safaricom-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // 1. Verify Cryptographic HMAC SHA-256 Signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.DARAJA_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('base64');

  if (signature && signature !== expectedSig) {
    logger.warn('Daraja webhook signature mismatch', { ip: req.ip });
    return res.status(401).json({ error: 'Invalid HMAC signature' });
  }

  const payload = req.body as DarajaWebhookPayload;
  const { stkCallback } = payload.Body;
  const transId = stkCallback.CallbackMetadata?.Item?.find(
    (i) => i.Name === 'MpesaReceiptNumber'
  )?.Value as string;

  if (stkCallback.ResultCode !== 0 || !transId) {
    logger.info('STK Push cancelled or failed by user', {
      code: stkCallback.ResultCode,
      desc: stkCallback.ResultDesc,
    });
    return res.status(200).json({ status: 'user_cancelled_acknowledged' });
  }

  // 2. ATOMIC REDIS IDEMPOTENCY GUARD (SETNX with 60-Second TTL)
  // If duplicate webhook hits within 60s, SETNX fails instantly (returns 0)
  const lockKey = \`idemp:mpesa:\${transId}\`;
  const acquired = await redis.set(lockKey, 'PROCESSING', 'EX', 60, 'NX');

  if (!acquired) {
    // Gracefully discard duplicate callback without hitting PostgreSQL
    logger.warn('Duplicate Daraja webhook discarded via Redis SETNX', {
      transId,
      checkoutRequestId: stkCallback.CheckoutRequestID,
    });
    return res.status(200).json({
      status: 'duplicate_ignored',
      message: 'Transaction already accepted and processing',
      transId,
    });
  }

  try {
    const amountKES = stkCallback.CallbackMetadata.Item.find(
      (i) => i.Name === 'Amount'
    )?.Value as number;
    const phone = stkCallback.CallbackMetadata.Item.find(
      (i) => i.Name === 'PhoneNumber'
    )?.Value as string;

    // 3. PostgreSQL Explicit Row-Level Lock & Inventory Decrement
    const order = await checkoutService.fulfillOrderWithRowLock({
      transId,
      amountKES,
      phone,
      checkoutRequestId: stkCallback.CheckoutRequestID,
    });

    // 4. Decoupled BullMQ Async Workers (< 2ms)
    // Offload slow SMS notification and farmer dispatch to background workers
    await smsQueue.add('send-customer-receipt', {
      orderId: order.id,
      phone,
      amountKES,
      transId,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: true,
    });

    await dispatchQueue.add('notify-farm-hub', {
      orderId: order.id,
      hub: 'Nairobi Westlands Hub',
      produce: order.items,
    });

    const elapsed = Math.round(performance.now() - startTime);
    logger.info('Daraja webhook processed successfully', { transId, elapsedMs: elapsed });

    // Safaricom Daraja expects HTTP 200 within 3 seconds
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Callback accepted successfully',
      processingTimeMs: elapsed,
    });
  } catch (err: any) {
    logger.error('Error during webhook fulfillment', { error: err.message, transId });
    // Note: Do NOT release Redis lock if we don't want retries to double-execute
    return res.status(500).json({ error: 'Fulfillment failed' });
  }
}`
  },
  {
    name: 'inventory-checkout.service.ts',
    path: 'src/services/inventory-checkout.service.ts',
    language: 'typescript',
    annotation: 'PostgreSQL BEGIN ... SELECT FOR UPDATE serializes concurrent flash-sale checkouts',
    code: `import { db } from '../db/client';
import { products, orders, orderItems } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { OutOfStockError } from '../errors/app-errors';

interface FulfillParams {
  transId: string;
  amountKES: number;
  phone: string;
  checkoutRequestId: string;
}

export class InventoryCheckoutService {
  /**
   * Executes atomic inventory deduction inside an explicit PostgreSQL transaction
   * using SELECT ... FOR UPDATE to eliminate flash-sale overselling.
   */
  async fulfillOrderWithRowLock(params: FulfillParams) {
    return await db.transaction(async (tx) => {
      // 1. Locate pending cart associated with CheckoutRequestID
      const [pendingOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.checkoutRequestId, params.checkoutRequestId))
        .limit(1);

      if (!pendingOrder) {
        throw new Error(\`Order not found for \${params.checkoutRequestId}\`);
      }

      // Fetch items to deduct
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, pendingOrder.id));

      for (const item of items) {
        // 2. ACQUIRE EXCLUSIVE ROW-LEVEL LOCK ON PRODUCE RECORD
        // Blocks concurrent transactions on this specific row until COMMIT/ROLLBACK
        const [lockedProduct] = await tx.execute(sql\`
          SELECT id, name, stock 
          FROM products 
          WHERE id = \${item.productId} 
          FOR UPDATE
        \`);

        if (!lockedProduct || (lockedProduct as any).stock < item.quantity) {
          throw new OutOfStockError(
            \`Yield sold out! Requested: \${item.quantity}, Available: \${(lockedProduct as any)?.stock ?? 0}\`
          );
        }

        // 3. ATOMIC DECREMENT OF STOCK
        await tx.execute(sql\`
          UPDATE products 
          SET stock = stock - \${item.quantity},
              updated_at = NOW() 
          WHERE id = \${item.productId}
        \`);
      }

      // 4. MARK ORDER CONFIRMED & ATTACH M-PESA RECEIPT
      const [confirmedOrder] = await tx
        .update(orders)
        .set({
          status: 'CONFIRMED',
          mpesaReceipt: params.transId,
          paidAt: new Date(),
        })
        .where(eq(orders.id, pendingOrder.id))
        .returning();

      return {
        id: confirmedOrder.id,
        transId: params.transId,
        phone: params.phone,
        items,
      };
    });
  }
}

export const checkoutService = new InventoryCheckoutService();`
  },
  {
    name: 'bullmq-queue.ts',
    path: 'src/workers/bullmq-queue.ts',
    language: 'typescript',
    annotation: 'Asynchronous workers decouple third-party SMS latency from Daraja ACK (<85ms)',
    code: `import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { africasTalking } from '../lib/sms-client';
import { logger } from '../lib/logger';

// 1. Queue definitions
export const smsQueue = new Queue('sms-notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1500 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const dispatchQueue = new Queue('farm-dispatch', {
  connection: redisConnection,
});

// 2. SMS Delivery Background Worker
export const smsWorker = new Worker(
  'sms-notifications',
  async (job) => {
    const { phone, amountKES, transId } = job.data;
    logger.info('Processing background SMS delivery', { jobId: job.id, phone });

    // Africa's Talking Telecom API Call
    await africasTalking.SMS.send({
      to: [phone],
      message: \`KilimoFresh: Payment received for order \${transId}. Amount KES \${amountKES}. Fresh morning harvest scheduled for delivery today by 08:30 AM.\`,
      from: 'KilimoFresh',
    });

    return { delivered: true, timestamp: Date.now() };
  },
  {
    connection: redisConnection,
    concurrency: 10, // Handle 10 simultaneous SMS dispatches
    limiter: {
      max: 50,
      duration: 1000, // Max 50 SMS/second to respect telecom carrier limits
    },
  }
);

smsWorker.on('failed', (job, err) => {
  logger.error('SMS worker job failed after retries', {
    jobId: job?.id,
    error: err.message,
  });
});`
  },
  {
    name: 'daraja-mpesa.ts',
    path: 'src/types/daraja-mpesa.ts',
    language: 'typescript',
    annotation: 'Strict TypeScript typing for Safaricom Daraja STK Push callback structures',
    code: `export interface DarajaMetadataItem {
  Name: 'Amount' | 'MpesaReceiptNumber' | 'Balance' | 'TransactionDate' | 'PhoneNumber';
  Value: string | number;
}

export interface DarajaCallbackMetadata {
  Item: DarajaMetadataItem[];
}

export interface DarajaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number; // 0 = Success, 1032 = Cancelled by user, 1 = Insufficient funds
  ResultDesc: string;
  CallbackMetadata?: DarajaCallbackMetadata;
}

export interface DarajaWebhookPayload {
  Body: {
    stkCallback: DarajaStkCallback;
  };
}`
  },
  {
    name: 'schema.sql',
    path: 'src/db/schema.sql',
    language: 'sql',
    annotation: 'DDL with unique constraints and indexes for high-throughput locking',
    code: `-- KilimoFresh Production Schema
CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  price_kes INTEGER NOT NULL CHECK (price_kes > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0), -- Prevents negative inventory at schema level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  checkout_request_id VARCHAR(128) UNIQUE NOT NULL,
  mpesa_receipt VARCHAR(64) UNIQUE, -- Secondary uniqueness invariant
  phone VARCHAR(20) NOT NULL,
  total_amount_kes INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Index for instant checkout lookup during Daraja callback
CREATE INDEX idx_orders_checkout_request_id ON orders(checkout_request_id);
CREATE INDEX idx_orders_mpesa_receipt ON orders(mpesa_receipt);
CREATE INDEX idx_products_stock ON products(stock);`
  }
];

interface CodeInspectorProps {
  onClose?: () => void;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({ onClose }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = CODE_FILES[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Production Source Repository
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">github.com/kilimofresh/core-engine</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Production-Grade Source Code &amp; Implementation Artifacts
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Close Case Study
            </button>
          )}
        </div>
      </div>

      {/* Code Inspector Frame */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        
        {/* File Tabs */}
        <div className="flex items-center overflow-x-auto bg-slate-900/90 border-b border-slate-800 px-2 pt-2 scrollbar-none">
          {CODE_FILES.map((file, idx) => {
            const isActive = idx === activeFileIndex;
            return (
              <button
                key={file.name}
                onClick={() => setActiveFileIndex(idx)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-t-lg transition-colors whitespace-nowrap shrink-0 border-t border-l border-r ${
                  isActive
                    ? 'bg-slate-950 text-emerald-400 border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-850'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-bar: Annotation & Copy Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-emerald-400 font-mono text-[11px]">ARCHITECTURAL NOTE:</span>
            <span className="text-slate-300 text-xs">{activeFile.annotation}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors self-end sm:self-auto shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[520px]">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed">
            <code>
              {activeFile.code.split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="table-row">
                  <span className="table-cell select-none pr-4 text-slate-600 text-right tabular-nums text-[11px]">
                    {lineIndex + 1}
                  </span>
                  <span className="table-cell">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

      </div>

    </div>
  );
};
