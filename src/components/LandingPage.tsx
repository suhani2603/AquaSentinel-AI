import React from 'react';
import { 
  Waves, 
  ShieldAlert, 
  Dam, 
  Bot, 
  SlidersHorizontal, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  LogIn, 
  Eye, 
  AlertTriangle,
  Database
} from 'lucide-react';
import { MonitoringStation } from '../types';
import { getRiskBadgeClasses, formatNumber } from '../utils/hydrology';

interface LandingPageProps {
  onSignIn: () => void;
  onContinueAsGuest: () => void;
  stations: MonitoringStation[];
  onSelectStation: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onContinueAsGuest,
  stations,
  onSelectStation,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                AquaSentinel
              </span>
              <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                HYDROLOGICAL AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-guest-btn"
              onClick={onContinueAsGuest}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Explore as Guest
            </button>
            <button
              id="landing-signin-btn"
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-950 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Core Notice Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI-Powered River, Dam & Flood Risk Decision Support</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Real-Time River Telemetry. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Grounded Hydrological Intelligence.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            AquaSentinel monitors river discharge, gauge water levels, and upstream dam releases. 
            Powered by Gemini AI, it delivers transparent risk analytics and what-if flood routing simulations.
          </p>
        </div>

        {/* Mandatory Transparency Notice Banner */}
        <div className="max-w-4xl mx-auto mb-12 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-slate-300 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">
                Transparency & Hydrological Grounding Commitment
              </p>
              <p className="text-slate-400 leading-relaxed">
                AquaSentinel strictly separates <strong>real measured sensor telemetry</strong> (flow in m³/s, gauge stage in meters), <strong>calculated risk indicators</strong> (0-100 algorithmic score), and <strong>AI explanatory assessments / hypothetical simulations</strong>. This application is a decision-support and situational awareness tool, <strong className="text-slate-200">not an official government flood evacuation warning</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            id="hero-signin-cta"
            onClick={onSignIn}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-xl shadow-cyan-900/40 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Access Private Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <button
            id="hero-guest-cta"
            onClick={onContinueAsGuest}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Explore Live Basin Stations</span>
          </button>
        </div>

        {/* Live Station Telemetry Teasers */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm uppercase tracking-wider font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Monitoring Stations Telemetry
            </h2>
            <span className="text-xs font-mono text-slate-500">6 Global Basins Connected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stations.slice(0, 3).map((station) => {
              const badge = getRiskBadgeClasses(station.riskLevel);
              return (
                <div
                  key={station.id}
                  onClick={() => {
                    onSelectStation(station.id);
                    onContinueAsGuest();
                  }}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-cyan-950/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {station.city}, {station.country}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {station.riverName} • {station.gaugeStationName}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${badge.bg} ${badge.border}`}>
                      {station.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-900 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">RIVER FLOW</span>
                      <span className="font-bold text-slate-200">
                        {formatNumber(station.currentFlow)} m³/s
                      </span>
                      <span className={`text-[10px] block ${station.flowChangePercent > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {station.flowChangePercent > 0 ? '+' : ''}{station.flowChangePercent.toFixed(1)}% surge
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">WATER LEVEL</span>
                      <span className="font-bold text-slate-200">
                        {station.currentWaterLevel.toFixed(2)} m
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Warn: {station.warningStage.toFixed(2)}m
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="truncate">
                      Dam: {station.upstreamDam ? station.upstreamDam.name : 'None'}
                    </span>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      Inspect →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300">
            <Waves className="w-5 h-5 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-slate-100 text-sm mb-1">River Hydrographs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track 24h discharge trends, stage elevations, surge percentages, and rapid increases.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300">
            <Dam className="w-5 h-5 text-blue-400 mb-2" />
            <h3 className="font-semibold text-slate-100 text-sm mb-1">Dam & Barrage Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor spillway releases, gate configurations, and hydraulic wave lag times.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300">
            <SlidersHorizontal className="w-5 h-5 text-purple-400 mb-2" />
            <h3 className="font-semibold text-slate-100 text-sm mb-1">What-If Simulation Lab</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Model hypothetical flow surges, dam release spikes, and rainfall deltas in real-time.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300">
            <Bot className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="font-semibold text-slate-100 text-sm mb-1">Gemini AI Assistant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inquire about risk drivers, historical comparisons, and receive grounded situation summaries.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <p>AquaSentinel Hydrological Monitoring • Powered by Google Gemini AI & Firebase Firestore</p>
      </footer>
    </div>
  );
};
