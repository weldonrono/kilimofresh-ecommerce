import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  Lock, 
  Clock, 
  Database,
  ExternalLink
} from 'lucide-react';

interface HeroSectionProps {
  onLaunchSimulator: () => void;
  onExploreArchitecture: () => void;
  onInspectCode: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchSimulator,
  onExploreArchitecture,
  onInspectCode
}) => {
  return (
    <section className="relative pt-8 pb-14 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Role & Context Meta */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 mb-4 font-mono">
          <span className="text-emerald-400 font-medium">Interactive Technical Walkthrough</span>
          <span className="text-slate-600">·</span>
          <span>Role: Full-Stack System Architect &amp; Developer</span>
          <span className="text-slate-600">·</span>
          <span>Production Engineering Case Study</span>
        </div>

        {/* Headline */}
        <div className="max-w-4xl mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
            KilimoFresh Distributed E-Commerce &amp; Resilient M-Pesa Webhook Engine
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 leading-relaxed">
            Eliminating payment race conditions and flash-sale inventory overselling across Safaricom Daraja telecom mobile money callbacks in high-traffic East African agriculture commerce.
          </p>
        </div>

        {/* Stack Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 py-2 px-3.5 bg-slate-900/80 border border-slate-800 rounded-lg max-w-fit mb-8 font-mono">
          <span className="text-slate-500 font-sans font-semibold">Stack:</span>
          <span>Next.js 14</span>
          <span className="text-slate-700">·</span>
          <span>TypeScript</span>
          <span className="text-slate-700">·</span>
          <span>Node.js</span>
          <span className="text-slate-700">·</span>
          <span>PostgreSQL 16</span>
          <span className="text-slate-700">·</span>
          <span>Redis 7</span>
          <span className="text-slate-700">·</span>
          <span>BullMQ</span>
          <span className="text-slate-700">·</span>
          <span>Safaricom Daraja API</span>
          <span className="text-slate-700">·</span>
          <span>Tailwind CSS</span>
        </div>

        {/* 2-Column Split: Challenge & Solution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          
          {/* The Engineering Challenge */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3 text-amber-400">
                <Zap className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold text-white tracking-tight">The Engineering Challenge</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Safaricom’s Daraja API webhook callbacks frequently fire out of order, retry aggressively on slow responses, or encounter network drops during mobile client handoffs. If two callbacks hit simultaneously, race conditions in standard databases cause duplicate payment receipts, double-charging, and inventory inconsistencies.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Failure Mode: Database Race Conditions</span>
              <span className="text-rose-400 font-mono">Risk: Double Billing</span>
            </div>
          </div>

          {/* The Technical Solution & Trade-offs */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3 text-emerald-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold text-white tracking-tight">The Technical Solution &amp; Trade-offs</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Engineered a distributed idempotency pipeline using Redis atomic set-if-not-exists (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-xs font-mono">SETNX</code>) with a 60-second TTL keyed on the M-Pesa transaction reference (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-xs font-mono">TransID</code>). Wrapped checkout inventory decrement in PostgreSQL row-level locks (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-xs font-mono">SELECT ... FOR UPDATE</code>) inside explicit transaction boundaries.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Resolution: RAM Lock + Pessimistic DB TX</span>
              <span className="text-emerald-400 font-mono">Result: Zero Overselling</span>
            </div>
          </div>
        </div>

        {/* Measurable Production Metrics */}
        <div className="mb-10">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
            Measurable Production Metrics
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                99.98%
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Webhook Processing Success Rate
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Across 185,000+ callbacks</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                0
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Duplicate Billing Incidents
              </div>
              <div className="text-[11px] text-slate-500 mt-1">100% duplicate rejection</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                4,200+
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Weekly Active Shoppers Handled
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Nairobi metro &amp; diaspora</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                &lt; 95ms
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                p95 API Checkout Response
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Safaricom ACK in &lt; 85ms</div>
            </div>

          </div>
        </div>

        {/* System Constraints & SLOs */}
        <div className="mb-10">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
            System Constraints &amp; Service Level Objectives (SLOs)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-emerald-400 uppercase">SLO #1</div>
                <div className="text-sm font-semibold text-white mt-0.5">Zero Double Billing Tolerance</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Zero tolerance for double billing or lost payments during mobile network handoffs and carrier retries.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-emerald-400 uppercase">SLO #2</div>
                <div className="text-sm font-semibold text-white mt-0.5">Sub-2-Second Checkout</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Sub-2-second end-to-end checkout experience on mobile 3G/4G connections across Safaricom network.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-emerald-400 uppercase">SLO #3</div>
                <div className="text-sm font-semibold text-white mt-0.5">Morning Harvest Drop Bursts</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  High-concurrency ordering bursts during 06:00 AM farm produce harvest drops with guaranteed stock integrity.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Deep Architectural Highlights 3-Pillars */}
        <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 mb-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-4">
            Deep Architectural Highlights
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs flex items-center justify-center font-mono">1</span>
                Atomic Webhook Deduplication
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Implemented cryptographic payload verification and Redis distributed locks to reject duplicate payment payloads before database mutation.
              </p>
            </div>
            <div>
              <div className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs flex items-center justify-center font-mono">2</span>
                Row-Level Inventory Protection
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Used PostgreSQL explicit pessimistic locking (<code className="text-emerald-400 font-mono text-[11px]">FOR UPDATE</code>) to prevent overselling of high-demand agricultural yields during concurrent flash sales.
              </p>
            </div>
            <div>
              <div className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs flex items-center justify-center font-mono">3</span>
                Decoupled Async Message Workers
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Offloaded SMS delivery notifications and dispatch routing tasks to background BullMQ queues, keeping API endpoint response times below 85ms.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Action CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onLaunchSimulator}
            className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            Launch Live Simulation Lab
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreArchitecture}
            className="px-4 py-2.5 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Explore Topology Diagram
          </button>
          <button
            onClick={onInspectCode}
            className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Inspect Source Code on GitHub
          </button>
        </div>

      </div>
    </section>
  );
};
