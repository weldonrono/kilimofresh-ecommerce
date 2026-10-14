import React, { useState } from 'react';
import { ARCHITECTURE_NODES } from '../data/mockData';
import { ArchitectureNode } from '../types/architecture';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Copy, 
  Check, 
  Smartphone, 
  Radio, 
  Server, 
  Cpu, 
  Database, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode>(ARCHITECTURE_NODES[3]); // Default to Redis Lock
  const [activeTraceStep, setActiveTraceStep] = useState<number | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const startTrace = () => {
    if (isTracing) return;
    setIsTracing(true);
    setActiveTraceStep(0);

    const steps = [0, 1, 2, 3, 4, 5];
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setActiveTraceStep(step);
        setSelectedNode(ARCHITECTURE_NODES[step]);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setIsTracing(false);
          }, 1200);
        }
      }, idx * 1100);
    });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'edge':
        return <Smartphone className="w-5 h-5 text-sky-400" />;
      case 'external':
        return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'gateway':
        return <Server className="w-5 h-5 text-indigo-400" />;
      case 'cache':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'database':
        return <Database className="w-5 h-5 text-emerald-400" />;
      case 'queue':
        return <Layers className="w-5 h-5 text-purple-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Distributed System Architecture Topology
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive pipeline showing atomic Redis idempotency locks, Postgres row-level locks, and async BullMQ queues.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={startTrace}
            disabled={isTracing}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
              isTracing 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isTracing ? 'animate-spin' : ''}`} />
            {isTracing ? 'Simulating Webhook Trace...' : 'Trace M-Pesa Pipeline'}
          </button>
          <button
            onClick={() => {
              setActiveTraceStep(null);
              setIsTracing(false);
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            title="Reset Trace"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Topology Flow Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ARCHITECTURE_NODES.map((node, index) => {
          const isSelected = selectedNode.id === node.id;
          const isTraceActive = activeTraceStep === index;

          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isTraceActive
                  ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50'
                  : isSelected
                  ? 'bg-slate-900 border-slate-600 ring-1 ring-slate-500'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    STEP 0{index + 1}
                  </span>
                  {getNodeIcon(node.category)}
                </div>
                <div className="text-xs font-bold text-white tracking-tight line-clamp-1">
                  {node.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {node.subname}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-emerald-400">
                {node.metrics.latency}
              </div>

              {isTraceActive && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Node Deep Dive Inspector */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {selectedNode.subname}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">{selectedNode.tech}</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {selectedNode.name}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
              <span className="text-slate-400">Latency: </span>
              <span className="text-emerald-400 font-semibold">{selectedNode.metrics.latency}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
              <span className="text-slate-400">Throughput: </span>
              <span className="text-white font-semibold">{selectedNode.metrics.throughput}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
              <span className="text-slate-400">Resilience: </span>
              <span className="text-emerald-400 font-semibold">{selectedNode.metrics.resilience}</span>
            </div>
          </div>
        </div>

        {/* Node Details & Code */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Architecture Role &amp; Responsibility
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-1">Execution In Pipeline Flow</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedNode.roleInFlow}
              </p>
            </div>

            {selectedNode.id === 'redis-lock' && (
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-xs font-bold text-emerald-300 mb-1">Why SETNX Over DB Unique Keys?</div>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  PostgreSQL unique constraints require starting a relational transaction, taking an index lock, and rolling back upon duplicate collision. Under morning flash sales, 15 duplicate callbacks per second would saturate the database connection pool. Redis SETNX completes in 1.2ms in memory.
                </p>
              </div>
            )}

            {selectedNode.id === 'postgres-db' && (
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-xs font-bold text-emerald-300 mb-1">Why SELECT ... FOR UPDATE?</div>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  When 15 shoppers click "Pay" for 5 available Hass Avocado crates at 06:00:01 AM, optimistic locking causes 14 aborts and costly retries. Explicit row-level locking serializes stock decrement in sequence, cleanly serving the first 5 and declining the rest without overselling.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400">
                  {selectedNode.id}.implementation.ts
                </span>
                <button
                  onClick={() => handleCopy(selectedNode.codeSnippet)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[360px]">
                <code>{selectedNode.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
