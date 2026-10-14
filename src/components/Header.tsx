import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSandbox: () => void;
  onOpenCode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSandbox,
  onOpenCode
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left text-slate-100 hover:text-white transition-colors shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              KF
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              KilimoFresh Systems
            </span>
          </button>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              onClick={() => setActiveTab('overview')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'overview' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Architecture Map
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'simulator' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Race Simulator
            </button>
            <button
              onClick={() => setActiveTab('storefront')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'storefront' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Live Harvest Store
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'metrics' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              SLO & Metrics
            </button>
            <button
              onClick={onOpenCode}
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              Source Code
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSandbox}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Test Idempotency Engine
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
