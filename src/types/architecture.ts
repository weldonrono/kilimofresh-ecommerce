export interface ArchitectureNode {
  id: string;
  name: string;
  subname: string;
  category: 'edge' | 'gateway' | 'cache' | 'database' | 'queue' | 'external';
  description: string;
  tech: string;
  roleInFlow: string;
  codeSnippet: string;
  metrics: {
    latency: string;
    throughput: string;
    resilience: string;
  };
}

export interface DarajaCallbackPayload {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  Amount: number;
  MpesaReceiptNumber: string;
  Balance?: number;
  TransactionDate: string;
  PhoneNumber: string;
}

export interface SimulationLogEntry {
  id: string;
  timestamp: string;
  stage: 'GATEWAY' | 'REDIS_LOCK' | 'POSTGRES_TX' | 'BULLMQ' | 'DARAJA_WEBHOOK' | 'REJECTED';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  metadata?: Record<string, any>;
  durationMs: number;
}

export interface SimulatedOrder {
  id: string;
  transId: string;
  phone: string;
  productName: string;
  quantity: number;
  amountKES: number;
  status: 'PENDING' | 'CONFIRMED' | 'DUPLICATE_REJECTED' | 'OVERSOLD_REJECTED';
  timestamp: string;
  txLockAcquired: boolean;
  smsQueued: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  region: string;
  farmer: string;
  priceKES: number;
  stock: number;
  initialStock: number;
  image: string;
  harvestTime: string;
}
