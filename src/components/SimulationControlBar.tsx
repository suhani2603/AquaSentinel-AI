import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  SlidersHorizontal, 
  Radio, 
  Clock, 
  AlertTriangle,
  Waves,
  Dam,
  CloudRain,
  Activity,
  CheckCircle2,
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';
import { 
  SimulationScenarioId, 
  SimulationState, 
  SIMULATION_SCENARIOS 
} from '../services/simulationEngine';
import { AppOperationalMode, MonitoringStation } from '../types';
import { DataSourceBadge } from './DataSourceBadge';

interface SimulationControlBarProps {
  simulationState: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepNow: () => void;
  onSelectScenario: (scenarioId: SimulationScenarioId) => void;
  currentStation: MonitoringStation;
  operationalMode: AppOperationalMode;
  onToggleOperationalMode: (mode: AppOperationalMode) => void;
  onRefreshLive: () => void;
  isRefreshingLive?: boolean;
}

export const SimulationControlBar: React.FC<SimulationControlBarProps> = ({
  simulationState,
  onStart,
  onPause,
  onReset,
  onStepNow,
  onSelectScenario,
  currentStation,
  operationalMode,
  onToggleOperationalMode,
  onRefreshLive,
  isRefreshingLive = false,
}) => {
  const activeScenario = SIMULATION_SCENARIOS.find(
    (s) => s.id === simulationState.activeScenarioId
  ) || SIMULATION_SCENARIOS[0];

  // If in LIVE DATA MODE, render the live telemetry inspection banner
  if (operationalMode === 'LIVE') {
    return (
      <div className="w-full bg-slate-900/95 border-b border-emerald-900/40 shadow-2xl backdrop-blur-md sticky top-16 z-30">
        <div className="bg-emerald-950/50 border-b border-emerald-500/30 px-4 py-1.5 text-center text-xs font-mono font-bold text-emerald-300 flex flex-wrap items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide uppercase">
            LIVE DATA MODE — OFFICIAL HYDROLOGICAL OBSERVATION FEEDS
          </span>
          <span className="hidden md:inline text-emerald-400/80 font-normal">
            • Data ingested from CWC Telemetry & IMD Observatories (Cached 15m)
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Station Source Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <DataSourceBadge station={currentStation} mode="LIVE" showFullDetails={false} />
            
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-500">CWC:</span>
              <strong className="text-cyan-300">{currentStation.cwcStationName || 'CWC River Gauge'}</strong>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-500">IMD:</span>
              <strong className="text-indigo-300">{currentStation.imdStationName || 'IMD AWS'}</strong>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-500">Last Synced:</span>
              <strong className="text-slate-200">{currentStation.lastUpdated || 'Recent'}</strong>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="refresh-live-feeds-bar-btn"
              onClick={onRefreshLive}
              disabled={isRefreshingLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin' : ''}`} />
              <span>{isRefreshingLive ? 'Syncing...' : 'Refresh Live Feeds'}</span>
            </button>

            <button
              id="switch-to-simulation-bar-btn"
              onClick={() => onToggleOperationalMode('SIMULATION')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/50 text-xs font-mono transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Switch to Simulation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SIMULATION MODE
  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800 shadow-2xl backdrop-blur-md sticky top-16 z-30">
      
      {/* Top Banner: Mandatory Simulated Live Notice */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-mono font-bold text-amber-300 flex flex-wrap items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="tracking-wide uppercase">
          SIMULATED LIVE DATA — NOT REAL-TIME
        </span>
        <span className="hidden sm:inline text-amber-400/80 font-normal">
          • Mathematical hydrological evolution model for testing & demonstration
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Live Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Status Dot */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              simulationState.isRunning 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-950'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                simulationState.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`} />
              <span className={`w-2 h-2 rounded-full absolute ${
                simulationState.isRunning ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <span>{simulationState.isRunning ? 'SIMULATED LIVE' : 'PAUSED'}</span>
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Last:</span>
              <strong className="text-slate-200">{simulationState.lastUpdateTimestamp}</strong>
            </div>

            {/* Next Countdown */}
            {simulationState.isRunning && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/50 animate-pulse">
                <span>Next update in:</span>
                <strong className="font-extrabold text-cyan-200">{simulationState.countdownSeconds}s</strong>
              </div>
            )}
          </div>

          {/* Center/Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Play / Pause */}
            <button
              id="sim-play-pause-btn"
              onClick={simulationState.isRunning ? onPause : onStart}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${
                simulationState.isRunning
                  ? 'bg-amber-600/90 hover:bg-amber-500 text-white shadow-amber-950/50'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              {simulationState.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Live Sim</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Live Sim</span>
                </>
              )}
            </button>

            {/* Step 1 Step Now */}
            <button
              id="sim-step-now-btn"
              onClick={onStepNow}
              title="Calculate next 15-second simulation step immediately"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Step Now (+15s)</span>
            </button>

            {/* Reset to Baseline */}
            <button
              id="sim-reset-btn"
              onClick={onReset}
              title="Reset all stations to normal baseline values"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Switch to Live Data Mode */}
            <button
              id="sim-switch-to-live-btn"
              onClick={() => onToggleOperationalMode('LIVE')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-mono transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Switch to Live Data</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: 6 Selectable Simulation Scenarios */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-300">
              Simulation Scenario:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {SIMULATION_SCENARIOS.map((scenario) => {
              const isSelected = simulationState.activeScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  id={`scenario-btn-${scenario.id}`}
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm shadow-cyan-950'
                      : 'bg-slate-950 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{scenario.shortName || scenario.title}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
