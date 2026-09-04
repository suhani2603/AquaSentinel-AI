import React, { useState } from 'react';
import { 
  Waves, 
  Activity, 
  Dam, 
  CloudRain, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  SlidersHorizontal, 
  Download, 
  Info,
  Clock,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  BarChart3,
  Layers,
  MapPin
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { MonitoringStation, ViewMode } from '../types';
import { getRiskBadgeClasses, formatNumber, formatStage, formatRainfall } from '../utils/hydrology';
import { fetchBasinSummary } from '../utils/gemini';
import { exportStationReportJSON, exportStationReportMarkdown } from '../utils/storage';

interface DashboardViewProps {
  station: MonitoringStation;
  onViewChange: (view: ViewMode) => void;
  onSelectStation: (id: string) => void;
  allStations: MonitoringStation[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  station,
  onViewChange,
  onSelectStation,
  allStations,
}) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [basinSummary, setBasinSummary] = useState<{ summary: string; keyPoints: string[] } | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'flow' | 'stage' | 'rainfall' | 'dam'>('flow');

  const riskBadge = getRiskBadgeClasses(station.riskLevel);
  const dam = station.upstreamDam;

  // Percentage of stage compared to critical stage
  const stagePercent = Math.min(
    Math.round((station.currentWaterLevel / (station.criticalStage * 1.05)) * 100),
    100
  );

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetchBasinSummary(station);
      setBasinSummary(res);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 7-day observation time series for charts
  const historyData = (station.history || []).map((h, i) => {
    return {
      index: i,
      displayTime: h.displayTime || h.timestamp.slice(5, 16).replace('T', ' '),
      flow: h.river_flow_m3s,
      stage: h.water_level_m,
      rainfall: h.rainfall_mm,
      damRelease: h.dam_release_m3s,
      warningStage: station.warningStage,
      criticalStage: station.criticalStage
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Station Header Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              STATION: {station.city.toUpperCase()}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 font-semibold">
              SAMPLE DATA — NOT LIVE
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Cycle: {new Date(station.lastTelemetryUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {station.city}, {station.stateOrRegion}
            <span className="text-lg font-normal text-slate-400">
              — {station.riverName}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
            {station.focusDescription}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-whatif-btn"
            onClick={() => onViewChange('whatif')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate What-If</span>
          </button>

          <button
            id="dash-ai-assistant-btn"
            onClick={() => onViewChange('assistant')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold border border-cyan-700/60 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Gemini AI</span>
          </button>

          <div className="relative group">
            <button
              id="dash-export-menu-btn"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Export Station Data"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-20 text-xs font-mono">
              <button
                onClick={() => exportStationReportMarkdown(station)}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
              >
                Export as Markdown
              </button>
              <button
                onClick={() => exportStationReportJSON(station)}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rapid Surge Warning Banner (if triggered) */}
      {(station.isRapidIncrease || station.flowChangePercent >= 25) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-600/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-900/80 text-rose-300 border border-rose-500/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-rose-300">
                  RAPID FLOW INCREASE DETECTED
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-900 text-white font-bold">
                  +{station.flowChangePercent.toFixed(1)}% SURGE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                River discharge jumped abruptly from <strong>{formatNumber(station.previousFlow)} m³/s</strong> to <strong>{formatNumber(station.currentFlow)} m³/s</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewChange('alerts')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-colors self-start sm:self-auto cursor-pointer"
          >
            Inspect Alerts →
          </button>
        </div>
      )}

      {/* 4 Core Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. River Discharge / Flow */}
        <div 
          onClick={() => onViewChange('river')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              River Discharge
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {formatNumber(station.currentFlow)}
            </span>
            <span className="text-xs text-slate-400 font-mono">m³/s</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Prev: {formatNumber(station.previousFlow)} m³/s
            </span>
            <span className={`font-bold flex items-center gap-0.5 ${station.flowChangePercent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {station.flowChangePercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {station.flowChangePercent > 0 ? '+' : ''}{station.flowChangePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 2. River Stage / Water Level */}
        <div 
          onClick={() => onViewChange('river')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-sky-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              River Stage (Level)
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {station.currentWaterLevel.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">meters</span>
          </div>

          {/* Stage Progress Bar against Critical Stage */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Norm: {station.normalStage.toFixed(1)}m</span>
              <span>Warn: {station.warningStage.toFixed(1)}m</span>
              <span className="text-rose-400 font-bold">Crit: {station.criticalStage.toFixed(1)}m</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all ${
                  station.currentWaterLevel >= station.criticalStage
                    ? 'bg-rose-500'
                    : station.currentWaterLevel >= station.warningStage
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${stagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Upstream Dam / Barrage */}
        <div 
          onClick={() => onViewChange('dam')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Dam className="w-4 h-4 text-blue-400" />
              Upstream Dam Release
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>

          {dam && dam.isAvailable && dam.dischargeM3s !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {formatNumber(dam.dischargeM3s)}
                </span>
                <span className="text-xs text-slate-400 font-mono">m³/s</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 font-medium truncate">
                {dam.name}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{dam.distanceUpstreamKm} km upstream</span>
                <span className="text-blue-300">~{dam.travelTimeToStationHours}h lag</span>
              </div>
            </>
          ) : (
            <div className="py-1">
              <span className="text-sm font-semibold text-slate-300 block">
                {dam?.name || 'Local Catchment Basin'}
              </span>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 text-[11px] font-mono">
                Data unavailable (Rainfall driven)
              </span>
            </div>
          )}
        </div>

        {/* 4. Calculated Flood Risk Indicator */}
        <div 
          onClick={() => onViewChange('risk')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-lg ${riskBadge.bg} ${riskBadge.border}`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4" />
              Risk Index (0-100)
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black font-mono">
              {station.riskScore}
              <span className="text-xs font-normal opacity-70">/100</span>
            </span>
            <span className="text-sm font-mono font-extrabold px-2.5 py-1 rounded bg-slate-950/60 border border-current">
              {station.riskLevel}
            </span>
          </div>
          <div className="mt-3 text-[11px] font-mono opacity-90 truncate">
            Driver: <span className="font-semibold">{station.riskFactors.dominantDriver}</span>
          </div>
        </div>
      </div>

      {/* 7-Day Multi-Metric Observation Charts */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              7-Day Hydrological Observation Time Series
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Historical trends at {station.gaugeStationName} ({historyData.length} observations)
            </p>
          </div>

          {/* Chart Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveChartTab('flow')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'flow' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              River Flow
            </button>
            <button
              onClick={() => setActiveChartTab('stage')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'stage' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Water Level
            </button>
            <button
              onClick={() => setActiveChartTab('rainfall')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'rainfall' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rainfall
            </button>
            <button
              onClick={() => setActiveChartTab('dam')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'dam' ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dam Release
            </button>
          </div>
        </div>

        {/* Dynamic Chart Display based on Tab */}
        <div className="h-72 w-full pt-2">
          {activeChartTab === 'flow' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-xl font-mono text-xs space-y-1">
                          <p className="text-slate-400 font-semibold mb-1">{data.displayTime}</p>
                          <p className="text-cyan-400">
                            River Flow: <span className="font-bold">{data.flow?.toLocaleString()} m³/s</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="flow" stroke="#06b6d4" strokeWidth={2.5} fill="url(#flowGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'stage' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-xl font-mono text-xs space-y-1">
                          <p className="text-slate-400 font-semibold mb-1">{data.displayTime}</p>
                          <p className="text-sky-300">
                            Stage: <span className="font-bold">{data.stage?.toFixed(2)} m</span>
                          </p>
                          <p className="text-amber-400 text-[10px]">
                            Warning Mark: {station.warningStage.toFixed(2)}m
                          </p>
                          <p className="text-rose-400 text-[10px]">
                            Danger Mark: {station.criticalStage.toFixed(2)}m
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={station.warningStage} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warning Mark', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={station.criticalStage} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Danger Mark', fill: '#f43f5e', fontSize: 10 }} />
                <Line type="monotone" dataKey="stage" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'rainfall' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-xl font-mono text-xs space-y-1">
                          <p className="text-slate-400 font-semibold mb-1">{data.displayTime}</p>
                          <p className="text-indigo-400">
                            Precipitation: <span className="font-bold">{data.rainfall?.toFixed(1)} mm</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rainfall" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'dam' && (
            dam && dam.isAvailable && dam.dischargeM3s !== null ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="damGradient" x1="0" y1="0" x2="0" y2="1">
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
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-xl font-mono text-xs space-y-1">
                            <p className="text-slate-400 font-semibold mb-1">{data.displayTime}</p>
                            <p className="text-blue-400">
                              Dam Release: <span className="font-bold">{data.damRelease ? `${data.damRelease.toLocaleString()} m³/s` : 'Data unavailable'}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="damRelease" stroke="#3b82f6" strokeWidth={2.5} fill="url(#damGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs space-y-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <Dam className="w-8 h-8 text-slate-600" />
                <p>Data unavailable — No direct upstream storage dam controls {station.city} ({station.riverName}).</p>
                <p className="text-[11px] text-slate-600">This basin is driven by foothill rainfall runoff & local streams.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* AI Situational Briefing Generator Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-900/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Gemini AI Hydrological Situation Briefing
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Automated executive summary grounded in current {station.city} telemetry
              </p>
            </div>
          </div>

          <button
            id="generate-briefing-btn"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
            <span>{isGeneratingSummary ? 'Analyzing Telemetry...' : 'Generate AI Briefing'}</span>
          </button>
        </div>

        {basinSummary ? (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-cyan-800/40 text-xs text-slate-300 space-y-2">
            <p className="leading-relaxed whitespace-pre-line font-medium text-slate-200">
              {basinSummary.summary}
            </p>
            {basinSummary.keyPoints.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold">Key Telemetry Takeaways:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono">
                  {basinSummary.keyPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>Grounded in measured sensor data</span>
              <button
                onClick={() => onViewChange('assistant')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Discuss with AquaSentinel Assistant →
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
            <span>Click "Generate AI Briefing" to produce a contextual hydrological evaluation.</span>
            <button
              onClick={() => onViewChange('assistant')}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-xs cursor-pointer"
            >
              Open Full Chat →
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
