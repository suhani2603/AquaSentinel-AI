import { MonitoringStation, HydrologicalObservation, DamStation, RiskLevel } from '../types';
import { INITIAL_STATIONS } from '../data/stationsData';
import { calculateRiskScore } from '../utils/hydrology';

export type SimulationScenarioId = 
  | 'scenario-1-normal'
  | 'scenario-2-gradual-rise'
  | 'scenario-3-heavy-rainfall'
  | 'scenario-4-dam-release'
  | 'scenario-5-rapid-surge'
  | 'scenario-6-combined-risk';

export interface SimulationScenarioDefinition {
  id: SimulationScenarioId;
  number: number;
  title: string;
  shortName: string;
  description: string;
  targetCity: string;
  targetStationId: string;
  stepDescriptions: string[];
}

export const SIMULATION_SCENARIOS: SimulationScenarioDefinition[] = [
  {
    id: 'scenario-1-normal',
    number: 1,
    title: 'SCENARIO 1 — NORMAL CONDITIONS',
    shortName: 'Normal Conditions',
    description: 'Stable baseflow, nominal seasonal weather, controlled dam releases, and safe water levels well within channel bounds.',
    targetCity: 'Dehradun',
    targetStationId: 'station-dehradun-song',
    stepDescriptions: [
      'Normal baseline flow (~135 m³/s), calm clear weather, nominal water stage (1.45m).',
      'Mild diurnal variation (+2%), baseflow remains stable within safe limits.',
      'Slight seasonal runoff (+4%), water stage steady at 1.47m.',
      'Stable hydrological baseflow, all flood thresholds clear (NORMAL, score ~14/100).'
    ]
  },
  {
    id: 'scenario-2-gradual-rise',
    number: 2,
    title: 'SCENARIO 2 — GRADUAL RIVER RISE',
    shortName: 'Gradual River Rise',
    description: 'River discharge and stage climb steadily over progressive observation intervals as mountain catchment runoff arrives.',
    targetCity: 'Rishikesh',
    targetStationId: 'station-rishikesh-ganga',
    stepDescriptions: [
      'Steady baseline flow (2,480 m³/s), upstream catchment receiving steady moderate rain (28mm).',
      'Runoff arrives: flow rises to 2,650 m³/s (+6.9%), water stage rises +0.30m (WATCH).',
      'Progressive swelling: flow reaches 2,850 m³/s (+7.5%), stage rises +0.40m, score 38/100.',
      'Peak gradual rise: flow reaches 3,100 m³/s (+8.8%), stage approaching warning threshold (WATCH, score 48/100).',
      'Flow stabilizes at elevated plateau (3,050 m³/s) with controlled downstream transit.'
    ]
  },
  {
    id: 'scenario-3-heavy-rainfall',
    number: 3,
    title: 'SCENARIO 3 — HEAVY RAINFALL',
    shortName: 'Heavy Rainfall',
    description: 'Catchment precipitation accelerates rapidly from moderate rain to torrential cloudburst, causing severe surface runoff and swelling foothill tributaries.',
    targetCity: 'Dehradun',
    targetStationId: 'station-dehradun-song',
    stepDescriptions: [
      'Precipitation begins across foothill basin (25 mm / 24h), river flow steady at 180 m³/s.',
      'Rainfall intensifies (55 mm / 24h), surface runoff pools, flow surges to 280 m³/s (+55%).',
      'Torrential cloudburst (85 mm / 24h), river stage breaches Warning Threshold (2.95m).',
      'Peak deluge (118 mm / 24h), flow hits 580 m³/s (+163% vs baseline), WARNING alert triggered (Score 72/100).',
      'Rainfall eases into trailing showers (65 mm / 24h), stream begins gradual recession.'
    ]
  },
  {
    id: 'scenario-4-dam-release',
    number: 4,
    title: 'SCENARIO 4 — INCREASED DAM RELEASE',
    shortName: 'Increased Dam Release',
    description: 'Upstream storage reservoir detects massive mountain inflow and systematically opens spillway gates, generating a downstream flood wave.',
    targetCity: 'Haridwar',
    targetStationId: 'station-haridwar-ganga',
    stepDescriptions: [
      'Baseline controlled release (1,500 m³/s), 4 spillway gates open, nominal river stage 292.30m.',
      'Reservoir reaches full conservation level; 8 gates opened, release ramps to 2,100 m³/s (+40%).',
      'High spillway activation: 12 gates opened, release reaches 2,750 m³/s (+31% step).',
      'Full spillway discharge (3,200 m³/s) arrives at Haridwar; river stage rises +1.15m to 293.45m (WARNING, score 68/100).',
      'Controlled spillway discharge maintained as reservoir inflow balances.'
    ]
  },
  {
    id: 'scenario-5-rapid-surge',
    number: 5,
    title: 'SCENARIO 5 — RAPID FLOW INCREASE',
    shortName: 'Rapid Flow Increase',
    description: 'Sudden, severe surge in river flow (2,100 → 2,400 → 2,850 → 3,600 m³/s, +71.4%), crossing the rapid change threshold (>=25%) and triggering instant alerts.',
    targetCity: 'Delhi',
    targetStationId: 'station-delhi-yamuna',
    stepDescriptions: [
      'Baseline flow steady at 2,100 m³/s, water level 204.60m, calm conditions.',
      'Surge wave originates: flow climbs to 2,400 m³/s (+14.3%), stage rises +0.35m.',
      'Surge accelerates: flow reaches 2,850 m³/s (+18.8%), rapid acceleration detected.',
      'Threshold breached: flow spikes to 3,600 m³/s (+26.3% in single step, +71.4% total jump!). RAPID FLOW INCREASE ALERT triggered (Score 66/100, WARNING).',
      'Surge crest sustained at 3,750 m³/s before slowly stabilizing.'
    ]
  },
  {
    id: 'scenario-6-combined-risk',
    number: 6,
    title: 'SCENARIO 6 — COMBINED HIGH RISK',
    shortName: 'Combined High Risk',
    description: 'Compound extreme event: severe regional downpour (95mm) + rapid river flow surge (+91.7%) + emergency spillway barrage release + water stage exceeding CRITICAL DANGER MARK.',
    targetCity: 'Delhi',
    targetStationId: 'station-delhi-yamuna',
    stepDescriptions: [
      'Elevated monsoon baseline (flow 2,400 m³/s, rain 40mm, water level 204.80m).',
      'Heavy catchment storms (75mm) + Hathnikund Barrage opens 14 gates (3,400 m³/s release).',
      'River flow surges to 3,850 m³/s (+60%), stage breaches Warning Stage (205.33m).',
      'Full emergency discharge (4,800 m³/s) + 95mm rain; flow reaches 4,600 m³/s (+91.7% total surge).',
      'CRITICAL DANGER MARK EXCEEDED: Stage reaches 206.35m (Score 88/100, CRITICAL). Multiple compound alerts active.'
    ]
  }
];

export interface SimulationState {
  isRunning: boolean;
  activeScenarioId: SimulationScenarioId;
  activeStationId: string;
  stepIndex: number;
  totalSteps: number;
  currentStepDescription: string;
  lastUpdateTimestamp: string;
  countdownSeconds: number;
  intervalSeconds: number;
}

type SimulationListener = (stations: MonitoringStation[], state: SimulationState) => void;

class SimulationEngine {
  private stations: MonitoringStation[] = JSON.parse(JSON.stringify(INITIAL_STATIONS));
  private activeScenarioId: SimulationScenarioId = 'scenario-1-normal';
  private activeStationId: string = 'station-dehradun-song';
  private stepIndex: number = 0;
  private isRunning: boolean = true; // Auto-running by default for realistic demo
  private intervalSeconds: number = 12; // 12 seconds per step
  private countdownSeconds: number = 12;
  private timerId: NodeJS.Timeout | null = null;
  private countdownTimerId: NodeJS.Timeout | null = null;
  private listeners: Set<SimulationListener> = new Set();
  private lastUpdateTimestamp: string = new Date().toLocaleTimeString();

  constructor() {
    this.startEngine();
  }

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    listener(this.getStations(), this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentStations = this.getStations();
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentStations, currentState);
      } catch (err) {
        console.error('Error in simulation listener:', err);
      }
    });
  }

  public getStations(): MonitoringStation[] {
    return JSON.parse(JSON.stringify(this.stations));
  }

  public getStationById(id: string): MonitoringStation | null {
    const st = this.stations.find((s) => s.id === id);
    return st ? JSON.parse(JSON.stringify(st)) : null;
  }

  public getState(): SimulationState {
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === this.activeScenarioId) || SIMULATION_SCENARIOS[0];
    const totalSteps = scenario.stepDescriptions.length;
    const currentStepDescription = scenario.stepDescriptions[this.stepIndex % totalSteps];

    return {
      isRunning: this.isRunning,
      activeScenarioId: this.activeScenarioId,
      activeStationId: this.activeStationId,
      stepIndex: this.stepIndex,
      totalSteps,
      currentStepDescription,
      lastUpdateTimestamp: this.lastUpdateTimestamp,
      countdownSeconds: this.countdownSeconds,
      intervalSeconds: this.intervalSeconds,
    };
  }

  public startSimulation(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.countdownSeconds = this.intervalSeconds;
    this.notify();
  }

  public start(): void {
    this.startSimulation();
  }

  public pauseSimulation(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.notify();
  }

  public pause(): void {
    this.pauseSimulation();
  }

  public setScenario(scenarioId: SimulationScenarioId, targetStationId?: string): void {
    this.activeScenarioId = scenarioId;
    this.stepIndex = 0;
    this.countdownSeconds = this.intervalSeconds;
    
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) {
      this.activeStationId = targetStationId || scenario.targetStationId;
    }

    // Apply first step of scenario immediately
    this.applyScenarioStep(0);
    this.lastUpdateTimestamp = new Date().toLocaleTimeString();
    this.notify();
  }

  public resetSimulation(): void {
    this.stations = JSON.parse(JSON.stringify(INITIAL_STATIONS));
    this.stepIndex = 0;
    this.countdownSeconds = this.intervalSeconds;
    this.activeScenarioId = 'scenario-1-normal';
    this.activeStationId = 'station-dehradun-song';
    this.lastUpdateTimestamp = new Date().toLocaleTimeString();
    this.notify();
  }

  public reset(): void {
    this.resetSimulation();
  }

  public stepNow(): void {
    this.advanceStep();
    this.countdownSeconds = this.intervalSeconds;
    this.notify();
  }

  public setIntervalSeconds(seconds: number): void {
    this.intervalSeconds = Math.max(5, Math.min(60, seconds));
    this.countdownSeconds = this.intervalSeconds;
    this.notify();
  }

  private startEngine(): void {
    // 1-second countdown ticker for ultra-smooth UI countdown
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    this.countdownTimerId = setInterval(() => {
      if (!this.isRunning) return;

      this.countdownSeconds -= 1;
      if (this.countdownSeconds <= 0) {
        this.advanceStep();
        this.countdownSeconds = this.intervalSeconds;
      }
      this.notify();
    }, 1000);
  }

  /**
   * Advances the simulation to the next step along the active scenario trajectory.
   */
  private advanceStep(): void {
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === this.activeScenarioId) || SIMULATION_SCENARIOS[0];
    const maxSteps = scenario.stepDescriptions.length;
    this.stepIndex = (this.stepIndex + 1) % maxSteps;
    this.applyScenarioStep(this.stepIndex);
    this.lastUpdateTimestamp = new Date().toLocaleTimeString();
  }

  /**
   * Applies the exact calculated values for the specified step of the active scenario.
   */
  private applyScenarioStep(step: number): void {
    const targetId = this.activeStationId;

    this.stations = this.stations.map((station) => {
      // If not the target station, apply slight realistic background micro-fluctuations
      if (station.id !== targetId) {
        return this.applyBackgroundFluctuation(station);
      }

      // Compute scenario physics for target station
      return this.computeScenarioPhysics(station, this.activeScenarioId, step);
    });
  }

  private applyBackgroundFluctuation(st: MonitoringStation): MonitoringStation {
    // Slight continuous realistic drift (±1%)
    const drift = (Math.random() - 0.5) * 0.02;
    const currentFlow = Math.round(st.currentFlow * (1 + drift));
    const flowChangePercent = Number((((currentFlow - st.previousFlow) / Math.max(st.previousFlow, 1)) * 100).toFixed(1));
    const waterLevel = Number((st.currentWaterLevel + (drift * 0.1)).toFixed(2));

    const updated: MonitoringStation = {
      ...st,
      currentFlow,
      flowChangePercent,
      isRapidIncrease: flowChangePercent >= 25,
      currentWaterLevel: waterLevel,
      lastTelemetryUpdate: new Date().toISOString()
    };

    const { riskScore, riskLevel, riskFactors } = calculateRiskScore(updated);
    return {
      ...updated,
      riskScore,
      riskLevel,
      riskFactors
    };
  }

  private computeScenarioPhysics(
    station: MonitoringStation,
    scenarioId: SimulationScenarioId,
    step: number
  ): MonitoringStation {
    let flow = station.currentFlow;
    let prevFlow = station.previousFlow;
    let waterLevel = station.currentWaterLevel;
    let rain = station.rainfall24h || 10;
    let damDischarge = station.upstreamDam?.dischargeM3s || 0;
    let damGateStatus = station.upstreamDam?.gateStatus || 'Regulated baseflow';
    let damSafetyStatus: DamStation['safetyStatus'] = station.upstreamDam?.safetyStatus || 'NORMAL';

    switch (scenarioId) {
      case 'scenario-1-normal': {
        // Safe, stable oscillation
        const base = station.id === 'station-dehradun-song' ? 135 : 2100;
        const variations = [135, 138, 142, 136, 132, 137];
        const stages = [1.45, 1.47, 1.49, 1.46, 1.43, 1.45];
        const rains = [14.5, 16.0, 15.0, 12.0, 10.0, 14.5];

        const idx = step % variations.length;
        flow = variations[idx];
        prevFlow = idx === 0 ? 130 : variations[idx - 1];
        waterLevel = stages[idx];
        rain = rains[idx];
        damDischarge = station.upstreamDam?.isAvailable ? 450 : 0;
        damGateStatus = 'SIMULATED: 2 Service gates regulated';
        damSafetyStatus = 'NORMAL';
        break;
      }

      case 'scenario-2-gradual-rise': {
        // Step-by-step upward climb: 2480 -> 2650 -> 2850 -> 3100 -> 3050
        const flows = [2480, 2650, 2850, 3100, 3050];
        const prevs = [2380, 2480, 2650, 2850, 3100];
        const stages = [338.10, 338.45, 338.85, 339.20, 339.10];
        const rains = [28.0, 34.0, 42.0, 48.0, 38.0];
        const damReleases = [720, 780, 850, 920, 880];

        const idx = step % flows.length;
        flow = flows[idx];
        prevFlow = prevs[idx];
        waterLevel = stages[idx];
        rain = rains[idx];
        damDischarge = damReleases[idx];
        damGateStatus = 'SIMULATED: Power canal & 4 spillway gates active';
        damSafetyStatus = idx >= 3 ? 'CAUTION' : 'NORMAL';
        break;
      }

      case 'scenario-3-heavy-rainfall': {
        // Rain spike: 25 -> 55 -> 85 -> 118 -> 65 mm
        const flows = [180, 280, 420, 580, 490];
        const prevs = [140, 180, 280, 420, 580];
        const stages = [1.80, 2.45, 3.10, 3.65, 3.25];
        const rains = [25.0, 55.0, 85.0, 118.0, 65.0];

        const idx = step % flows.length;
        flow = flows[idx];
        prevFlow = prevs[idx];
        waterLevel = stages[idx];
        rain = rains[idx];
        damDischarge = 0;
        damGateStatus = 'Direct catchment runoff tributary';
        damSafetyStatus = 'NORMAL';
        break;
      }

      case 'scenario-4-dam-release': {
        // Dam discharge ramping: 1500 -> 2100 -> 2750 -> 3200 -> 3000
        const flows = [2100, 2500, 2950, 3400, 3300];
        const prevs = [1850, 2100, 2500, 2950, 3400];
        const stages = [292.30, 292.70, 293.10, 293.45, 293.30];
        const rains = [18.0, 22.0, 25.0, 28.0, 24.0];
        const damReleases = [1500, 2100, 2750, 3200, 3000];
        const gateStatuses = [
          'SIMULATED: 4 Sluice gates open',
          'SIMULATED: 8 Sluice gates open (+40% surge)',
          'SIMULATED: 12 Sluice gates open',
          'SIMULATED: 14 Spillways fully discharging (+3,200 m³/s)',
          'SIMULATED: 12 Spillways regulated release'
        ];

        const idx = step % flows.length;
        flow = flows[idx];
        prevFlow = prevs[idx];
        waterLevel = stages[idx];
        rain = rains[idx];
        damDischarge = damReleases[idx];
        damGateStatus = gateStatuses[idx];
        damSafetyStatus = idx >= 3 ? 'HIGH_SPILLWAY_RELEASE' : (idx >= 1 ? 'ELEVATED' : 'NORMAL');
        break;
      }

      case 'scenario-5-rapid-surge': {
        // 2100 -> 2400 -> 2850 -> 3600 -> 3750
        const flows = [2100, 2400, 2850, 3600, 3750];
        const prevs = [2100, 2100, 2400, 2850, 3600];
        const stages = [204.60, 204.95, 205.35, 205.85, 205.95];
        const rains = [20.0, 32.0, 45.0, 52.0, 48.0];
        const damReleases = [2100, 2500, 3100, 3600, 3600];

        const idx = step % flows.length;
        flow = flows[idx];
        prevFlow = prevs[idx];
        waterLevel = stages[idx];
        rain = rains[idx];
        damDischarge = damReleases[idx];
        damGateStatus = idx >= 3 ? 'SIMULATED: 14 Spillway gates opened (Rapid Surge)' : 'SIMULATED: 8 Spillways opened';
        damSafetyStatus = idx >= 3 ? 'HIGH_SPILLWAY_RELEASE' : 'ELEVATED';
        break;
      }

      case 'scenario-6-combined-risk': {
        // Extreme compound: 2400 -> 3100 -> 3850 -> 4600 -> 4750
        const flows = [2400, 3100, 3850, 4600, 4750];
        const prevs = [2100, 2400, 3100, 3850, 4600];
        const stages = [204.80, 205.35, 205.85, 206.35, 206.50];
        const rains = [40.0, 65.0, 85.0, 95.0, 102.0];
        const damReleases = [2200, 3200, 4100, 4800, 4800];
        const gateStatuses = [
          'SIMULATED: 8 Spillway gates discharging',
          'SIMULATED: 14 Spillway gates discharging (Storm inflow)',
          'SIMULATED: 16 Spillway gates discharging',
          'SIMULATED: All 18 Spillways fully open (+4,800 m³/s)',
          'SIMULATED: All 18 Spillways discharging at maximum head'
        ];

        const idx = step % flows.length;
        flow = flows[idx];
        prevFlow = prevs[idx];
        waterLevel = stages[idx];
        rain = rains[idx];
        damDischarge = damReleases[idx];
        damGateStatus = gateStatuses[idx];
        damSafetyStatus = idx >= 2 ? 'HIGH_SPILLWAY_RELEASE' : 'ELEVATED';
        break;
      }
    }

    const flowChangePercent = Number((((flow - prevFlow) / Math.max(prevFlow, 1)) * 100).toFixed(1));
    const isRapid = flowChangePercent >= 25 || (scenarioId === 'scenario-5-rapid-surge' && step >= 3);

    const updatedDam: DamStation = {
      ...station.upstreamDam,
      dischargeM3s: station.upstreamDam?.isAvailable ? damDischarge : null,
      previousDischargeM3s: station.upstreamDam?.dischargeM3s || damDischarge,
      gateStatus: damGateStatus,
      safetyStatus: damSafetyStatus,
      lastUpdated: new Date().toISOString()
    };

    // Construct fresh observation to append to time series history
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newObservation: HydrologicalObservation = {
      timestamp: now.toISOString(),
      displayTime: `${timeString} (Step ${step + 1})`,
      city: station.city,
      river: station.riverName,
      monitoring_station: station.gaugeStationName,
      river_flow_m3s: flow,
      water_level_m: waterLevel,
      rainfall_mm: rain,
      dam_name: updatedDam.name,
      dam_release_m3s: updatedDam.dischargeM3s,
      reservoir_level_m: updatedDam.reservoirElevationMeters,
      warning_threshold: station.warningStage,
      danger_threshold: station.criticalStage,
      rateOfChangePercent: flowChangePercent,
      isRapidIncrease: isRapid
    };

    // Keep rolling history up to 14 points
    const newHistory = [...station.history, newObservation].slice(-14);

    const updatedStation: MonitoringStation = {
      ...station,
      currentFlow: flow,
      previousFlow: prevFlow,
      flowChangePercent,
      isRapidIncrease: isRapid,
      currentWaterLevel: waterLevel,
      previousWaterLevel: station.currentWaterLevel,
      rainfall24h: rain,
      upstreamDam: updatedDam,
      history: newHistory,
      lastTelemetryUpdate: now.toISOString()
    };

    const { riskScore, riskLevel, riskFactors } = calculateRiskScore(updatedStation);

    return {
      ...updatedStation,
      riskScore,
      riskLevel,
      riskFactors
    };
  }
}

export const simulationEngine = new SimulationEngine();
