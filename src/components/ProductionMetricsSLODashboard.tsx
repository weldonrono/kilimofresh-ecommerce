import React, { useState } from 'react';
import { TECHNICAL_DECISIONS } from '../data/mockData';
import { 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  BarChart3, 
  Server,
  Layers,
  ChevronRight
} from 'lucide-react';

export const ProductionMetricsSLODashboard: React.FC = () => {
  const [activeMetricTab, setActiveMetricTab] = useState<'waterfall' | 'decisions'>('waterfall');

  const LATENCY_WATERFALL = [
    {
      label: 'Edge Hop & 3G Mobile Radio Handshake',
      category: 'Client Network',
      durationMs: 320,
      percentage: '21.6%',
      color: 'bg-sky-500',
      description: 'Safaricom 3G/4G radio link latency from Kenyan mobile client to Cloudflare Edge.'
    },
    {
      label: 'Daraja STK Express SIM Prompt Handshake',
      category: 'Telecom Gateway',
      durationMs: 210,
      percentage: '14.2%',
      color: 'bg-emerald-500',
      description: 'Safaricom initiates USSD prompt transmission to subscriber mobile SIM card.'
    },
    {
      label: 'Subscriber PIN Input & Carrier Cryptography',
      category: 'User Interaction',
      durationMs: 850,
      percentage: '57.4%',
      color: 'bg-purple-500',
      description: 'Human user verifies prompt and submits 4-digit M-Pesa PIN on handset.'
    },
    {
      label: 'KilimoFresh Ingestion & HMAC Verification',
      category: 'Backend Gateway',
      durationMs: 18,
      percentage: '1.2%',
      color: 'bg-indigo-500',
      description: 'Raw payload cryptographic HMAC SHA-256 validation on edge Node.js runtime.'
    },
    {
      label: 'Redis SETNX Atomic Idempotency Guard',
      category: 'Distributed Cache',
      durationMs: 1.2,
      percentage: '0.1%',
      color: 'bg-amber-400',
      description: 'SET idemp:mpesa:{transId} EX 60 NX. Intercepts duplicates in 1.2ms.'
    },
    {
      label: 'PostgreSQL FOR UPDATE Transaction',
      category: 'Database Lock',
      durationMs: 6.4,
      percentage: '0.4%',
      color: 'bg-emerald-400',
      description: 'Pessimistic row lock acquisition, stock decrement, and order status update.'
    },
    {
      label: 'BullMQ Async Queue Message Dispatch',
      category: 'Background Worker',
      durationMs: 1.8,
      percentage: '0.1%',
      color: 'bg-purple-400',
      description: 'Offloads SMS and farmer hub routing. Returns HTTP 200 ACK to Safaricom in <85ms.'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Production Telemetry &amp; SLO Compliance
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">185,000+ Transactions Audited</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Service Level Objectives (SLOs) &amp; Latency Budget Breakdown
          </h2>
        </div>

        {/* Segmented Tab */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveMetricTab('waterfall')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeMetricTab === 'waterfall'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            End-to-End Latency Waterfall
          </button>
          <button
            onClick={() => setActiveMetricTab('decisions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeMetricTab === 'decisions'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Architecture Trade-offs &amp; Rationale
          </button>
        </div>
      </div>

      {/* 3 SLO Detailed Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SLO 1 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-emerald-400">SLO #1 · INTEGRITY</span>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30">
                100% MET
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Zero Double Billing
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Zero tolerance for double billing or lost payments during mobile network handoffs and carrier retries.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 font-mono">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Duplicate Incidents:</span>
              <span className="text-emerald-400 font-bold tabular-nums">0 incidents</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Error Budget Consumed:</span>
              <span className="text-emerald-400 font-bold tabular-nums">0.00%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Guaranteed by Redis SETNX 60s TTL
            </div>
          </div>
        </div>

        {/* SLO 2 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-emerald-400">SLO #2 · PERFORMANCE</span>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30">
                99.4% MET
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Sub-2-Second Checkout
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Sub-2-second end-to-end checkout experience on mobile 3G/4G connections across Safaricom network.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 font-mono">
            <div className="flex justify-between text-xs text-slate-400">
              <span>p50 Checkout Time:</span>
              <span className="text-white font-bold tabular-nums">1.12s</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>p95 Checkout Time:</span>
              <span className="text-emerald-400 font-bold tabular-nums">1.68s</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Webhook ACK returned in &lt;85ms
            </div>
          </div>
        </div>

        {/* SLO 3 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-emerald-400">SLO #3 · CONCURRENCY</span>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30">
                100% MET
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Harvest Drop Bursts
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              High-concurrency ordering bursts during 06:00 AM farm produce harvest drops with absolute stock consistency.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 font-mono">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Peak Burst Rate:</span>
              <span className="text-white font-bold tabular-nums">140 req/sec</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Inventory Oversell:</span>
              <span className="text-emerald-400 font-bold tabular-nums">0 crates</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Guaranteed by Postgres FOR UPDATE
            </div>
          </div>
        </div>

      </div>

      {/* Latency Waterfall Tab */}
      {activeMetricTab === 'waterfall' && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                End-to-End M-Pesa STK Push Latency Waterfall
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total roundtrip: <span className="text-emerald-400 font-mono font-bold">1,480ms</span> (well under the 2,000ms SLO #2 budget).
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Webhook API Response: <span className="text-emerald-400 font-bold">&lt; 85ms</span>
            </div>
          </div>

          {/* Stacked Visual Bar */}
          <div className="mt-6 space-y-2">
            <div className="h-5 w-full bg-slate-950 rounded-lg overflow-hidden flex border border-slate-800">
              {LATENCY_WATERFALL.map((step) => (
                <div
                  key={step.label}
                  style={{ width: step.percentage }}
                  className={`${step.color} hover:opacity-90 transition-opacity`}
                  title={`${step.label}: ${step.durationMs}ms (${step.percentage})`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>0ms (Checkout clicked)</span>
              <span>750ms</span>
              <span>1,480ms (Receipt confirmed)</span>
            </div>
          </div>

          {/* List of Waterfall Steps */}
          <div className="mt-6 divide-y divide-slate-800/80">
            {LATENCY_WATERFALL.map((step) => (
              <div key={step.label} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${step.color} shrink-0`} />
                  <div>
                    <div className="text-xs font-bold text-white">{step.label}</div>
                    <div className="text-[11px] text-slate-400">{step.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0 pl-6 sm:pl-0">
                  <span className="text-slate-400">{step.category}</span>
                  <span className="text-emerald-400 font-bold tabular-nums min-w-[60px] text-right">
                    {step.durationMs}ms
                  </span>
                  <span className="text-slate-500 tabular-nums min-w-[45px] text-right">
                    {step.percentage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions & Rationale Tab */}
      {activeMetricTab === 'decisions' && (
        <div className="space-y-4">
          {TECHNICAL_DECISIONS.map((dec, idx) => (
            <div key={dec.title} className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs flex items-center justify-center font-mono">
                    0{idx + 1}
                  </span>
                  {dec.title}
                </h4>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-md shrink-0">
                  {dec.verdict}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                {dec.rationale}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
