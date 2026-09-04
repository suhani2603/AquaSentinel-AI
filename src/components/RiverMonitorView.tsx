import React, { useState, useMemo } from 'react';
import { 
  Waves, 
  CloudRain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Clock, 
  Database,
  Radio,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine
} from 'recharts';
import { MonitoringStation } from '../types';
import { formatNumber } from '../utils/hydrology';
import { INITIAL_STATIONS } from '../data/stationsData';
import { getStationRiverObservations, formatObservationTime } from '../utils/observationHistory';

interface RiverMonitorViewProps {
  station?: MonitoringStation;
  allStations?: MonitoringStation[];
  onSelectStation?: (stationId: string) => void;
}

export const RiverMonitorView: React.FC<RiverMonitorViewProps> = ({ 
  station: propStation,
  allStations,
  onSelectStation
}) => {
  const station = propStation || (allStations && allStations.length > 0 ? allStations[0] : INITIAL_STATIONS[0]);
  const [activeTab, setActiveTab] = useState<'level' | 'rainfall'>('level');

  // Strict verification: only display Warning & Danger lines if verified official thresholds exist
  const hasOfficialThresholds = 
    station.thresholdType === 'OFFICIAL_CWC' &&
    typeof station.warningStage === 'number' &&
    typeof station.criticalStage === 'number' &&
    station.warningStage > 0 &&
    station.criticalStage > 0;

  // Actual measured river observations during the past 7 days from connected source
  const observations = useMemo(() => {
    return getStationRiverObservations(station);
  }, [station]);

  const hasSufficientHistory = observations.length >= 2;

  // Trend calculations
  const flowDiff = station.previousFlow 
    ? station.currentFlow - station.previousFlow 
    : 0;
  const isRising = flowDiff > (station.currentFlow * 0.03);
  const isFalling = flowDiff < -(station.currentFlow * 0.03);

  const getTrendBadge = () => {
    if (isRising) {
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
          <TrendingUp className="w-3.5 h-3.5" /> Rising
        </span>
      );
    }
    if (isFalling) {
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
          <TrendingDown className="w-3.5 h-3.5" /> Falling
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
        <Minus className="w-3.5 h-3.5" /> Stable
      </span>
    );
  };

  // Rainfall intensity interpretation
  const getRainfallIntensity = () => {
    const rain = station.rainfall24h || 0;
    if (rain >= 65) return { label: 'Very Heavy Rainfall', explanation: 'Intense hill downpours. High runoff risk in low-lying channels.' };
    if (rain >= 30) return { label: 'Heavy Rainfall', explanation: 'Substantial rain recorded across the catchment hills.' };
    if (rain >= 15) return { label: 'Moderate Rain', explanation: 'Steady showers observed over the past 24 hours.' };
    if (rain > 0) return { label: 'Light Showers', explanation: 'Occasional light drizzle; no immediate threat of river surge.' };
    return { label: 'No Rain', explanation: 'Catchment is dry. River is sustained by baseflow.' };
  };

  const rainInfo = getRainfallIntensity();

  // Water level interpretation
  const getWaterLevelPlainLanguage = () => {
    const stage = station.currentWaterLevel;
    if (!hasOfficialThresholds) {
      return `Measured water level is currently ${stage.toFixed(2)} m. Official warning/danger thresholds are not designated for this tributary station.`;
    }
    const warning = station.warningStage;
    const critical = station.criticalStage;

    if (stage >= critical) {
      return `Critical water level! River is ${(stage - critical).toFixed(2)}m above danger mark. Immediate evacuation required in flood zones.`;
    }
    if (stage >= warning) {
      return `Warning level reached. River is within ${(critical - stage).toFixed(2)}m of the danger mark. Avoid riverbanks.`;
    }
    return `Flow is currently normal and stable. Water level is ${(warning - stage).toFixed(2)}m below the official warning mark.`;
  };

  // Format chart time-series data
  const chartData = useMemo(() => {
    return observations.map((obs) => ({
      time: obs.displayTime,
      rawTime: obs.timestamp,
      waterLevel: typeof obs.water_level_m === 'number' ? Number(obs.water_level_m.toFixed(2)) : null,
      flow: obs.river_flow_m3s,
      warning: hasOfficialThresholds ? station.warningStage : null,
      danger: hasOfficialThresholds ? station.criticalStage : null,
      city: obs.city || station.city,
      river: obs.river || station.riverName
    }));
  }, [observations, hasOfficialThresholds, station]);

  // Compute adaptive Y-axis domain
  const yDomain = useMemo(() => {
    const levels = chartData.map(d => d.waterLevel).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    if (levels.length === 0) return ['auto', 'auto'];

    let min = Math.min(...levels);
    let max = Math.max(...levels);

    if (hasOfficialThresholds) {
      min = Math.min(min, station.warningStage);
      max = Math.max(max, station.criticalStage);
      const padding = (max - min) * 0.1 || 0.4;
      return [
        Number(Math.max(0, min - padding).toFixed(2)),
        Number((max + padding).toFixed(2))
      ];
    } else {
      const diff = max - min;
      const padding = diff > 0 ? diff * 0.25 : 0.3;
      return [
        Number(Math.max(0, min - padding).toFixed(2)),
        Number((max + padding).toFixed(2))
      ];
    }
  }, [chartData, hasOfficialThresholds, station]);

  // Custom readable tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 text-zinc-100 p-3 rounded-xl shadow-lg border border-zinc-700 text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between text-zinc-400 pb-1.5 border-b border-zinc-800 text-[11px]">
            <span className="font-semibold text-zinc-200">{label}</span>
            <span className="text-[10px] text-zinc-400">{data.city}</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-blue-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Measured Level:
            </span>
            <span className="font-extrabold text-white text-sm">
              {typeof data.waterLevel === 'number' ? `${data.waterLevel.toFixed(2)} m` : '--'}
            </span>
          </div>
          {hasOfficialThresholds && (
            <div className="pt-1.5 border-t border-zinc-800/80 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-amber-400">
                <span>Official Warning Mark:</span>
                <span className="font-semibold">{station.warningStage.toFixed(2)} m</span>
              </div>
              <div className="flex items-center justify-between text-rose-400">
                <span>Official Danger Mark:</span>
                <span className="font-semibold">{station.criticalStage.toFixed(2)} m</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="river-rainfall-page" className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              River &amp; Rainfall Conditions
            </h2>
            {allStations && onSelectStation ? (
              <select
                aria-label="Select Monitoring Location"
                value={station.id}
                onChange={(e) => onSelectStation(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {allStations.map((s) => (
                  <option key={s.id} value={s.id}>
                    📍 {s.city} ({s.riverName})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                {station.city}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {station.riverName} • {station.gaugeStationName} • {station.basinName}
          </p>
        </div>

        {/* Data Source & Status Pill */}
        <div className="text-right text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-1.5 justify-end font-semibold text-zinc-700 dark:text-zinc-300">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>{station.thresholdType === 'OFFICIAL_CWC' ? 'Central Water Commission (CWC) Feed' : station.waterLevelSource}</span>
          </div>
          <div className="flex items-center gap-1 justify-end text-[11px] text-zinc-400 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>Updated: {new Date(station.lastTelemetryUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Main Hydrological Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* River Level & Flow Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-blue-500" /> River Stage &amp; Flow
              </span>
              {getTrendBadge()}
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {station.currentWaterLevel?.toFixed(2)} m
              </span>
              <span className="text-sm font-semibold text-zinc-500">
                ({formatNumber(station.currentFlow)} m³/s flow)
              </span>
            </div>

            {/* Plain Language Interpretation */}
            <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
              <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
                {getWaterLevelPlainLanguage()}
              </p>
            </div>
          </div>

          {/* Thresholds Indicator Bar */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            {hasOfficialThresholds ? (
              <>
                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                  <span>Warning Mark: <strong>{station.warningStage.toFixed(2)}m</strong></span>
                  <span>Danger Mark: <strong className="text-rose-600 dark:text-rose-400">{station.criticalStage.toFixed(2)}m</strong></span>
                </div>
                
                {/* Visual Gauge Bar */}
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      station.currentWaterLevel >= station.criticalStage 
                        ? 'bg-rose-500' 
                        : station.currentWaterLevel >= station.warningStage 
                        ? 'bg-amber-500' 
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(15, (station.currentWaterLevel / (station.criticalStage * 1.1)) * 100))}%`
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 italic py-1">
                Official warning/danger thresholds unavailable for this station.
              </div>
            )}
          </div>
        </div>

        {/* 24-Hour Rainfall Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-500" /> Catchment Precipitation
              </span>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                {rainInfo.label}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {station.rainfall24h?.toFixed(1) || '0.0'} mm
              </span>
              <span className="text-xs text-zinc-500 font-medium">past 24-hour total</span>
            </div>

            {/* Plain Language Interpretation */}
            <div className="mt-4 p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
              <p className="text-xs sm:text-sm text-sky-900 dark:text-sky-200 font-medium leading-relaxed">
                {rainInfo.explanation}
              </p>
            </div>
          </div>

          {/* Upstream Dam / Basin Context */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span>
              {station.upstreamDam.name 
                ? `Upstream Dam: ${station.upstreamDam.name} (${station.upstreamDam.river}). Current release: ${station.upstreamDam.dischargeM3s || 0} m³/s.`
                : `Rainfall-driven foothill basin. No major upstream storage dam directly controls flow in this channel.`}
            </span>
          </div>
        </div>

      </div>

      {/* Time-Series Progression Chart Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        {/* Graph Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                River Level Progression (Past 7 Days)
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {station.city} • {station.riverName}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Comparing measured water levels against official warning &amp; danger lines
            </p>
          </div>

          {/* Top Status & Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Latest Available Observation Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Latest available data:</span>
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {station.currentWaterLevel !== null ? `${station.currentWaterLevel.toFixed(2)} m` : '--'}
              </strong>
              <span className="text-zinc-400 text-[11px]">
                ({formatObservationTime(station.lastTelemetryUpdate)})
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white dark:border-zinc-900" />
                <span>Measured Level</span>
              </span>

              {hasOfficialThresholds ? (
                <>
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed" />
                    <span>Warning Mark ({station.warningStage.toFixed(2)} m)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed" />
                    <span>Danger Mark ({station.criticalStage.toFixed(2)} m)</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Notice banner when official thresholds are unavailable */}
        {!hasOfficialThresholds && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Official warning/danger thresholds unavailable for this station.</strong> Warning and danger marks are hidden because official CWC benchmarks are not designated for this tributary reach.
              </span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 shrink-0 font-medium">
              Thresholds Hidden
            </span>
          </div>
        )}

        {/* Chart Area or Friendly Insufficient Data State */}
        {!hasSufficientHistory ? (
          <div className="py-10 px-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <Waves className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Historical river-level data unavailable
            </h4>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mt-1 mb-5 leading-relaxed">
              Historical river-level progression data is currently unavailable from {station.waterLevelSource}. The connected telemetry network provides point measurements; new observations will plot automatically as telemetry cycles are logged.
            </p>

            {/* Latest Available Measurement Card */}
            <div className="w-full max-w-md bg-white dark:bg-zinc-800/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm text-left">
              <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-700">
                <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Latest Available Data</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatObservationTime(station.lastTelemetryUpdate)}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {station.currentWaterLevel !== null ? `${station.currentWaterLevel.toFixed(2)} m` : 'No reading'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {station.riverName} • {station.gaugeStationName}
                  </div>
                </div>
                <div className="text-right text-xs">
                  {hasOfficialThresholds ? (
                    <div className="space-y-0.5">
                      <div className="text-amber-600 dark:text-amber-400 font-medium">Warning: {station.warningStage.toFixed(2)}m</div>
                      <div className="text-rose-600 dark:text-rose-400 font-medium">Danger: {station.criticalStage.toFixed(2)}m</div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 dark:text-zinc-400 italic max-w-[170px] text-[11px] leading-tight">
                      Official warning/danger thresholds unavailable for this station.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full min-h-[260px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <LineChart data={chartData} margin={{ top: 12, right: hasOfficialThresholds ? 75 : 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#71717a' }} 
                  interval="preserveStartEnd"
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  domain={yDomain}
                  tickLine={false}
                  unit="m"
                />
                <Tooltip content={<CustomChartTooltip />} />
                
                {/* Official Warning & Danger Reference Lines - Only if verified */}
                {hasOfficialThresholds && (
                  <>
                    <ReferenceLine 
                      y={station.warningStage} 
                      stroke="#f59e0b" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: `Warning: ${station.warningStage.toFixed(2)}m`, 
                        fill: '#d97706', 
                        fontSize: 10, 
                        position: 'insideTopRight' 
                      }} 
                    />
                    <ReferenceLine 
                      y={station.criticalStage} 
                      stroke="#e11d48" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: `Danger: ${station.criticalStage.toFixed(2)}m`, 
                        fill: '#e11d48', 
                        fontSize: 10, 
                        position: 'insideTopRight' 
                      }} 
                    />
                  </>
                )}

                {/* Measured Level Line with Visible Points */}
                <Line 
                  type="monotone" 
                  dataKey="waterLevel" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  dot={{ r: 4.5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6.5, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Measured Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Source and Timestamp Label below the graph */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Source: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{station.waterLevelSource}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              Last updated: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{new Date(station.lastTelemetryUpdate).toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
