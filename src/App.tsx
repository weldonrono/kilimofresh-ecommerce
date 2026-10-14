import React, { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { SimulationSandbox } from './components/SimulationSandbox';
import { LiveStorefrontPreview } from './components/LiveStorefrontPreview';
import { ProductionMetricsSLODashboard } from './components/ProductionMetricsSLODashboard';
import { CodeInspector } from './components/CodeInspector';
import { Footer } from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'storefront' | 'metrics' | 'code'>('overview');
  const [showCodeModal, setShowCodeModal] = useState(false);

  const handleOpenSandbox = () => {
    setActiveTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCode = () => {
    setActiveTab('code');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToTop = () => {
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Bar Contract compliant Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        onOpenSandbox={handleOpenSandbox}
        onOpenCode={handleOpenCode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Hero Section always visible on overview, or contextual on other tabs */}
        {activeTab === 'overview' && (
          <>
            <HeroSection
              onLaunchSimulator={handleOpenSandbox}
              onExploreArchitecture={() => {
                const el = document.getElementById('architecture-diagram-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onInspectCode={handleOpenCode}
            />

            <div id="architecture-diagram-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
              
              {/* Interactive Architecture Section */}
              <section>
                <div className="mb-6">
                  <div className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    System Architecture Explorer
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    End-to-End Pipeline &amp; Component Breakdown
                  </h2>
                </div>
                <ArchitectureDiagram />
              </section>

              {/* Quick Jump to Simulator & Storefront Banner */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Live Testing Lab</span>
                    <h3 className="text-xl font-bold text-white mt-1">Race Condition &amp; Concurrency Sandbox</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      Fire 2 to 10 concurrent Daraja webhooks simultaneously and test whether Redis SETNX prevents double-charging and duplicate order generation.
                    </p>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('simulator')}
                      className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                    >
                      Open Simulator Lab &rarr;
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-sky-400 uppercase">Interactive Storefront</span>
                    <h3 className="text-xl font-bold text-white mt-1">KilimoFresh 06:00 AM Harvest Drop</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      Experience the Kenyan farm produce e-commerce experience with simulated Safaricom M-Pesa STK Push PIN authorization.
                    </p>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('storefront')}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Launch Harvest Store &rarr;
                    </button>
                  </div>
                </div>
              </section>

              {/* SLO Dashboard Section Preview */}
              <section className="pt-4">
                <ProductionMetricsSLODashboard />
              </section>

            </div>
          </>
        )}

        {/* Dedicated Sandbox Tab */}
        {activeTab === 'simulator' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <SimulationSandbox />
          </div>
        )}

        {/* Dedicated Storefront Tab */}
        {activeTab === 'storefront' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <LiveStorefrontPreview />
          </div>
        )}

        {/* Dedicated Metrics & SLO Tab */}
        {activeTab === 'metrics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <ProductionMetricsSLODashboard />
          </div>
        )}

        {/* Dedicated Source Code Tab */}
        {activeTab === 'code' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <CodeInspector onClose={() => setActiveTab('overview')} />
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        onInspectCode={handleOpenCode}
        onResetToTop={handleResetToTop}
      />

    </div>
  );
}
