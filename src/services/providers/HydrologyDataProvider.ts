import { MonitoringStation } from '../../types';

export interface RiverWaterLevelResult {
  waterLevel: number | null;
  unit: string;
  timestamp: string;
  isAvailable: boolean;
  isStale: boolean;
  source: string;
  thresholdType: 'OFFICIAL_CWC' | 'PROTOTYPE_CONFIGURED';
  warningThreshold: number;
  dangerThreshold: number;
}

export interface RiverDischargeResult {
  discharge: number | null;
  unit: string;
  timestamp: string;
  isAvailable: boolean;
  isStale: boolean;
  source: string;
  previousDischarge?: number | null;
  rateOfChangePercent?: number | null;
  isRapidIncrease?: boolean;
}

export interface RainfallResult {
  rainfall24h: number | null;
  rainfallIntensityMmHr?: number | null;
  unit: string;
  timestamp: string;
  isAvailable: boolean;
  isStale: boolean;
  source: string;
  condition?: string;
}

export interface WeatherResult {
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  weatherDescription: string | null;
  timestamp: string;
  isAvailable: boolean;
  isStale: boolean;
  source: string;
}

export interface ReservoirDataResult {
  isAvailable: boolean;
  damName: string | null;
  reservoirLevelPercent: number | null;
  reservoirElevationMeters: number | null;
  inflowM3s: number | null;
  dischargeM3s: number | null;
  previousDischargeM3s: number | null;
  gateStatus: string | null;
  safetyStatus: 'NORMAL' | 'ELEVATED' | 'HIGH_SPILLWAY_RELEASE' | 'UNKNOWN' | 'CAUTION';
  timestamp: string;
  isStale: boolean;
  source: string;
  note?: string;
}

/**
 * Clean Hydrology Data Provider Contract
 * The UI and Risk Engine interact solely through this unified contract.
 */
export interface HydrologyDataProvider {
  readonly modeName: 'SIMULATION' | 'LIVE';
  
  getRiverWaterLevel(stationId: string): Promise<RiverWaterLevelResult>;
  getRiverDischarge(stationId: string): Promise<RiverDischargeResult>;
  getRainfall(stationId: string): Promise<RainfallResult>;
  getWeather(stationId: string): Promise<WeatherResult>;
  getReservoirData(stationId: string): Promise<ReservoirDataResult>;
  
  getStationObservation(stationId: string): Promise<MonitoringStation>;
  getAllStations(): Promise<MonitoringStation[]>;
}
