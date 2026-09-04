import { MonitoringStation } from '../../types';
import { 
  HydrologyDataProvider, 
  RiverWaterLevelResult, 
  RiverDischargeResult, 
  RainfallResult, 
  WeatherResult, 
  ReservoirDataResult 
} from './HydrologyDataProvider';
import { simulationEngine } from '../simulationEngine';

export class SimulationDataProvider implements HydrologyDataProvider {
  public readonly modeName = 'SIMULATION';

  public async getRiverWaterLevel(stationId: string): Promise<RiverWaterLevelResult> {
    const station = simulationEngine.getStationById(stationId) || simulationEngine.getStations()[0];
    return {
      waterLevel: station.currentWaterLevel,
      unit: 'm',
      timestamp: station.lastTelemetryUpdate || new Date().toISOString(),
      isAvailable: true,
      isStale: false,
      source: 'AquaSentinel Hydrology Simulation Engine (Simulated)',
      thresholdType: station.thresholdType,
      warningThreshold: station.warningStage,
      dangerThreshold: station.criticalStage
    };
  }

  public async getRiverDischarge(stationId: string): Promise<RiverDischargeResult> {
    const station = simulationEngine.getStationById(stationId) || simulationEngine.getStations()[0];
    return {
      discharge: station.currentFlow,
      unit: 'm³/s',
      timestamp: station.lastTelemetryUpdate || new Date().toISOString(),
      isAvailable: true,
      isStale: false,
      source: 'AquaSentinel Hydrology Simulation Engine (Simulated)',
      previousDischarge: station.previousFlow,
      rateOfChangePercent: station.flowChangePercent,
      isRapidIncrease: station.isRapidIncrease
    };
  }

  public async getRainfall(stationId: string): Promise<RainfallResult> {
    const station = simulationEngine.getStationById(stationId) || simulationEngine.getStations()[0];
    return {
      rainfall24h: station.rainfall24h,
      rainfallIntensityMmHr: station.rainfallIntensityMmHr,
      unit: 'mm',
      timestamp: station.lastTelemetryUpdate || new Date().toISOString(),
      isAvailable: true,
      isStale: false,
      source: 'AquaSentinel Weather Simulation Model (Simulated)'
    };
  }

  public async getWeather(stationId: string): Promise<WeatherResult> {
    const station = simulationEngine.getStationById(stationId) || simulationEngine.getStations()[0];
    return {
      temperatureC: station.weatherCondition?.temperatureC ?? 26.5,
      humidityPercent: station.weatherCondition?.humidityPercent ?? 75,
      windSpeedKmh: station.weatherCondition?.windSpeedKmh ?? 10.0,
      weatherDescription: station.weatherCondition?.weatherDescription ?? 'Simulated Monsoon Pattern',
      timestamp: station.lastTelemetryUpdate || new Date().toISOString(),
      isAvailable: true,
      isStale: false,
      source: 'AquaSentinel Simulated Meteorology'
    };
  }

  public async getReservoirData(stationId: string): Promise<ReservoirDataResult> {
    const station = simulationEngine.getStationById(stationId) || simulationEngine.getStations()[0];
    const dam = station.upstreamDam;
    
    if (!dam || !dam.isAvailable) {
      return {
        isAvailable: false,
        damName: dam?.name || 'No Direct Upstream Dam',
        reservoirLevelPercent: null,
        reservoirElevationMeters: null,
        inflowM3s: null,
        dischargeM3s: null,
        previousDischargeM3s: null,
        gateStatus: null,
        safetyStatus: 'NORMAL',
        timestamp: new Date().toISOString(),
        isStale: false,
        source: 'Data unavailable (Rainfall-driven catchment; no direct upstream storage dam)',
        note: dam?.note
      };
    }

    return {
      isAvailable: true,
      damName: dam.name,
      reservoirLevelPercent: dam.reservoirLevelPercent,
      reservoirElevationMeters: dam.reservoirElevationMeters,
      inflowM3s: dam.inflowM3s,
      dischargeM3s: dam.dischargeM3s,
      previousDischargeM3s: dam.previousDischargeM3s || null,
      gateStatus: dam.gateStatus,
      safetyStatus: dam.safetyStatus,
      timestamp: dam.lastUpdated,
      isStale: false,
      source: 'Simulated Upstream Dam Control System',
      note: dam.note
    };
  }

  public async getStationObservation(stationId: string): Promise<MonitoringStation> {
    const station = simulationEngine.getStationById(stationId);
    if (!station) {
      return simulationEngine.getStations()[0];
    }
    return {
      ...station,
      dataMode: 'SIMULATION',
      dataSourceStatus: 'SIMULATED_DATA'
    };
  }

  public async getAllStations(): Promise<MonitoringStation[]> {
    return simulationEngine.getStations().map((st) => ({
      ...st,
      dataMode: 'SIMULATION',
      dataSourceStatus: 'SIMULATED_DATA'
    }));
  }
}
