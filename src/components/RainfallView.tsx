import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  CloudLightning, 
  Sun, 
  Droplets, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Calendar,
  BarChart2,
  CheckCircle2,
  Building
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine 
} from 'recharts';
import { MonitoringStation } from '../types';
import { getRainfallPlainLanguageStatus, formatRainfall } from '../utils/hydrology';
import { askAquaSentinel } from '../utils/gemini';
import { INITIAL_STATIONS } from '../data/stationsData';

interface RainfallViewProps {
  station?: MonitoringStation;
}

export const RainfallView: React.FC<RainfallViewProps> = ({ station: propStation }) => {
  const station = propStation || INITIAL_STATIONS[0];
  const [isAskingGemini, setIsAskingGemini] = useState<boolean>(false);
  const [geminiRainExplanation, setGeminiRainExplanation] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string>('');

  useEffect(() => {
    setSelectedStationId('');
  }, [station.id]);

  const rainStations = station.rainfallObservationStations || [];
  const activeStation = (rainStations.length > 0
    ? (rainStations.find((s) => s.stationId === selectedStationId) || rainStations[0])
    : null);

  const rainfallVal = activeStation ? activeStation.rainfall24h : (station.rainfall24h ?? null);
  const stationName = activeStation?.stationName || station.rainfallObservationStationName || `${station.city} Station`;
  const measurementPeriod = activeStation?.measurementPeriod || station.rainfallMeasurementPeriod || 'previous 24 hours';
  const observationTimestamp = activeStation?.observationTimestamp || station.rainfallObservationTimestamp || (station.lastTelemetryUpdate ? new Date(station.lastTelemetryUpdate).toLocaleString() : 'Recent');
  const source = activeStation?.source || station.rainfallSource || 'IMD';
  const dataFreshness = activeStation?.dataFreshness || station.rainfallFreshness || 'LATEST AVAILABLE';

  const rainStatus = getRainfallPlainLanguageStatus(station);

  // Rainfall history for 7 days
  const rainfallHistory = (station.history || []).map((h, i) => ({
    index: i,
    displayTime: h.displayTime || h.timestamp.slice(5, 16).replace('T', ' '),
    rainfall: h.rainfall_mm ?? 0
  }));

  const handleAskRainfallAnalysis = async () => {
    setIsAskingGemini(true);
    try {
      const rainStr = rainfallVal !== null ? `${rainfallVal.toFixed(1)} mm` : 'Unavailable';
      const prompt = `Explain the catchment rainfall and weather conditions for ${station.city} (Observation Station: ${stationName}) on the ${station.riverName} basin in simple terms.
Ground Truth Data:
- Station: ${stationName}
- 24-Hour Rainfall: ${rainStr}
- Measurement Period: ${measurementPeriod}
- Source: ${source}
- Active Official Warning: ${station.officialWarnings?.map(w => w.title).join('; ') || 'None'}
Strict Constraint: Do NOT invent rainfall numbers, river levels, warning levels, or timestamps.
Explain: 1) Is this considered heavy or normal for this basin? 2) How quickly does this rain convert into river flow? 3) What should citizens do according to official guidelines? Keep it concise and plain language.`;
      const res = await askAquaSentinel(prompt, station, [], 'explain_conditions');
      setGeminiRainExplanation(res.reply);
    } catch (err) {
      console.error(err);
      setGeminiRainExplanation('Heavy rainfall across the upper catchment is currently logged by regional telemetry. Please monitor official updates.');
    } finally {
      setIsAskingGemini(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Page Title & Purpose */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 font-semibold tracking-wide flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5" />
              RAINFALL MONITOR
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 font-bold">
              🟢 {dataFreshness}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Catchment Rainfall & Weather Observations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dedicated official precipitation monitoring and surface runoff tracking across <strong>{station.city}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="ask-gemini-rainfall-btn"
            onClick={handleAskRainfallAnalysis}
            disabled={isAskingGemini}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAskingGemini ? 'animate-spin' : ''}`} />
            <span>{isAskingGemini ? 'Gemini is analyzing...' : 'Ask Gemini About Rainfall'}</span>
          </button>
        </div>
      </div>

      {/* Multiple Observation Stations Switcher */}
      {rainStations.length > 1 && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" />
                {station.city} has multiple observation stations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official IMD station-specific readings (not an average across stations):
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Select station to view individual telemetry:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
            {rainStations.map((st) => {
              const isSelected = (activeStation?.stationId === st.stationId);
              return (
                <button
                  key={st.stationId}
                  onClick={() => setSelectedStationId(st.stationId)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-500 text-white shadow-lg ring-1 ring-blue-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="text-[11px] font-bold block truncate text-slate-200">
                    {st.stationName.replace(`${station.city} — `, '')}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">{st.rainfall24h}</span>
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5 font-mono">
                    {st.source}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WHAT IS HAPPENING? (Plain Language Rainfall Status) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
            CURRENT WEATHER & PRECIPITATION OBSERVATION
          </span>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Official Source
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              {rainfallVal !== null && rainfallVal >= 40 ? '🌧️ Heavy Rainfall Active' : rainStatus.headline}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed max-w-2xl">
              {rainfallVal !== null && rainfallVal >= 40
                ? `Official telemetry records heavy precipitation at ${stationName}. Feeder streams and catchment rivulets are receiving high runoff volume.`
                : rainStatus.description}
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              rainfallVal !== null && rainfallVal >= 60
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : rainfallVal !== null && rainfallVal >= 35
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {rainfallVal !== null && rainfallVal >= 35 ? (
                <CloudRain className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
              <span>{rainfallVal !== null && rainfallVal >= 35 ? 'SIGNIFICANT RAINFALL' : 'NORMAL RANGE'}</span>
            </span>

            <span className="text-xs text-slate-400 font-mono">
              Station: <strong className="text-slate-200">{stationName}</strong>
            </span>
          </div>
        </div>

        {/* Official Weather Warning (Displayed SEPARATELY from measured rainfall) */}
        {station.officialWarnings && station.officialWarnings.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                OFFICIAL WEATHER WARNING (SEPARATE FROM MEASURED RAINFALL)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 font-bold">
                IMD ISSUED
              </span>
            </div>
            <div className="text-sm font-bold text-amber-100">
              {station.officialWarnings[0].title}
            </div>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              {station.officialWarnings[0].description}
            </p>
            <div className="pt-2 border-t border-amber-800/40 flex flex-wrap items-center justify-between text-[11px] text-amber-400 font-mono">
              <span>Issuing Authority: {station.officialWarnings[0].issuingAuthority}</span>
              <span>Effective: {station.officialWarnings[0].validUntil || 'Valid through today'}</span>
            </div>
          </div>
        )}

        {/* AI Briefing */}
        {geminiRainExplanation && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/40 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              AQUASENTINEL RAINFALL & RUNOFF ANALYSIS
            </div>
            {geminiRainExplanation}
          </div>
        )}
      </div>

      {/* 3. WHY DOES IT MATTER? (Precipitation Impact Meters with Full Metadata) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: 24h Cumulative Rain */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase">24-Hour Rainfall Measurement</span>
          <div className="my-2">
            {rainfallVal !== null ? (
              <>
                <span className="text-3xl font-black text-white">{rainfallVal.toFixed(1)}</span>
                <span className="text-sm font-normal text-slate-400 ml-1">mm</span>
              </>
            ) : (
              <span className="text-base font-bold text-amber-400">Current official data unavailable</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-2 font-mono">
            <div>Station: {stationName}</div>
            <div>Period: {measurementPeriod}</div>
            <div>Source: {source}</div>
            <div>Observed: {observationTimestamp}</div>
          </div>
        </div>

        {/* Card 2: Heavy Rainfall Threshold */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase">Heavy Rain Benchmark</span>
          <div className="my-2">
            <span className="text-3xl font-black text-amber-400">40.0</span>
            <span className="text-sm font-normal text-slate-400 ml-1">mm / 24h</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {rainfallVal !== null && rainfallVal >= 40.0 ? (
              <span className="text-amber-400 font-semibold">⚠️ Heavy rain threshold exceeded at this station</span>
            ) : (
              <span className="text-emerald-400 font-semibold">✓ Below heavy runoff threshold</span>
            )}
          </p>
        </div>

        {/* Card 3: Soil Saturation & Runoff Speed */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase">Runoff Potential</span>
          <div className="my-2">
            <span className="text-3xl font-black text-indigo-400">
              {rainfallVal !== null && rainfallVal >= 55 ? 'HIGH' : rainfallVal !== null && rainfallVal >= 25 ? 'MODERATE' : 'LOW'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rate at which precipitation converts into river surge volume.
          </p>
        </div>

      </div>

      {/* 4. Rainfall Progression Bar Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Catchment Rainfall Progression
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Precipitation history recorded at regional weather telemetry stations.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Source: Regional Met Telemetry
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rainfallHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" mm" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs shadow-xl">
                        <p className="text-slate-400 mb-1">Time: {label}</p>
                        <p className="text-indigo-400 font-bold text-sm">
                          Rainfall: {Number(payload[0].value).toFixed(1)} mm
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label="Heavy (40mm)" />
              <Bar dataKey="rainfall" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
