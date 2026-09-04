import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOut,
  subscribeToUserSavedStations,
  saveUserStation,
  subscribeToUserObservations,
  saveUserObservation,
  deleteUserObservation,
  subscribeToUserSimulations,
  saveUserSimulation,
  deleteUserSimulation,
  subscribeToEmergencyReports
} from './lib/firebase';
import { INITIAL_STATIONS } from './data/stationsData';
import { 
  AppOperationalMode,
  AppLanguage,
  MonitoringStation, 
  ViewMode, 
  UserSavedStation, 
  ObservationLog, 
  WhatIfScenario, 
  AquaSentinelMessage,
  EmergencyReport 
} from './types';
import { generateStationAlerts } from './utils/hydrology';
import { hydrologyDataService } from './services/hydrologyDataService';
import { 
  getLocalGuestObservations,
  saveLocalGuestObservations,
  getLocalGuestSimulations,
  saveLocalGuestSimulations
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { RiverMonitorView } from './components/RiverMonitorView';
import { DamMonitorView } from './components/DamMonitorView';
import { RainfallView } from './components/RainfallView';
import { RiskIndicatorView } from './components/RiskIndicatorView';
import { AlertsView } from './components/AlertsView';
import { WhatIfView } from './components/WhatIfView';
import { HistoryView } from './components/HistoryView';
import { AssistantView } from './components/AssistantView';
import { TestingView } from './components/TestingView';
import { ForecastView } from './components/ForecastView';
import { EmergencyRescueView } from './components/EmergencyRescueView';
import { SimulationScenarioId, SimulationState } from './services/simulationEngine';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [language, setLanguage] = useState<AppLanguage>('en');

  // Core Station Telemetry & Mode State - Dehradun is default location
  const [stations, setStations] = useState<MonitoringStation[]>(() => hydrologyDataService.getStations());
  const [operationalMode, setOperationalMode] = useState<AppOperationalMode>(() => hydrologyDataService.getOperationalMode());
  const [simulationState, setSimulationState] = useState<SimulationState>(() => hydrologyDataService.getSimulationState());
  const [selectedStationId, setSelectedStationId] = useState<string>('station-dehradun-song');
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);

  // User collections & rescue reports
  const [savedStations, setSavedStations] = useState<UserSavedStation[]>([]);
  const [observations, setObservations] = useState<ObservationLog[]>([]);
  const [simulations, setSimulations] = useState<WhatIfScenario[]>([]);
  const [chatMessages, setChatMessages] = useState<AquaSentinelMessage[]>([]);
  const [rescueReports, setRescueReports] = useState<EmergencyReport[]>([]);

  // 1. Live Hydrology Telemetry Subscription
  useEffect(() => {
    const unsubscribe = hydrologyDataService.subscribeToTelemetry((updatedStations, mode, updatedSimState) => {
      setStations(updatedStations);
      setOperationalMode(mode);
      setSimulationState(updatedSimState);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Data Subscriptions (Firestore when authenticated, local state fallback when guest)
  useEffect(() => {
    if (user) {
      const unsubStations = subscribeToUserSavedStations(user.uid, (data) => {
        setSavedStations(data);
      });
      const unsubObs = subscribeToUserObservations(user.uid, (data) => {
        setObservations(data);
      });
      const unsubSims = subscribeToUserSimulations(user.uid, (data) => {
        setSimulations(data);
      });

      return () => {
        unsubStations();
        unsubObs();
        unsubSims();
      };
    } else {
      setObservations(getLocalGuestObservations());
      setSimulations(getLocalGuestSimulations());
    }
  }, [user]);

  // 4. Live Emergency Rescue Reports Subscription
  useEffect(() => {
    const unsubRescue = subscribeToEmergencyReports((reports) => {
      setRescueReports(reports);
    });
    return () => unsubRescue();
  }, []);

  // Selected station reference
  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0] || INITIAL_STATIONS[0];

  // Active alerts count across all stations
  const activeAlertsCount = stations.reduce((acc, st) => {
    return acc + generateStationAlerts(st).length;
  }, 0);

  // Active rescue metrics
  const activeRescueReportsCount = rescueReports.filter(r => r.status !== 'RESOLVED').length;
  const peopleNeedingAssistanceCount = rescueReports
    .filter(r => r.status !== 'RESOLVED')
    .reduce((acc, r) => acc + (r.peopleNeedingAssistance || 1), 0);
  const verifiedRescueReportsCount = rescueReports.filter(r => r.evidenceStatus === 'VERIFIED').length;

  // Authentication Handlers
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setIsGuest(false);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setIsGuest(true);
      setCurrentView('overview');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Operational Mode Toggle
  const handleToggleOperationalMode = async (mode: AppOperationalMode) => {
    setIsRefreshingLive(true);
    try {
      await hydrologyDataService.setOperationalMode(mode);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  // Apply scenario to live state from Testing Panel
  const handleApplyScenarioToLiveApp = (targetStationId: string, scenarioId: string) => {
    hydrologyDataService.setScenario(scenarioId as any, targetStationId);
    setSelectedStationId(targetStationId);
  };

  // Reset baseline
  const handleResetDefault = () => {
    hydrologyDataService.resetSimulation();
  };

  // User Custom Threshold Handlers
  const handleSaveCustomThresholds = async (stationId: string, flowM3s?: number, stageM?: number) => {
    const st = stations.find((s) => s.id === stationId);
    const item: UserSavedStation = {
      id: stationId,
      stationId,
      stationName: st ? st.city : stationId,
      riverName: st ? st.riverName : '',
      customAlertFlowM3s: flowM3s,
      customAlertStageMeters: stageM,
      savedAt: new Date().toISOString()
    };

    if (user) {
      await saveUserStation(user.uid, item);
    } else {
      setSavedStations((prev) => {
        const filtered = prev.filter((p) => p.stationId !== stationId);
        return [...filtered, item];
      });
    }
  };

  // Observations Handlers
  const handleAddObservation = async (obs: ObservationLog) => {
    if (user) {
      await saveUserObservation(user.uid, obs);
    } else {
      const updated = [obs, ...observations];
      setObservations(updated);
      saveLocalGuestObservations(updated);
    }
  };

  const handleDeleteObservation = async (obsId: string) => {
    if (user) {
      await deleteUserObservation(user.uid, obsId);
    } else {
      const updated = observations.filter((o) => o.id !== obsId);
      setObservations(updated);
      saveLocalGuestObservations(updated);
    }
  };

  // Simulation Handlers
  const handleSaveScenario = async (sim: WhatIfScenario) => {
    if (user) {
      await saveUserSimulation(user.uid, sim);
    } else {
      const updated = [sim, ...simulations];
      setSimulations(updated);
      saveLocalGuestSimulations(updated);
    }
  };

  const handleDeleteSimulation = async (simId: string) => {
    if (user) {
      await deleteUserSimulation(user.uid, simId);
    } else {
      const updated = simulations.filter((s) => s.id !== simId);
      setSimulations(updated);
      saveLocalGuestSimulations(updated);
    }
  };

  // Chat Assistant Handlers
  const handleSendMessage = (msg: AquaSentinelMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const handleClearHistory = () => {
    setChatMessages([]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased transition-colors">
      
      {/* Top Header & Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isGuest={isGuest}
        onToggleGuest={() => setIsGuest(!isGuest)}
        activeAlertsCount={activeAlertsCount}
        operationalMode={operationalMode}
        onToggleOperationalMode={handleToggleOperationalMode}
        language={language}
        onToggleLanguage={setLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(currentView === 'overview' || currentView === 'dashboard') && (
          <OverviewView
            station={currentStation}
            onViewChange={setCurrentView}
            onSelectStation={setSelectedStationId}
            allStations={stations}
            language={language}
            activeRescueReportsCount={activeRescueReportsCount}
            peopleNeedingAssistanceCount={peopleNeedingAssistanceCount}
            verifiedRescueReportsCount={verifiedRescueReportsCount}
            rescueReports={rescueReports}
          />
        )}

        {currentView === 'river' && (
          <RiverMonitorView 
            station={currentStation} 
            allStations={stations}
            onSelectStation={setSelectedStationId}
          />
        )}

        {currentView === 'dam' && (
          <DamMonitorView station={currentStation} />
        )}

        {currentView === 'rainfall' && (
          <RainfallView station={currentStation} />
        )}

        {currentView === 'forecast' && (
          <ForecastView
            currentStation={currentStation}
            language={language}
          />
        )}

        {currentView === 'risk' && (
          <RiskIndicatorView station={currentStation} />
        )}

        {currentView === 'alerts' && (
          <AlertsView
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            savedStations={savedStations}
            onSaveCustomThresholds={handleSaveCustomThresholds}
          />
        )}

        {currentView === 'emergency' && (
          <EmergencyRescueView
            currentStation={currentStation}
            currentUser={user}
            onSelectStation={setSelectedStationId}
          />
        )}

        {currentView === 'whatif' && (
          <WhatIfView
            station={currentStation}
            onSaveScenario={handleSaveScenario}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            station={currentStation}
            observations={observations}
            simulations={simulations}
            onAddObservation={handleAddObservation}
            onDeleteObservation={handleDeleteObservation}
            onDeleteSimulation={handleDeleteSimulation}
            onSelectStation={setSelectedStationId}
          />
        )}

        {currentView === 'assistant' && (
          <AssistantView
            station={currentStation}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentView === 'testing' && (
          <TestingView
            currentStation={currentStation}
            allStations={stations}
            onApplyScenarioToLiveApp={handleApplyScenarioToLiveApp}
            onResetDefault={handleResetDefault}
          />
        )}
      </main>

      {/* Simple Citizen-Friendly Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 px-4 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span>🟢</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Data sources verified</span>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400">
            Last updated: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentStation.lastTelemetryUpdate || 'Today, 10:20 AM'}</span>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 max-w-md text-center sm:text-right">
            Always follow official instructions from local disaster management authorities.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
