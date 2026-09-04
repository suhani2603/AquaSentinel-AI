import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  SlidersHorizontal, 
  Calendar, 
  User as UserIcon, 
  CloudRain, 
  Waves, 
  CheckCircle2, 
  MapPin,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { ObservationLog, WhatIfScenario, MonitoringStation, UserSavedStation } from '../types';
import { exportStationReportJSON, exportStationReportMarkdown } from '../utils/storage';
import { formatNumber } from '../utils/hydrology';
import { INITIAL_STATIONS } from '../data/stationsData';

interface HistoryViewProps {
  station?: MonitoringStation;
  observations: ObservationLog[];
  simulations: WhatIfScenario[];
  onAddObservation: (obs: ObservationLog) => void;
  onDeleteObservation: (id: string) => void;
  onDeleteSimulation: (id: string) => void;
  onSelectStation: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  station: propStation,
  observations,
  simulations,
  onAddObservation,
  onDeleteObservation,
  onDeleteSimulation,
  onSelectStation,
}) => {
  const station = propStation || INITIAL_STATIONS[0];
  const [activeTab, setActiveTab] = useState<'observations' | 'simulations'>('observations');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states
  const [observerName, setObserverName] = useState<string>('');
  const [stageObserved, setStageObserved] = useState<string>('');
  const [flowObserved, setFlowObserved] = useState<string>('');
  const [weatherCondition, setWeatherCondition] = useState<string>('Overcast with intermittent rain');
  const [notes, setNotes] = useState<string>('');

  const handleCreateObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    const newObs: ObservationLog = {
      id: `obs-${Date.now()}`,
      stationId: station.id,
      stationName: station.city,
      riverName: station.riverName,
      timestamp: new Date().toISOString(),
      observerName: observerName.trim() || 'Hydrological Field Officer',
      waterLevelObserved: stageObserved ? parseFloat(stageObserved) : station.currentWaterLevel,
      flowObserved: flowObserved ? parseFloat(flowObserved) : station.currentFlow,
      weatherCondition,
      notes: notes.trim(),
      riskAssessment: station.riskLevel
    };

    onAddObservation(newObs);
    setShowAddModal(false);
    setNotes('');
    setStageObserved('');
    setFlowObserved('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              AUDIT TRAIL & LOGS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Cloud Isolated Records
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Field Observations & Simulation History
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browse stored hydrological inspection logs and saved What-If scenario assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Field Observation</span>
          </button>

          <button
            onClick={() => exportStationReportMarkdown(station)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Export Markdown Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('observations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'observations'
              ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Field Observation Logs ({observations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'simulations'
              ? 'bg-slate-800 text-purple-300 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Saved What-If Scenarios ({simulations.length})</span>
        </button>
      </div>

      {/* Content Section */}
      {activeTab === 'observations' ? (
        <div className="space-y-3">
          {observations.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-200 text-base">No Field Observations Logged Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Record visual gauge confirmations, bank conditions, and catchment storm updates to maintain a secure audit trail.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Field Log</span>
              </button>
            </div>
          ) : (
            observations.map((obs) => (
              <div
                key={obs.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {obs.stationName} — {obs.riverName}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      {obs.observerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(obs.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <button
                      onClick={() => onDeleteObservation(obs.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {obs.notes}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  {obs.waterLevelObserved && (
                    <span>Stage: <strong className="text-sky-300">{obs.waterLevelObserved.toFixed(2)}m</strong></span>
                  )}
                  {obs.flowObserved && (
                    <span>Flow: <strong className="text-cyan-300">{obs.flowObserved.toLocaleString()} m³/s</strong></span>
                  )}
                  {obs.weatherCondition && (
                    <span className="text-slate-300 flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-indigo-400" />
                      {obs.weatherCondition}
                    </span>
                  )}
                  <span className="ml-auto px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Assessment: {obs.riskAssessment}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {simulations.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-200 text-base">No Saved What-If Simulations</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Run hydrological scenarios in the What-If Lab and save the projected outcomes for team decision-support.
              </p>
            </div>
          ) : (
            simulations.map((sim) => (
              <div
                key={sim.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-purple-300">
                      Hypothetical Simulation: {sim.stationName}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      Delta: {sim.flowDeltaPercent >= 0 ? `+${sim.flowDeltaPercent}%` : `${sim.flowDeltaPercent}%`} flow
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      {new Date(sim.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDeleteSimulation(sim.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete Simulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">BASELINE FLOW</span>
                    <span className="text-slate-200 font-bold">{formatNumber(sim.baselineFlow)} m³/s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROJECTED FLOW</span>
                    <span className="text-cyan-300 font-bold">{formatNumber(sim.projectedFlow)} m³/s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROJECTED STAGE</span>
                    <span className="text-sky-300 font-bold">{sim.projectedWaterLevel.toFixed(2)}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">RISK SCORE SHIFT</span>
                    <span className="text-purple-300 font-bold">
                      {sim.baselineRiskScore} → {sim.projectedRiskScore} ({sim.projectedRiskLevel})
                    </span>
                  </div>
                </div>

                {sim.aiAnalysis && (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                    {sim.aiAnalysis}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Observation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Log Field Telemetry Observation
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Station: {station.city} ({station.riverName})
            </p>

            <form onSubmit={handleCreateObservation} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Observer Name / ID</label>
                <input
                  type="text"
                  value={observerName}
                  onChange={(e) => setObserverName(e.target.value)}
                  placeholder="e.g. Inspector Miller (Hydrology Unit 4)"
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Observed Stage (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stageObserved}
                    onChange={(e) => setStageObserved(e.target.value)}
                    placeholder={station.currentWaterLevel.toFixed(2)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Estimated Flow (m³/s)</label>
                  <input
                    type="number"
                    value={flowObserved}
                    onChange={(e) => setFlowObserved(e.target.value)}
                    placeholder={String(station.currentFlow)}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">Weather Condition</label>
                <input
                  type="text"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  placeholder="e.g. Heavy rainfall in upper catchment"
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">Field Notes & Riparian Observations *</label>
                <textarea
                  rows={4}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record bank stability, debris flow, embankment seepage, or visual gauge cross-checks..."
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Save to Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
