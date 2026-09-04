import React from 'react';
import { Radio, Database, ShieldAlert, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { AppOperationalMode, DataSourceStatus, MonitoringStation } from '../types';
import { getStationConfig } from '../config/stationConfigs';

interface DataSourceBadgeProps {
  station?: MonitoringStation;
  mode?: AppOperationalMode;
  sourceType?: 'cwc' | 'imd' | 'dam' | 'river' | 'overall';
  className?: string;
  showFullDetails?: boolean;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  station,
  mode = 'SIMULATION',
  sourceType = 'overall',
  className = '',
  showFullDetails = false,
}) => {
  const currentMode: AppOperationalMode = station?.dataMode || mode;
  const sourceStatus: DataSourceStatus = station?.dataSourceStatus || (currentMode === 'LIVE' ? 'LIVE_DATA' : 'SIMULATED_DATA');
  const stationConfig = station ? getStationConfig(station.id) : null;

  // Determine badge styling and label
  let badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  let dotColor = 'bg-amber-400';
  let label = 'SIMULATED DATA';

  if (currentMode === 'LIVE') {
    if (sourceStatus === 'LIVE_DATA') {
      badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      dotColor = 'bg-emerald-400';
      label = 'LIVE DATA';
    } else if (sourceStatus === 'DATA_UNAVAILABLE') {
      badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
      dotColor = 'bg-slate-500';
      label = 'DATA UNAVAILABLE';
    } else if (sourceStatus === 'STALE_DATA') {
      badgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      dotColor = 'bg-rose-400';
      label = 'STALE DATA';
    }
  }

  // Get specific source description based on sourceType
  let sourceText = station?.cwcStationName || station?.waterLevelSource || 'Central Water Commission (CWC)';
  if (sourceType === 'imd') {
    sourceText = station?.imdStationName || station?.rainfallSource || 'India Meteorological Department (IMD)';
  } else if (sourceType === 'dam') {
    sourceText = stationConfig?.upstreamDamConfig?.sourceAttribution || station?.upstreamDam?.sourceAttribution || 'State WRD / Dam Telemetry';
  }

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${badgeColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${currentMode === 'LIVE' ? 'animate-pulse' : ''}`} />
        <span>{label}</span>
        {currentMode === 'SIMULATION' && (
          <span className="text-[9px] font-normal opacity-80 uppercase tracking-tighter">
            (NOT REAL-TIME)
          </span>
        )}
      </div>

      {showFullDetails && (
        <div className="text-[10px] font-mono text-slate-400 flex flex-col gap-0.5 mt-0.5">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Source:</span>
            <span className="text-slate-300 font-semibold truncate">
              {currentMode === 'LIVE' ? sourceText : 'Hydrological Simulation Engine'}
            </span>
          </div>
          {station?.thresholdSource && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Thresholds:</span>
              <span className="text-cyan-400/90">{station.thresholdSource}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const OperationalModeBanner: React.FC<{ mode: AppOperationalMode; onSwitchMode?: () => void }> = ({
  mode,
  onSwitchMode,
}) => {
  if (mode === 'SIMULATION') {
    return (
      <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-mono">
          <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <strong className="font-bold uppercase tracking-wider">
              SIMULATED LIVE DATA — NOT REAL-TIME
            </strong>
            <p className="text-[11px] text-amber-300/80 font-sans mt-0.5">
              Continuously simulated hydrological values for testing scenarios and emergency decision-support training.
            </p>
          </div>
        </div>
        {onSwitchMode && (
          <button
            onClick={onSwitchMode}
            className="self-start sm:self-auto px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-mono text-[11px] transition-colors cursor-pointer"
          >
            Switch to LIVE DATA Mode →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 text-emerald-300 font-mono">
        <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
        <div>
          <strong className="font-bold uppercase tracking-wider">
            LIVE DATA MODE — OFFICIAL DATA SOURCES
          </strong>
          <p className="text-[11px] text-emerald-300/80 font-sans mt-0.5">
            Real telemetry from Central Water Commission (CWC) & India Meteorological Department (IMD).
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 italic hidden md:inline">
          Decision-support prototype
        </span>
        {onSwitchMode && (
          <button
            onClick={onSwitchMode}
            className="self-start sm:self-auto px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/60 font-mono text-[11px] transition-colors cursor-pointer"
          >
            Switch to Simulation Mode →
          </button>
        )}
      </div>
    </div>
  );
};
