import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Layers,
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { SimulationLogEntry, SimulatedOrder } from '../types/architecture';

export const SimulationSandbox: React.FC = () => {
  const [activeLab, setActiveLab] = useState<'idempotency' | 'flash_sale'>('idempotency');
  
  // Lab 1: Webhook Idempotency State
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(true);
  const [duplicateCount, setDuplicateCount] = useState<number>(3);
  const [isSimulatingIdemp, setIsSimulatingIdemp] = useState(false);
  const [idempOrders, setIdempOrders] = useState<SimulatedOrder[]>([]);
  const [redisKeys, setRedisKeys] = useState<{ key: string; val: string; ttl: number }[]>([]);
  const [idempLogs, setIdempLogs] = useState<SimulationLogEntry[]>([]);
  const [idempOutcome, setIdempOutcome] = useState<{
    status: 'idle' | 'success' | 'failure';
    ordersCreated: number;
    duplicateDropped: number;
    doubleBillingDetected: boolean;
  }>({
    status: 'idle',
    ordersCreated: 0,
    duplicateDropped: 0,
    doubleBillingDetected: false
  });

  // Lab 2: Flash Sale Concurrency State
  const [rowLockEnabled, setRowLockEnabled] = useState(true);
  const [initialStock, setInitialStock] = useState<number>(5);
  const [currentStock, setCurrentStock] = useState<number>(5);
  const [concurrentShoppers, setConcurrentShoppers] = useState<number>(12);
  const [isSimulatingFlash, setIsSimulatingFlash] = useState(false);
  const [flashOrders, setFlashOrders] = useState<SimulatedOrder[]>([]);
  const [flashLogs, setFlashLogs] = useState<SimulationLogEntry[]>([]);
  const [flashOutcome, setFlashOutcome] = useState<{
    status: 'idle' | 'success' | 'oversold';
    confirmed: number;
    rejected: number;
    finalStock: number;
  }>({
    status: 'idle',
    confirmed: 0,
    rejected: 0,
    finalStock: 5
  });

  // Background BullMQ Queue State
  const [bullJobs, setBullJobs] = useState<{ id: string; name: string; status: 'completed' | 'active'; phone: string; ms: number }[]>([]);

  // Decrement Redis TTL for realistic display
  useEffect(() => {
    const timer = setInterval(() => {
      setRedisKeys(prev => 
        prev
          .map(k => ({ ...k, ttl: k.ttl - 1 }))
          .filter(k => k.ttl > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Run Lab 1: Webhook Duplicate Race Condition
  const runIdempotencySimulation = async () => {
    if (isSimulatingIdemp) return;
    setIsSimulatingIdemp(true);
    setIdempLogs([]);
    setIdempOrders([]);
    setIdempOutcome({ status: 'idle', ordersCreated: 0, duplicateDropped: 0, doubleBillingDetected: false });

    const transId = `SJ14KP${Math.floor(1000 + Math.random() * 9000)}X`;
    const phone = '+254712890123';
    const amount = 450;
    const now = new Date();

    const addLog = (stage: SimulationLogEntry['stage'], level: SimulationLogEntry['level'], message: string, durationMs: number) => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 900 + 100);
      setIdempLogs(prev => [
        {
          id: Math.random().toString(),
          timestamp: timeStr,
          stage,
          level,
          message,
          durationMs
        },
        ...prev
      ]);
    };

    addLog('DARAJA_WEBHOOK', 'info', `Safaricom Daraja fired webhook for ${transId} (Amount: KES ${amount}). Initiating concurrent burst (${duplicateCount} callbacks)...`, 0);

    let ordersCreated = 0;
    let duplicateDropped = 0;
    const newOrders: SimulatedOrder[] = [];
    const newBullJobs: typeof bullJobs = [];

    // Simulate concurrent callbacks with jitter
    const callbacks = Array.from({ length: duplicateCount }).map((_, idx) => ({
      callbackIndex: idx + 1,
      jitterMs: idx * 8 + Math.floor(Math.random() * 12)
    }));

    for (const cb of callbacks) {
      await new Promise(r => setTimeout(r, cb.jitterMs));

      if (idempotencyEnabled) {
        // WITH REDIS SETNX
        const lockKey = `idemp:mpesa:${transId}`;
        const alreadyLocked = redisKeys.some(k => k.key === lockKey) || ordersCreated > 0;

        if (!alreadyLocked) {
          // 1st request acquires lock
          setRedisKeys(prev => [...prev, { key: lockKey, val: 'PROCESSING', ttl: 60 }]);
          addLog('REDIS_LOCK', 'success', `[Callback #${cb.callbackIndex}] SETNX ${lockKey} NX EX 60 -> OK. Lock acquired in 1.3ms.`, 1.3);

          // PostgreSQL transaction
          addLog('POSTGRES_TX', 'info', `[Callback #${cb.callbackIndex}] BEGIN; SELECT stock FROM products FOR UPDATE; Decrement stock; COMMIT;`, 6.4);
          ordersCreated++;

          newOrders.push({
            id: `ord-${Math.floor(10000 + Math.random() * 90000)}`,
            transId,
            phone,
            productName: 'Kirinyaga Hass Avocados',
            quantity: 1,
            amountKES: amount,
            status: 'CONFIRMED',
            timestamp: now.toISOString(),
            txLockAcquired: true,
            smsQueued: true
          });

          // Queue BullMQ SMS
          addLog('BULLMQ', 'success', `[Callback #${cb.callbackIndex}] Enqueued customer SMS receipt in BullMQ sms-queue (< 2ms).`, 1.8);
          newBullJobs.push({
            id: `job-${Math.floor(1000 + Math.random() * 9000)}`,
            name: 'send-customer-receipt',
            status: 'completed',
            phone,
            ms: 2
          });

          addLog('GATEWAY', 'success', `[Callback #${cb.callbackIndex}] Responded HTTP 200 OK to Safaricom in 18ms.`, 18);
        } else {
          // Duplicate callback arrives -> SETNX returns NIL
          duplicateDropped++;
          addLog('REDIS_LOCK', 'warn', `[Callback #${cb.callbackIndex}] SETNX ${lockKey} -> NIL (Lock already held). Discarding duplicate callback!`, 1.1);
          addLog('GATEWAY', 'info', `[Callback #${cb.callbackIndex}] Returned HTTP 200 { status: 'duplicate_ignored' } immediately. No DB mutation.`, 1.4);
        }
      } else {
        // VULNERABLE: NO IDEMPOTENCY GUARD
        ordersCreated++;
        addLog('POSTGRES_TX', 'error', `[Callback #${cb.callbackIndex}] NO IDEMPOTENCY: Executed duplicate INSERT INTO orders & stock decrement!`, 8.2);

        newOrders.push({
          id: `ord-${Math.floor(10000 + Math.random() * 90000)}`,
          transId,
          phone,
          productName: 'Kirinyaga Hass Avocados',
          quantity: 1,
          amountKES: amount,
          status: 'CONFIRMED',
          timestamp: now.toISOString(),
          txLockAcquired: false,
          smsQueued: true
        });

        newBullJobs.push({
          id: `job-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'send-duplicate-sms',
          status: 'completed',
          phone,
          ms: 3
        });
      }
    }

    setIdempOrders(newOrders);
    setBullJobs(prev => [...newBullJobs, ...prev].slice(0, 8));

    const isDoubleBilled = ordersCreated > 1;
    setIdempOutcome({
      status: isDoubleBilled ? 'failure' : 'success',
      ordersCreated,
      duplicateDropped,
      doubleBillingDetected: isDoubleBilled
    });

    setIsSimulatingIdemp(false);
  };

  // Run Lab 2: Flash Sale Harvest Drop Concurrency
  const runFlashSaleSimulation = async () => {
    if (isSimulatingFlash) return;
    setIsSimulatingFlash(true);
    setFlashLogs([]);
    setFlashOrders([]);
    setCurrentStock(initialStock);

    const addLog = (stage: SimulationLogEntry['stage'], level: SimulationLogEntry['level'], message: string, durationMs: number) => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 900 + 100);
      setFlashLogs(prev => [
        {
          id: Math.random().toString(),
          timestamp: timeStr,
          stage,
          level,
          message,
          durationMs
        },
        ...prev
      ]);
    };

    addLog('DARAJA_WEBHOOK', 'info', `06:00:00 AM Harvest Drop: ${concurrentShoppers} shoppers clicked "Pay with M-Pesa" simultaneously for ${initialStock} available avocado crates.`, 0);

    let tempStock = initialStock;
    let confirmed = 0;
    let rejected = 0;
    const orders: SimulatedOrder[] = [];

    if (rowLockEnabled) {
      // PROTECTED: PostgreSQL SELECT ... FOR UPDATE
      addLog('POSTGRES_TX', 'info', 'Concurrently acquiring row-level locks on product #prod-avocado-01 with FOR UPDATE...', 2.4);

      for (let i = 1; i <= concurrentShoppers; i++) {
        await new Promise(r => setTimeout(r, 25));
        const shopperPhone = `+254720${Math.floor(100000 + Math.random() * 900000)}`;
        const transId = `HV${Math.floor(1000 + Math.random() * 9000)}K`;

        if (tempStock > 0) {
          tempStock -= 1;
          confirmed++;
          setCurrentStock(tempStock);
          addLog('POSTGRES_TX', 'success', `[Shopper #${i}] Row lock acquired. Stock verified (${tempStock + 1} >= 1). Decremented to ${tempStock}. Order confirmed.`, 5.8);
          
          orders.push({
            id: `ord-${i}`,
            transId,
            phone: shopperPhone,
            productName: 'Kirinyaga Hass Avocados',
            quantity: 1,
            amountKES: 450,
            status: 'CONFIRMED',
            timestamp: new Date().toISOString(),
            txLockAcquired: true,
            smsQueued: true
          });
        } else {
          rejected++;
          addLog('REJECTED', 'warn', `[Shopper #${i}] Row lock acquired. Stock is 0! Threw OutOfStockError. Rolled back transaction safely.`, 3.2);

          orders.push({
            id: `ord-${i}`,
            transId,
            phone: shopperPhone,
            productName: 'Kirinyaga Hass Avocados',
            quantity: 1,
            amountKES: 450,
            status: 'OVERSOLD_REJECTED',
            timestamp: new Date().toISOString(),
            txLockAcquired: true,
            smsQueued: false
          });
        }
      }

      setFlashOutcome({
        status: 'success',
        confirmed,
        rejected,
        finalStock: tempStock
      });
    } else {
      // VULNERABLE: Naive Read-Check-Write without Row Lock
      addLog('POSTGRES_TX', 'error', 'VULNERABLE: Running without row-level locks! All transactions read current stock concurrently before writing.', 1.5);

      // All shoppers read stock = 5 simultaneously
      const simulatedOversoldStock = initialStock - concurrentShoppers; // e.g. 5 - 12 = -7
      tempStock = simulatedOversoldStock;
      setCurrentStock(tempStock);
      confirmed = concurrentShoppers;
      rejected = 0;

      for (let i = 1; i <= concurrentShoppers; i++) {
        await new Promise(r => setTimeout(r, 15));
        const shopperPhone = `+254720${Math.floor(100000 + Math.random() * 900000)}`;
        const transId = `HV${Math.floor(1000 + Math.random() * 9000)}K`;

        orders.push({
          id: `ord-${i}`,
          transId,
          phone: shopperPhone,
          productName: 'Kirinyaga Hass Avocados',
          quantity: 1,
          amountKES: 450,
          status: 'CONFIRMED',
          timestamp: new Date().toISOString(),
          txLockAcquired: false,
          smsQueued: true
        });

        addLog('POSTGRES_TX', 'error', `[Shopper #${i}] Race condition! Read stock as >0 and wrote order. Decremented past zero!`, 4.1);
      }

      setFlashOutcome({
        status: 'oversold',
        confirmed,
        rejected: 0,
        finalStock: tempStock
      });
    }

    setFlashOrders(orders);
    setIsSimulatingFlash(false);
  };

  const resetAll = () => {
    setIdempOrders([]);
    setIdempLogs([]);
    setRedisKeys([]);
    setIdempOutcome({ status: 'idle', ordersCreated: 0, duplicateDropped: 0, doubleBillingDetected: false });
    setCurrentStock(5);
    setFlashOrders([]);
    setFlashLogs([]);
    setFlashOutcome({ status: 'idle', confirmed: 0, rejected: 0, finalStock: 5 });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Selector: Lab 1 vs Lab 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Interactive Concurrency &amp; Race Condition Sandbox
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute real-time race condition tests against the M-Pesa webhook idempotency engine and database locking mechanisms.
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveLab('idempotency')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeLab === 'idempotency'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lab 1: Webhook Duplicate Storm
          </button>
          <button
            onClick={() => setActiveLab('flash_sale')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeLab === 'flash_sale'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lab 2: Flash Sale Harvest Burst
          </button>
        </div>
      </div>

      {/* LAB 1: WEBHOOK DUPLICATE STORM */}
      {activeLab === 'idempotency' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Experiment 01
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-mono text-slate-300">Daraja Telecom Duplicate Webhook Race</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Simulate Safaricom Out-of-Order Webhook Retries
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  When mobile shoppers hand off between 3G/4G cells or when Safaricom's webhook dispatch fires aggressive retries within 150ms, duplicate callbacks hit the backend simultaneously with identical M-Pesa <code className="text-emerald-300 font-mono">TransID</code>.
                </p>
              </div>

              {/* Toggles & Execution */}
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                
                {/* Protection Toggle */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 px-2 font-medium">Idempotency Guard:</span>
                  <button
                    onClick={() => setIdempotencyEnabled(true)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      idempotencyEnabled
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Enabled (SETNX)
                  </button>
                  <button
                    onClick={() => setIdempotencyEnabled(false)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      !idempotencyEnabled
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Disabled (Vulnerable)
                  </button>
                </div>

                {/* Burst Count */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Callbacks:</span>
                  <select
                    value={duplicateCount}
                    onChange={(e) => setDuplicateCount(Number(e.target.value))}
                    className="bg-slate-950 text-white text-xs font-mono border border-slate-800 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={2}>2 Concurrent Callbacks</option>
                    <option value={3}>3 Concurrent Callbacks</option>
                    <option value={5}>5 Aggressive Retries</option>
                  </select>
                </div>

                {/* Run Button */}
                <button
                  onClick={runIdempotencySimulation}
                  disabled={isSimulatingIdemp}
                  className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${
                    isSimulatingIdemp
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-sm'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulatingIdemp ? 'animate-spin' : ''}`} />
                  {isSimulatingIdemp ? 'Firing Webhook Burst...' : 'Fire Concurrent Webhooks'}
                </button>

                <button
                  onClick={resetAll}
                  className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                  title="Reset Sandbox"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* Outcome Banner */}
            {idempOutcome.status !== 'idle' && (
              <div className={`mt-6 p-4 rounded-xl border ${
                idempOutcome.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-start gap-3">
                  {idempOutcome.status === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-bold">
                      {idempOutcome.status === 'success' 
                        ? 'Idempotency Invariant Preserved: Zero Double Billing!'
                        : 'CRITICAL FAILURE: Race Condition Induced Double Billing!'}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {idempOutcome.status === 'success' ? (
                        <>
                          The 1st callback acquired the atomic Redis lock (<code className="font-mono">SETNX = 1</code>). The other {idempOutcome.duplicateDropped} concurrent duplicate callbacks were intercepted in RAM (<code className="font-mono">SETNX = 0</code>) and discarded within 1.2ms without initiating a database transaction or sending duplicate SMS.
                        </>
                      ) : (
                        <>
                          Without the Redis SETNX distributed lock, {idempOutcome.ordersCreated} concurrent webhook callbacks initiated parallel PostgreSQL transactions. Both committed, creating {idempOutcome.ordersCreated} duplicate orders in the database and sending duplicate SMS notifications to the customer!
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-6 mt-3 text-xs font-mono">
                      <span>Orders Created in DB: <strong>{idempOutcome.ordersCreated}</strong></span>
                      <span>Duplicates Intercepted: <strong>{idempOutcome.duplicateDropped}</strong></span>
                      <span>Double Charge Violations: <strong>{idempOutcome.doubleBillingDetected ? 'YES (Defect)' : '0 (Passed)'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3-Column Runtime State: Redis Keys | Postgres Orders | BullMQ Queue */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Redis Cache State */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Redis 7 Key Store
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {redisKeys.length} active locks
                </span>
              </div>
              
              {redisKeys.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active idempotency keys in RAM.
                  <br />
                  Fire webhooks to see atomic locks.
                </div>
              ) : (
                <div className="space-y-2">
                  {redisKeys.map((k) => (
                    <div key={k.key} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs">
                      <div className="text-emerald-400 font-semibold truncate">{k.key}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Val: &quot;{k.val}&quot;</span>
                        <span className="text-amber-400 tabular-nums">TTL: {k.ttl}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. PostgreSQL Orders Ledger */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Postgres DB Ledger
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {idempOrders.length} orders committed
                </span>
              </div>

              {idempOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Database transaction ledger empty.
                  <br />
                  Awaiting committed webhook callbacks.
                </div>
              ) : (
                <div className="space-y-2">
                  {idempOrders.map((ord) => (
                    <div key={ord.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{ord.id}</span>
                        <span className="text-emerald-400 font-bold">KES {ord.amountKES}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        TransID: <span className="text-slate-300">{ord.transId}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Phone: {ord.phone} · Status: {ord.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. BullMQ Worker Queue */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    BullMQ Background Queue
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  sms-queue worker
                </span>
              </div>

              {bullJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No pending or executed background jobs.
                  <br />
                  SMS workers decoupled from webhook response.
                </div>
              ) : (
                <div className="space-y-2">
                  {bullJobs.map((job) => (
                    <div key={job.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-semibold">{job.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded">
                          {job.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        To: {job.phone}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Worker Latency: {job.ms}ms · Retries: 0
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Real-time Execution Log */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Real-Time Execution Trace Log
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {idempLogs.length} events logged
              </span>
            </div>

            {idempLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                Click &quot;Fire Concurrent Webhooks&quot; above to inspect the millisecond trace.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto pr-1">
                {idempLogs.map((log) => {
                  let badgeColor = 'text-slate-400';
                  if (log.level === 'success') badgeColor = 'text-emerald-400';
                  if (log.level === 'warn') badgeColor = 'text-amber-400';
                  if (log.level === 'error') badgeColor = 'text-rose-400';

                  return (
                    <div key={log.id} className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-slate-900/60 transition-colors">
                      <span className="text-slate-500 text-[11px] shrink-0 tabular-nums">{log.timestamp}</span>
                      <span className={`text-[10px] font-bold uppercase shrink-0 px-1 py-0.5 bg-slate-900 rounded ${badgeColor}`}>
                        {log.stage}
                      </span>
                      <span className="text-slate-200 flex-1 leading-relaxed">{log.message}</span>
                      {log.durationMs > 0 && (
                        <span className="text-slate-500 text-[10px] shrink-0 tabular-nums">
                          {log.durationMs}ms
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* LAB 2: FLASH SALE HARVEST DROP CONCURRENCY */}
      {activeLab === 'flash_sale' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Experiment 02
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-mono text-slate-300">Pessimistic Row-Level Locking (FOR UPDATE)</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  06:00 AM Morning Harvest Flash Sale Concurrency
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  KilimoFresh drops a limited morning harvest of 5 crates of Kirinyaga Hass Avocados. 12 shoppers attempt to purchase them within the same 500ms window. Tests whether stock can ever oversell into negative numbers.
                </p>
              </div>

              {/* Toggles & Execution */}
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                
                {/* Row Lock Toggle */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 px-2 font-medium">Postgres Locking:</span>
                  <button
                    onClick={() => setRowLockEnabled(true)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      rowLockEnabled
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    FOR UPDATE (Pessimistic)
                  </button>
                  <button
                    onClick={() => setRowLockEnabled(false)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      !rowLockEnabled
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    No Lock (Naive)
                  </button>
                </div>

                {/* Stock & Shoppers */}
                <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                  <div className="px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                    Stock: <span className="text-emerald-400 font-bold">{initialStock} Crates</span>
                  </div>
                  <div className="px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                    Shoppers: <span className="text-white font-bold">{concurrentShoppers} Burst</span>
                  </div>
                </div>

                {/* Run Button */}
                <button
                  onClick={runFlashSaleSimulation}
                  disabled={isSimulatingFlash}
                  className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${
                    isSimulatingFlash
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-sm'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulatingFlash ? 'animate-spin' : ''}`} />
                  {isSimulatingFlash ? 'Processing Concurrency...' : 'Simulate 06:00 AM Burst'}
                </button>

                <button
                  onClick={resetAll}
                  className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                  title="Reset Sandbox"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* Outcome Banner */}
            {flashOutcome.status !== 'idle' && (
              <div className={`mt-6 p-4 rounded-xl border ${
                flashOutcome.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-start gap-3">
                  {flashOutcome.status === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-bold">
                      {flashOutcome.status === 'success' 
                        ? 'Inventory Consistency Guaranteed: Zero Overselling!'
                        : 'DISASTROUS INVENTORY CORRUPTION: Negative Stock Oversold!'}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {flashOutcome.status === 'success' ? (
                        <>
                          Explicit row-level locking (<code className="font-mono">SELECT ... FOR UPDATE</code>) serialized all 12 checkout attempts. The first 5 transactions decremented stock cleanly to 0. The subsequent 7 shoppers received an instant, graceful &quot;Produce Sold Out&quot; notification with zero inventory breach.
                        </>
                      ) : (
                        <>
                          Without row-level locks, all 12 concurrent requests read the stock as 5 before any could commit. All 12 wrote orders, decrementing the stock down to <strong>{flashOutcome.finalStock}</strong>! KilimoFresh accepted money for 7 crates that physical farmers do not have!
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-6 mt-3 text-xs font-mono">
                      <span>Confirmed Orders: <strong>{flashOutcome.confirmed}</strong></span>
                      <span>Gracefully Rejected: <strong>{flashOutcome.rejected}</strong></span>
                      <span>Final Database Stock: <strong className={flashOutcome.finalStock < 0 ? 'text-rose-400 underline' : 'text-emerald-400'}>{flashOutcome.finalStock}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stock Display & Orders Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Stock Gauge */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Produce Inventory Gauge
                </div>
                <div className="text-lg font-bold text-white">Kirinyaga Hass Avocados</div>
                <div className="text-xs text-slate-400 mt-0.5">Grade 1 Export Yield · 5 Units Total</div>

                <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 mb-1">Current Stock in Database:</div>
                  <div className={`text-4xl font-extrabold font-mono tabular-nums ${
                    currentStock < 0 
                      ? 'text-rose-500' 
                      : currentStock === 0 
                      ? 'text-amber-400' 
                      : 'text-emerald-400'
                  }`}>
                    {currentStock}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    {currentStock < 0 ? 'CORRUPTED (OVERSOLD)' : currentStock === 0 ? 'SOLD OUT (EXACT)' : 'AVAILABLE'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Locking Strategy: </span>
                {rowLockEnabled ? (
                  <span className="text-emerald-400 font-mono">SELECT ... FOR UPDATE (Pessimistic)</span>
                ) : (
                  <span className="text-rose-400 font-mono">Unprotected Read-Check-Write</span>
                )}
              </div>
            </div>

            {/* Orders Feed */}
            <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Burst Checkout Requests ({flashOrders.length})
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {flashOrders.filter(o => o.status === 'CONFIRMED').length} confirmed · {flashOrders.filter(o => o.status === 'OVERSOLD_REJECTED').length} rejected
                </span>
              </div>

              {flashOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-mono">
                  Click &quot;Simulate 06:00 AM Burst&quot; to test concurrent checkout requests.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {flashOrders.map((ord) => (
                    <div 
                      key={ord.id} 
                      className={`p-2.5 rounded-lg border text-xs font-mono ${
                        ord.status === 'CONFIRMED'
                          ? 'bg-slate-950 border-emerald-500/30'
                          : 'bg-slate-950/60 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{ord.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          ord.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}>
                          {ord.status === 'CONFIRMED' ? 'CONFIRMED' : 'SOLD OUT REJECTED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Phone: {ord.phone}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Amount: KES {ord.amountKES} · Lock: {ord.txLockAcquired ? 'Pessimistic' : 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Flash Sale Execution Log */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                PostgreSQL Transaction Concurrency Trace
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {flashLogs.length} events logged
              </span>
            </div>

            {flashLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                Awaiting harvest drop simulation...
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto pr-1">
                {flashLogs.map((log) => {
                  let badgeColor = 'text-slate-400';
                  if (log.level === 'success') badgeColor = 'text-emerald-400';
                  if (log.level === 'warn') badgeColor = 'text-amber-400';
                  if (log.level === 'error') badgeColor = 'text-rose-400';

                  return (
                    <div key={log.id} className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-slate-900/60 transition-colors">
                      <span className="text-slate-500 text-[11px] shrink-0 tabular-nums">{log.timestamp}</span>
                      <span className={`text-[10px] font-bold uppercase shrink-0 px-1 py-0.5 bg-slate-900 rounded ${badgeColor}`}>
                        {log.stage}
                      </span>
                      <span className="text-slate-200 flex-1 leading-relaxed">{log.message}</span>
                      {log.durationMs > 0 && (
                        <span className="text-slate-500 text-[10px] shrink-0 tabular-nums">
                          {log.durationMs}ms
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
