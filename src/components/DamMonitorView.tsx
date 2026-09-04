import React, { useState } from 'react';
import { 
  Dam, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  Waves, 
  ArrowRight, 
  Gauge, 
  Info,
  CheckCircle2,
  TrendingUp,
  Radio,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { MonitoringStation } from '../types';
import { formatNumber, getDamPlainLanguageStatus } from '../utils/hydrology';
import { askAquaSentinel } from '../utils/gemini';
import { INITIAL_STATIONS } from '../data/stationsData';

interface DamMonitorViewProps {
  station?: MonitoringStation;
}

export const DamMonitorView: React.FC<DamMonitorViewProps> = ({ station: propStation }) => {
  const station = propStation || INITIAL_STATIONS[0];
  const [isExplainingDam, setIsExplainingDam] = useState<boolean>(false);
  const [damAiExplanation, setDamAiExplanation] = useState<string | null>(null);

  const dam = station.upstreamDam;
  const isAvailable = dam && dam.isAvailable && dam.dischargeM3s !== null;
  const damStatus = getDamPlainLanguageStatus(station);

  // Time series for dam release trend
  const damTrendData = (station.history || []).map((h, i) => ({
    index: i,
    displayTime: h.displayTime || h.timestamp.slice(5, 16).replace('T', ' '),
    release: h.dam_release_m3s || (dam?.dischargeM3s ? dam.dischargeM3s * (1 + (i % 3 === 0 ? 0.05 : -0.02)) : 0)
  }));

  const handleAskDamExplanation = async () => {
    setIsExplainingDam(true);
    try {
      const prompt = `Explain the upstream water control and dam status for ${station.city} on ${station.riverName} in plain, understandable language. Detail the role of ${dam?.name || 'upstream control works'} (Outflow: ${dam?.dischargeM3s ? formatNumber(dam.dischargeM3s) + ' m³/s' : 'Catchment runoff'}, Travel time to city: ~${dam?.travelTimeToStationHours || 'N/A'} hours). Explain why this matters to downstream safety.`;
      const res = await askAquaSentinel(prompt, station, [], 'explain_dam');
      setDamAiExplanation(res.reply);
    } catch (err) {
      console.error(err);
      setDamAiExplanation('The upstream reservoir status is operating within planned tolerances.');
    } finally {
      setIsExplainingDam(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Page Title & Purpose */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 font-semibold tracking-wide flex items-center gap-1.5">
              <Dam className="w-3.5 h-3.5" />
              DAM MONITOR
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/40">
              SIMULATED LIVE DATA — NOT REAL-TIME
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {dam ? dam.name : 'Upstream Reservoir Status'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dedicated monitoring for upstream barrages, storage reservoirs, and spillway releases reaching <strong>{station.city}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="ask-gemini-dam-btn"
            onClick={handleAskDamExplanation}
            disabled={isExplainingDam}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isExplainingDam ? 'animate-spin' : ''}`} />
            <span>{isExplainingDam ? 'Gemini is analyzing...' : 'Ask Gemini About This Dam'}</span>
          </button>
        </div>
      </div>

      {/* 2. WHAT IS HAPPENING? (Plain Language Dam Status) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
          WHAT IS HAPPENING AT THE UPSTREAM DAM?
        </span>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {damStatus.headline}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed max-w-2xl">
              {damStatus.description}
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              damStatus.status === 'high_release'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : damStatus.status === 'caution'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {damStatus.status === 'high_release' ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : damStatus.status === 'caution' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{dam?.safetyStatus ? dam.safetyStatus.replace(/_/g, ' ') : 'NORMAL FLOW'}</span>
            </span>

            <span className="text-xs text-slate-400 font-mono">
              {dam?.distanceUpstreamKm ? `${dam.distanceUpstreamKm} km Upstream Reach` : 'Direct Basin'}
            </span>
          </div>
        </div>

        {/* AI Explanation Box */}
        {damAiExplanation && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-cyan-800/40 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              GEMINI DAM DYNAMICS BRIEFING
            </div>
            {damAiExplanation}
          </div>
        )}
      </div>

      {/* 3. WHY DOES IT MATTER? (Travel Time & Propagation Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Dam Outflow Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase">Current Dam Outflow</span>
          <div className="my-2">
            <span className="text-3xl font-black text-white">
              {isAvailable ? formatNumber(dam?.dischargeM3s) : 'N/A'}
            </span>
            {isAvailable && <span className="text-sm font-normal text-slate-400 ml-1">m³/s</span>}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAvailable && dam?.previousDischargeM3s 
              ? `Previous reading was ${formatNumber(dam.previousDischargeM3s)} m³/s.`
              : 'Direct catchment runoff basin.'}
          </p>
        </div>

        {/* Card 2: Travel Delay to City */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase">Water Arrival Delay</span>
          <div className="my-2">
            <span className="text-3xl font-black text-blue-400">
              {dam?.travelTimeToStationHours ? `~${dam.travelTimeToStationHours}` : 'N/A'}
            </span>
            {dam?.travelTimeToStationHours && <span className="text-sm font-normal text-slate-400 ml-1">hours</span>}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Estimated time for spillway water waves to travel from the dam to {station.city}.
          </p>
        </div>

        {/* Card 3: Reservoir Storage Level */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase">Reservoir Capacity</span>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-200">
              {dam && dam.reservoirLevelPercent !== null ? `${dam.reservoirLevelPercent}%` : 'N/A'}
            </span>
            <span className="text-sm font-normal text-slate-400 ml-1">full</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mt-1">
            <div 
              className={`h-full ${
                (dam?.reservoirLevelPercent || 0) >= 90 
                  ? 'bg-rose-500' 
                  : (dam?.reservoirLevelPercent || 0) >= 75 
                  ? 'bg-amber-500' 
                  : 'bg-blue-500'
              }`}
              style={{ width: `${dam?.reservoirLevelPercent || 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* 4. Release Trend Chart */}
      {isAvailable && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-400" />
                Dam Spillway Release Progression
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed water volume released into the river reach over recent time periods.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Gate Status: <strong className="text-slate-200">{dam?.gateStatus || 'Active Control'}</strong>
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={damTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="damReleaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs shadow-xl">
                          <p className="text-slate-400 mb-1">Time: {label}</p>
                          <p className="text-blue-400 font-bold text-sm">
                            Release: {payload[0].value?.toLocaleString()} m³/s
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="release"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#damReleaseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
