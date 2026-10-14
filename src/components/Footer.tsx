import React from 'react';
import { ArrowUp, Github, ExternalLink } from 'lucide-react';

interface FooterProps {
  onInspectCode: () => void;
  onResetToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onInspectCode, onResetToTop }) => {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-850">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                KF
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                KilimoFresh Systems Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Resilient distributed e-commerce &amp; M-Pesa webhook idempotency engine engineered with Redis SETNX, PostgreSQL row-level locks, and BullMQ worker queues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <button
              onClick={onInspectCode}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" />
              <span>Inspect Source on GitHub</span>
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={onResetToTop}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Role: Full-Stack System Architect &amp; Developer</span>
            <span>·</span>
            <span>Nairobi, Kenya &amp; Global Cloud</span>
          </div>

          <div>
            KilimoFresh Technical Case Study &copy; 2026. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
};
