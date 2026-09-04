import React, { useState } from 'react';
import { 
  FlaskConical, 
  ArrowDown, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  RotateCcw,
  Layers,
  Activity,
  Waves,
  Dam,
  CloudRain,
  Info
} from 'lucide-react';
import { MonitoringStation, TestScenario, RiskLevel } from '../types';
import { TEST_SCENARIOS } from '../data/scenariosData';
import { calculateRiskScore, generateStationAlerts, getRiskBadgeClasses, formatNumber } from '../utils/hydrology';
import { askAquaSentinel } from '../utils/gemini';
import { hydrologyDataService } from '../services/hydrologyDataService';
import { INITIAL_STATIONS } from '../data/stationsData';

interface TestingViewProps {
  currentStation?: MonitoringStation;
  allStations?: MonitoringStation[];
  onApplyScenarioToLiveApp: (targetStationId: string, scenarioId: string) => void;
  onResetDefault: () => void;
}

export const TestingView: React.FC<TestingViewProps> = ({
  currentStation: propStation,
  allStations = [],
  onApplyScenarioToLiveApp,
  onResetDefault,
}) => {
  const safeAllStations = allStations && allStations.length > 0 ? allStations : INITIAL_STATIONS;
  const currentStation = propStation || safeAllStations[0] || INITIAL_STATIONS[0];
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(TEST_SCENARIOS[0].id);
  const [geminiExplanation, setGeminiExplanation] = useState<string | null>(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState<boolean>(false);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const scenario = TEST_SCENARIOS.find((s) => s.id === selectedScenarioId) || TEST_SCENARIOS[0];
  const targetStation = safeAllStations.find((st) => st.id === scenario.targetStationId) || currentStation || INITIAL_STATIONS[0];

  // Calculate the simulated output state from this scenario
  const inp = scenario.inputs;
  const simulatedDam = {
    ...targetStation.upstreamDam,
    dischargeM3s: inp.dam_release_m3s,
    previousDischargeM3s: inp.previous_dam_release_m3s,
    gateStatus: inp.dam_gate_status,
    safetyStatus: inp.dam_release_m3s && inp.dam_release_m3s > 3000 
      ? ('HIGH_SPILLWAY_RELEASE' as const) 
      : (inp.dam_release_m3s ? ('ELEVATED' as const) : ('NORMAL' as const)),
    isAvailable: inp.dam_release_m3s !== null
  };

  const simulatedStation: MonitoringStation = {
    ...targetStation,
    currentFlow: inp.flow_m3s,
    previousFlow: inp.previous_flow_m3s,
    flowChangePercent: inp.flow_change_percent,
    isRapidIncrease: inp.flow_change_percent >= 25,
    currentWaterLevel: inp.water_level_m,
    previousWaterLevel: inp.previous_water_level_m,
    rainfall24h: inp.rainfall_mm,
    upstreamDam: simulatedDam,
    lastTelemetryUpdate: new Date().toISOString()
  };

  const calculated = calculateRiskScore(simulatedStation);
  const evaluatedStation = {
    ...simulatedStation,
    riskScore: calculated.riskScore,
    riskLevel: calculated.riskLevel,
    riskFactors: calculated.riskFactors
  };

  const triggeredAlerts = generateStationAlerts(evaluatedStation);
  const badge = getRiskBadgeClasses(calculated.riskLevel);

  // Generate real-time Gemini AI explanation for this scenario
  const handleGenerateAiExplanation = async () => {
    setIsGeneratingExplanation(true);
    setGeminiExplanation(null);
    try {
      const response = await askAquaSentinel(
        `Explain why the hydrological risk score shifted to ${calculated.riskScore}/100 (${calculated.riskLevel}) under this scenario (${scenario.title}). Detail the contributing factors, flow surge rate (+${inp.flow_change_percent}%), stage height (${inp.water_level_m}m), rainfall (${inp.rainfall_mm}mm), and dam discharge (${inp.dam_release_m3s ? inp.dam_release_m3s + ' m³/s' : 'Data unavailable'}). Note that this is simulated live data.`,
        evaluatedStation,
        [],
        'explain_risk'
      );
      setGeminiExplanation(response.reply);
    } catch (err) {
      setGeminiExplanation('AI Explanation generator encountered a temporary connection issue. Telemetry calculations remain verified.');
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  const handleApply = () => {
    hydrologyDataService.setScenario(scenario.id as any, scenario.targetStationId);
    setAppliedFeedback(`Scenario "${scenario.shortName}" activated in the live continuous simulation engine for ${scenario.targetCity}.`);
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-cyan-800/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
                <FlaskConical className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-100">
                Testing & Demonstration Scenarios
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                SIMULATED LIVE DATA — NOT REAL-TIME
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Switch between predefined test scenarios to evaluate how the deterministic hydrological risk engine, rapid change detector, and Gemini AI assistant respond in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="reset-baseline-btn"
              onClick={onResetDefault}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Baseline</span>
            </button>
            <button
              id="apply-scenario-live-btn"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Activate in Live Simulation</span>
            </button>
          </div>
        </div>

        {appliedFeedback && (
          <div className="mt-3 px-3 py-2 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{appliedFeedback}</span>
          </div>
        )}
      </div>

      {/* Scenario Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEST_SCENARIOS.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          return (
            <button
              key={sc.id}
              id={`test-scenario-card-${sc.number}`}
              onClick={() => {
                setSelectedScenarioId(sc.id);
                setGeminiExplanation(null);
              }}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/80 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  SCENARIO {sc.number}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {sc.targetCity}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                {sc.shortName}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Pipeline Step-by-Step Flow */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono uppercase text-cyan-400 font-bold">Evaluation Pipeline Flow</span>
            <h2 className="text-lg font-bold text-slate-100">{scenario.title}</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Target: <strong className="text-slate-200">{scenario.targetCity}</strong> ({targetStation.riverName})
          </span>
        </div>

        {/* 1. Input Conditions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
            <span>INPUT CONDITIONS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 border border-slate-800/80 rounded-lg p-4">
            <div>
              <span className="text-[11px] text-slate-500 font-mono block">PRECIPITATION (24h)</span>
              <span className="text-sm font-bold text-slate-100">{inp.rainfall_mm} mm</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{inp.rainfall_description}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-mono block">RIVER FLOW</span>
              <span className="text-sm font-bold text-cyan-300">{inp.flow_m3s.toLocaleString()} m³/s</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Previous: {inp.previous_flow_m3s.toLocaleString()} m³/s</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-mono block">WATER LEVEL</span>
              <span className="text-sm font-bold text-sky-300">{inp.water_level_m.toFixed(2)} m</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Previous: {inp.previous_water_level_m.toFixed(2)} m</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-mono block">DAM DISCHARGE</span>
              <span className="text-sm font-bold text-indigo-300">
                {inp.dam_release_m3s ? `${inp.dam_release_m3s.toLocaleString()} m³/s` : 'Data unavailable'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{inp.dam_name || 'No Direct Dam'}</span>
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* 2. Calculated Measurements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">2</span>
            <span>CALCULATED MEASUREMENTS & RATE DETECTION</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 font-mono text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">FLOW CHANGE DELTA</span>
              <span className={`text-base font-bold ${inp.flow_change_percent >= 25 ? 'text-amber-400' : 'text-slate-200'}`}>
                {inp.flow_change_percent > 0 ? '+' : ''}{inp.flow_change_percent.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Absolute: {(inp.flow_m3s - inp.previous_flow_m3s > 0 ? '+' : '') + (inp.flow_m3s - inp.previous_flow_m3s).toLocaleString()} m³/s
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">STAGE RELATIVE TO WARNING</span>
              <span className={`text-base font-bold ${inp.water_level_m >= targetStation.warningStage ? 'text-rose-400' : 'text-slate-200'}`}>
                {inp.water_level_m >= targetStation.warningStage ? `+${(inp.water_level_m - targetStation.warningStage).toFixed(2)}m BREACH` : `${(targetStation.warningStage - inp.water_level_m).toFixed(2)}m Buffer`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Warning Threshold: {targetStation.warningStage.toFixed(2)}m
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">RAPID SURGE STATUS</span>
              <span className={`text-base font-bold ${inp.flow_change_percent >= 25 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {inp.flow_change_percent >= 25 ? 'RAPID INCREASE DETECTED' : 'STEADY FLOW RATE'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Surge threshold: ≥ 25.0%
              </span>
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* 3. Risk Score & Risk Level */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">3</span>
            <span>PROTOTYPE FLOOD RISK ENGINE OUTPUT</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl border ${badge.bg} ${badge.border} flex flex-col items-center justify-center min-w-[120px]`}>
                <span className="text-[10px] font-mono uppercase opacity-75">RISK SCORE</span>
                <span className="text-3xl font-extrabold font-mono">{calculated.riskScore}</span>
                <span className="text-[10px] font-mono">/ 100</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-mono block">CLASSIFICATION</span>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold font-mono border ${badge.bg} ${badge.border} mt-1`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${badge.dot} animate-pulse`} />
                  <span>{calculated.riskLevel}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Dominant Factor: <strong className="text-slate-200">{calculated.riskFactors.dominantDriver}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-slate-400 flex justify-between">
                <span>Water Level Factor (35%):</span>
                <span className="font-bold text-slate-200">{calculated.riskFactors.waterLevelFactor}/100</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Flow Volume Factor (25%):</span>
                <span className="font-bold text-slate-200">{calculated.riskFactors.flowFactor}/100</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Surge Rate Factor (20%):</span>
                <span className="font-bold text-slate-200">{calculated.riskFactors.surgeRateFactor}/100</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Rainfall Runoff (10%):</span>
                <span className="font-bold text-slate-200">{calculated.riskFactors.rainfallFactor}/100</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Dam Release Factor (10%):</span>
                <span className="font-bold text-slate-200">{calculated.riskFactors.damFactor}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* 4. Triggered Alerts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">4</span>
            <span>TRIGGERED ALERTS ({triggeredAlerts.length})</span>
          </div>
          {triggeredAlerts.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono">
              No critical alerts triggered. All sensor indicators within safe baselines.
            </div>
          ) : (
            <div className="space-y-2">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs ${
                    alert.severity === 'critical'
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{alert.title}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900/80">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">{alert.reason}</p>
                  <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
                    Action: {alert.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>

        {/* 5. Gemini AI Explanation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">5</span>
              <span>GEMINI AI SITUATIONAL EXPLANATION</span>
            </div>
            <button
              id="generate-scenario-ai-btn"
              onClick={handleGenerateAiExplanation}
              disabled={isGeneratingExplanation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isGeneratingExplanation ? 'Analyzing Telemetry...' : 'Generate Gemini Briefing'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans min-h-[90px]">
            {isGeneratingExplanation ? (
              <div className="flex items-center gap-2 text-cyan-400 font-mono py-4">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <span>AquaSentinel Assistant is synthesizing scenario physics & risk factors...</span>
              </div>
            ) : geminiExplanation ? (
              <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-line">
                {geminiExplanation}
              </div>
            ) : (
              <div className="text-slate-500 italic py-2">
                Click "Generate Gemini Briefing" to request a structured AI synthesis grounded in the calculated telemetry metrics above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
