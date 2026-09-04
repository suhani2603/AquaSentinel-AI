import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  AlertTriangle, 
  Waves, 
  Dam, 
  CloudRain, 
  TrendingUp, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  ArrowRight, 
  Info,
  Bot,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { MonitoringStation, WhatIfScenario } from '../types';
import { simulateWhatIfScenario, formatNumber, getRiskBadgeClasses } from '../utils/hydrology';
import { evaluateWhatIfScenarioWithAI } from '../utils/gemini';
import { INITIAL_STATIONS } from '../data/stationsData';

interface WhatIfViewProps {
  station?: MonitoringStation;
  onSaveScenario?: (scenario: WhatIfScenario) => void;
}

export const WhatIfView: React.FC<WhatIfViewProps> = ({ station: propStation, onSaveScenario }) => {
  const station = propStation || INITIAL_STATIONS[0];
  // Slider states
  const [flowDeltaPercent, setFlowDeltaPercent] = useState<number>(20);
  const [additionalDamDischarge, setAdditionalDamDischarge] = useState<number>(
    station.upstreamDam?.isAvailable ? 300 : 0
  );
  const [additionalRainfall, setAdditionalRainfall] = useState<number>(25);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Live simulation calculation
  const simulation = simulateWhatIfScenario(
    station,
    flowDeltaPercent,
    additionalDamDischarge,
    additionalRainfall
  );

  const baselineRiskBadge = getRiskBadgeClasses(station.riskLevel);
  const projectedRiskBadge = getRiskBadgeClasses(simulation.projectedRiskLevel);

  // Preset Scenario Handlers
  const applyPreset = (type: 'dam' | 'rain' | 'surge' | 'combined') => {
    switch (type) {
      case 'dam':
        setFlowDeltaPercent(10);
        setAdditionalDamDischarge(500);
        setAdditionalRainfall(0);
        break;
      case 'rain':
        setFlowDeltaPercent(20);
        setAdditionalDamDischarge(0);
        setAdditionalRainfall(50);
        break;
      case 'surge':
        setFlowDeltaPercent(60);
        setAdditionalDamDischarge(0);
        setAdditionalRainfall(20);
        break;
      case 'combined':
        setFlowDeltaPercent(40);
        setAdditionalDamDischarge(450);
        setAdditionalRainfall(60);
        break;
    }
  };

  const handleEvaluateAI = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluateWhatIfScenarioWithAI(simulation, station);
      setAiAnalysis(res.assessment);
    } catch (err) {
      console.error('Failed to evaluate scenario:', err);
      setAiAnalysis(
        `Hydrological projection: River water level rises by ${(simulation.projectedWaterLevel - station.currentWaterLevel).toFixed(2)}m to ${simulation.projectedWaterLevel.toFixed(2)}m. ${
          simulation.projectedWaterLevel >= station.criticalStage
            ? 'Breaches critical danger mark. High flood risk in low-lying riparian corridors.'
            : simulation.projectedWaterLevel >= station.warningStage
            ? 'Approaches caution warning mark. Bank overflow possible.'
            : 'Remains safely below warning mark.'
        }`
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setFlowDeltaPercent(0);
    setAdditionalDamDischarge(0);
    setAdditionalRainfall(0);
    setAiAnalysis(null);
  };

  return (
    <div id="whatif-simulator-page" className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      
      {/* 1. Prominent Warning / Disclaimer Label */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800 text-center space-y-1 shadow-sm">
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-purple-800 dark:text-purple-300 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          HYPOTHETICAL SCENARIO — NOT A FLOOD PREDICTION
        </span>
        <p className="text-xs text-purple-700 dark:text-purple-400">
          This interactive model tests potential hydraulic impacts under simulated environmental stresses. It does not replace real-time telemetry.
        </p>
      </div>

      {/* 2. Header & Station Context */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-purple-600" />
              Hydrological What-If Simulator
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
              {station.city}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Simulate the impact of upstream dam releases, catchment cloudbursts, and rapid surges on {station.riverName}.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      {/* 3. Quick Scenario Presets */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block px-1">
          Quick Test Scenarios
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('dam')}
            className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600">
              <Dam className="w-4 h-4 text-purple-500" /> Dam Release
            </div>
            <span className="text-[11px] text-zinc-400 block mt-1">+500 m³/s spillway</span>
          </button>

          <button
            onClick={() => applyPreset('rain')}
            className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600">
              <CloudRain className="w-4 h-4 text-sky-500" /> Heavy Rainfall
            </div>
            <span className="text-[11px] text-zinc-400 block mt-1">+50 mm cloudburst</span>
          </button>

          <button
            onClick={() => applyPreset('surge')}
            className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600">
              <TrendingUp className="w-4 h-4 text-amber-500" /> River Flow Surge
            </div>
            <span className="text-[11px] text-zinc-400 block mt-1">+60% flash runoff</span>
          </button>

          <button
            onClick={() => applyPreset('combined')}
            className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600">
              <Zap className="w-4 h-4 text-rose-500" /> Combined Extreme
            </div>
            <span className="text-[11px] text-zinc-400 block mt-1">+60mm rain & dam gate</span>
          </button>
        </div>
      </div>

      {/* 4. Interactive Sliders */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Slider 1: Upstream Dam Discharge */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Dam className="w-4 h-4 text-purple-500" /> Additional Upstream Dam Gate Release
            </span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              +{additionalDamDischarge} m³/s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1200"
            step="50"
            value={additionalDamDischarge}
            onChange={(e) => setAdditionalDamDischarge(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>0 m³/s (No extra release)</span>
            <span>+600 m³/s</span>
            <span>+1200 m³/s (Emergency spillway open)</span>
          </div>
        </div>

        {/* Slider 2: Additional Rainfall */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-sky-500" /> Simulated Catchment Downpour
            </span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              +{additionalRainfall} mm
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={additionalRainfall}
            onChange={(e) => setAdditionalRainfall(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>0 mm</span>
            <span>+75 mm (Heavy hill storm)</span>
            <span>+150 mm (Extreme cloudburst event)</span>
          </div>
        </div>

        {/* Slider 3: River Flow Increase */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Baseline Inflow Surge
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              +{flowDeltaPercent}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={flowDeltaPercent}
            onChange={(e) => setFlowDeltaPercent(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

      </div>

      {/* 5. Before vs After Hydraulic Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Baseline Condition */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            1. Current Baseline Condition
          </span>
          <div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {station.currentWaterLevel.toFixed(2)} m
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Flow: <strong>{formatNumber(station.currentFlow)} m³/s</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            Baseline Status: <strong className="text-emerald-600">{station.riskLevel}</strong>
          </div>
        </div>

        {/* Changed Simulation Condition */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
            2. Projected Simulated Level
          </span>
          <div>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {simulation.projectedWaterLevel.toFixed(2)} m
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Simulated Flow: <strong>{formatNumber(simulation.projectedFlow)} m³/s</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            Projected Status:{' '}
            <strong className={
              simulation.projectedRiskLevel === 'CRITICAL' ? 'text-rose-600' :
              simulation.projectedRiskLevel === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'
            }>
              {simulation.projectedRiskLevel}
            </strong>
          </div>
        </div>

        {/* Estimated Impact */}
        <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 shadow-sm space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            3. Estimated Impact
          </span>
          <div>
            <div className="text-2xl font-extrabold text-purple-900 dark:text-purple-200">
              +{(simulation.projectedWaterLevel - station.currentWaterLevel).toFixed(2)} m
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
              Flow Increase: +{formatNumber(simulation.projectedFlow - station.currentFlow)} m³/s
            </div>
          </div>
          <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 font-medium">
            {simulation.projectedWaterLevel >= station.criticalStage
              ? '⚠️ Exceeds danger mark!'
              : simulation.projectedWaterLevel >= station.warningStage
              ? '⚠️ Approaches warning mark'
              : '✓ Safe channel retention'}
          </div>
        </div>

      </div>

      {/* 6. Plain-Language AI Impact Evaluation */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Plain-Language Scenario Interpretation
            </h3>
          </div>

          <button
            onClick={handleEvaluateAI}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEvaluating ? 'Analyzing Scenario...' : 'Ask AI to Explain Impact'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
            {aiAnalysis || simulation.aiAnalysis || 'Click "Ask AI to Explain Impact" to generate a plain-language summary of how this simulated scenario would affect riverbanks and floodways.'}
          </p>
        </div>
      </div>

    </div>
  );
};
