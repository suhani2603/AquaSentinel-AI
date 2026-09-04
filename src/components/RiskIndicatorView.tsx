import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Sliders, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  Dam, 
  CloudRain, 
  Waves,
  Scale
} from 'lucide-react';
import { MonitoringStation } from '../types';
import { getRiskBadgeClasses, evaluateEvidenceBasedRisk } from '../utils/hydrology';
import { INITIAL_STATIONS } from '../data/stationsData';

interface RiskIndicatorViewProps {
  station?: MonitoringStation;
}

export const RiskIndicatorView: React.FC<RiskIndicatorViewProps> = ({ station: propStation }) => {
  const station = propStation || INITIAL_STATIONS[0];
  const riskBadge = getRiskBadgeClasses(station.riskLevel);
  const factors = station.riskFactors;

  // Evidence-Based Risk Evaluation
  const evidenceRisk = station.evidenceRiskAssessment || evaluateEvidenceBasedRisk({
    id: station.id,
    city: station.city,
    riverName: station.riverName,
    currentWaterLevel: station.currentWaterLevel,
    previousWaterLevel: station.previousWaterLevel,
    warningStage: station.warningStage,
    criticalStage: station.criticalStage,
    normalStage: station.normalStage,
    rainfall24h: station.rainfall24h,
    rainfallIntensityMmHr: station.rainfallIntensityMmHr,
    currentFlow: station.currentFlow,
    designPeakFlow: station.designPeakFlow,
    flowChangePercent: station.flowChangePercent,
    officialWarnings: station.officialWarnings
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              HYDROLOGICAL RISK MODEL
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Transparent Calculation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Flood Risk Formulation & Analysis
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Mathematical multi-parameter evaluation for {station.city} ({station.riverName}).
          </p>
        </div>

        {/* Current Risk Level Badge */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 font-mono ${riskBadge.bg} ${riskBadge.border}`}>
          <ShieldAlert className="w-6 h-6" />
          <div>
            <span className="text-xs opacity-75 block">CURRENT CALCULATED RISK</span>
            <div className="text-lg font-black flex items-center gap-2">
              <span>{station.riskLevel}</span>
              <span className="text-xs font-normal">({station.riskScore}/100)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Decision Support Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 text-slate-300 text-xs sm:text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300 mb-1">
              Decision-Support Framework & Legal Notice
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              AquaSentinel computes this risk indicator strictly through mathematical sensor evaluation to enhance situational awareness. 
              <strong>It is NOT an official government flood or evacuation warning.</strong> Always follow instructions from regional emergency authorities and civil protection agencies.
            </p>
          </div>
        </div>
      </div>

      {/* Evidence-Based Grounding Details Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
              Evidence-Based Grounding
            </span>
            <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              {station.city} ({station.riverName}) Risk Level: {evidenceRisk.riskLevel}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Data Confidence:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              evidenceRisk.dataConfidence === 'HIGH'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {evidenceRisk.dataConfidence}
            </span>
          </div>
        </div>

        {/* Plain Language Summary */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-slate-200">
          {evidenceRisk.plainLanguageSummary}
        </div>

        {/* Primary Observed Triggers */}
        {evidenceRisk.primaryTriggers && evidenceRisk.primaryTriggers.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Primary Evidence Triggers:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {evidenceRisk.primaryTriggers.map((trig, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{trig}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions Badge Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>Rainfall: <strong className="text-slate-200">{evidenceRisk.rainfallCondition.replace(/_/g, ' ')}</strong></span>
          <span>•</span>
          <span>River Stage: <strong className="text-slate-200">{evidenceRisk.riverCondition.replace(/_/g, ' ')}</strong></span>
          <span>•</span>
          <span>Warnings: <strong className="text-slate-200">{evidenceRisk.officialWarningActive ? 'OFFICIAL ALERT ACTIVE' : 'NO ACTIVE WARNING'}</strong></span>
        </div>
      </div>

      {/* Mathematical Breakdown & Gauge Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: 5 Weighted Components */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            Parameter Weighting Breakdown
          </h2>
          <p className="text-xs text-slate-400">
            How individual telemetry indicators contribute to the composite 0-100 flood risk score:
          </p>

          <div className="space-y-4 font-mono text-xs">
            
            {/* 1. Stage */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  Water Stage Elevation (35% Weight)
                </span>
                <span className="font-bold text-sky-400">{factors.waterLevelFactor}/100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Measured: {station.currentWaterLevel.toFixed(2)}m (Warning: {station.warningStage.toFixed(2)}m, Critical: {station.criticalStage.toFixed(2)}m).
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${factors.waterLevelFactor}%` }} />
              </div>
            </div>

            {/* 2. Discharge */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  Volumetric Discharge (25% Weight)
                </span>
                <span className="font-bold text-cyan-400">{factors.flowFactor}/100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Measured: {station.currentFlow?.toLocaleString()} m³/s vs Design Peak Flow of {station.designPeakFlow?.toLocaleString()} m³/s.
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${factors.flowFactor}%` }} />
              </div>
            </div>

            {/* 3. Surge Rate */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Surge Rate Acceleration (20% Weight)
                </span>
                <span className="font-bold text-amber-400">{factors.surgeRateFactor}/100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Surge Delta: {station.flowChangePercent > 0 ? '+' : ''}{station.flowChangePercent.toFixed(1)}% vs previous reading.
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${factors.surgeRateFactor}%` }} />
              </div>
            </div>

            {/* 4. Dam Outflow */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Dam className="w-3.5 h-3.5 text-blue-400" />
                  Upstream Dam Release (10% Weight)
                </span>
                <span className="font-bold text-blue-400">{factors.damFactor}/100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                {station.upstreamDam?.isAvailable && station.upstreamDam?.dischargeM3s
                  ? `Active discharge: ${station.upstreamDam.dischargeM3s.toLocaleString()} m³/s`
                  : 'Telemetry unavailable or normal outflow'}
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${factors.damFactor}%` }} />
              </div>
            </div>

            {/* 5. Rainfall */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
                  Catchment Rainfall Runoff (10% Weight)
                </span>
                <span className="font-bold text-indigo-400">{factors.rainfallFactor}/100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                24h Precipitation: {station.rainfall24h !== null ? `${station.rainfall24h} mm` : 'Data unavailable'}
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${factors.rainfallFactor}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Right: Risk Classification Scale & Dominant Driver */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Risk Index Classification Bands
            </h2>

            <div className="space-y-3 font-mono text-xs">
              
              {/* NORMAL */}
              <div className={`p-3 rounded-xl border ${station.riskLevel === 'NORMAL' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800/80 text-slate-400'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span>NORMAL (0 - 29)</span>
                  {station.riskLevel === 'NORMAL' && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20">ACTIVE</span>}
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-1">
                  Flow rates and water levels comfortably within normal baseflow channels. No flood risk indicated.
                </p>
              </div>

              {/* WATCH */}
              <div className={`p-3 rounded-xl border ${station.riskLevel === 'WATCH' ? 'bg-sky-500/10 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-slate-800/80 text-slate-400'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span>WATCH (30 - 59)</span>
                  {station.riskLevel === 'WATCH' && <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20">ACTIVE</span>}
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-1">
                  Elevated discharge or rising stage approaching alert thresholds. Active monitoring recommended.
                </p>
              </div>

              {/* WARNING */}
              <div className={`p-3 rounded-xl border ${station.riskLevel === 'WARNING' ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-950 border-slate-800/80 text-slate-400'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span>WARNING (60 - 79)</span>
                  {station.riskLevel === 'WARNING' && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20">ACTIVE</span>}
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-1">
                  Warning stage breached or rapid flow surge detected. High likelihood of low-lying floodway inundation.
                </p>
              </div>

              {/* CRITICAL */}
              <div className={`p-3 rounded-xl border ${station.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-950 border-slate-800/80 text-slate-400'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span>CRITICAL (80 - 100)</span>
                  {station.riskLevel === 'CRITICAL' && <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20">ACTIVE</span>}
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-1">
                  Critical stage exceeded or combined dam spillway emergency release. Severe flood conditions present.
                </p>
              </div>

            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block text-[10px]">DOMINANT CONTRIBUTING RISK DRIVER</span>
            <span className="text-cyan-300 font-bold text-sm">{factors.dominantDriver}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
