import { AppOperationalMode, MonitoringStation } from '../types';
import { HydrologyDataProvider } from './providers/HydrologyDataProvider';
import { SimulationDataProvider } from './providers/SimulationDataProvider';
import { LiveDataProvider } from './providers/LiveDataProvider';
import { simulationEngine, SimulationScenarioId, SimulationState, SIMULATION_SCENARIOS } from './simulationEngine';
import { INITIAL_STATIONS } from '../data/stationsData';

export type HydrologyDataListener = (
  stations: MonitoringStation[], 
  mode: AppOperationalMode,
  simulationState: SimulationState
) => void;

class HydrologyDataService {
  private currentMode: AppOperationalMode = 'LIVE'; // Defaults to real LIVE data
  private simulationProvider: SimulationDataProvider;
  private liveProvider: LiveDataProvider;
  private listeners: Set<HydrologyDataListener> = new Set();
  private cachedStations: MonitoringStation[] = INITIAL_STATIONS;
  private isFetchingLive: boolean = false;
  private refreshTimer: any = null;

  constructor() {
    this.simulationProvider = new SimulationDataProvider();
    this.liveProvider = new LiveDataProvider();
    
    // Initial fetch of live real hydrological data
    this.refreshLiveData().catch((e) => console.warn('Initial live fetch warning:', e));

    // Periodic auto-refresh every 5 minutes in live mode
    this.refreshTimer = setInterval(() => {
      if (this.currentMode === 'LIVE') {
        this.refreshLiveData().catch(console.error);
      }
    }, 5 * 60 * 1000);

    // Listen to simulation engine updates when in testing simulation mode
    simulationEngine.subscribe((simStations, simState) => {
      if (this.currentMode === 'SIMULATION') {
        this.cachedStations = simStations.map((s) => ({
          ...s,
          dataMode: 'SIMULATION',
          dataSourceStatus: 'SIMULATED_DATA'
        }));
        this.notify(simState);
      }
    });
  }

  public getActiveProvider(): HydrologyDataProvider {
    return this.currentMode === 'LIVE' ? this.liveProvider : this.simulationProvider;
  }

  public getOperationalMode(): AppOperationalMode {
    return this.currentMode;
  }

  public async setOperationalMode(mode: AppOperationalMode): Promise<void> {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    if (mode === 'LIVE') {
      await this.refreshLiveData();
    } else {
      this.cachedStations = simulationEngine.getStations().map((s) => ({
        ...s,
        dataMode: 'SIMULATION',
        dataSourceStatus: 'SIMULATED_DATA'
      }));
      this.notify(this.getSimulationState());
    }
  }

  public async refreshLiveData(): Promise<MonitoringStation[]> {
    this.isFetchingLive = true;
    try {
      this.liveProvider.invalidateCache();
      const liveStations = await this.liveProvider.getAllStations();
      if (this.currentMode === 'LIVE' && liveStations && liveStations.length > 0) {
        this.cachedStations = liveStations;
        this.notify(this.getSimulationState());
      }
      return this.cachedStations;
    } catch (err) {
      console.error('Error refreshing live hydrology data:', err);
      return this.cachedStations;
    } finally {
      this.isFetchingLive = false;
    }
  }

  public getStations(): MonitoringStation[] {
    return this.cachedStations && this.cachedStations.length > 0 ? this.cachedStations : INITIAL_STATIONS;
  }

  public getStationById(id: string): MonitoringStation | null {
    return (this.cachedStations && this.cachedStations.length > 0 ? this.cachedStations : INITIAL_STATIONS).find((s) => s.id === id) || null;
  }

  public getSimulationState(): SimulationState {
    return simulationEngine.getState();
  }

  public getSimulationScenarios() {
    return SIMULATION_SCENARIOS;
  }

  public startSimulation(): void {
    simulationEngine.start();
  }

  public pauseSimulation(): void {
    simulationEngine.pause();
  }

  public resetSimulation(): void {
    simulationEngine.reset();
  }

  public stepNow(): void {
    if (this.currentMode === 'LIVE') {
      this.refreshLiveData();
    } else {
      simulationEngine.stepNow();
    }
  }

  public setScenario(scenarioId: SimulationScenarioId, targetStationId?: string): void {
    simulationEngine.setScenario(scenarioId, targetStationId);
  }

  public subscribeToTelemetry(listener: HydrologyDataListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.cachedStations, this.currentMode, this.getSimulationState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: SimulationState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.cachedStations, this.currentMode, state);
      } catch (err) {
        console.error('Error in hydrology data service listener:', err);
      }
    });
  }
}

export const hydrologyDataService = new HydrologyDataService();
