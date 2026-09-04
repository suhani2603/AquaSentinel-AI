export type RiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'DANGER' | 'INSUFFICIENT_DATA' | 'CRITICAL';

export interface EvidenceBasedRiskAssessment {
  riskLevel: RiskLevel;
  riskScoreLabel: string;
  rainfallCondition: 'NORMAL' | 'ELEVATED' | 'HISTORICALLY_UNUSUAL' | 'EXTREME' | 'DATA_UNAVAILABLE';
  riverCondition: 'STABLE' | 'RISING' | 'APPROACHING_WARNING' | 'DANGER_THRESHOLD_BREACHED' | 'DATA_UNAVAILABLE';
  primaryTriggers: string[];
  historicalComparison: string;
  dataConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  officialThresholdComparison: string;
  officialWarningActive: boolean;
  officialWarningSummary: string | null;
  verifiedRescueIncidentsCount: number;
  plainLanguageSummary: string;
  actionRecommendation: string;
}

export type AppOperationalMode = 'SIMULATION' | 'LIVE';
export type AppLanguage = 'en' | 'hi';

export type DataSourceStatus = 
  | 'LIVE_DATA' 
  | 'SIMULATED_DATA' 
  | 'DATA_UNAVAILABLE' 
  | 'STALE_DATA';

export type ThresholdType = 'OFFICIAL_CWC' | 'PROTOTYPE_CONFIGURED';

export interface OfficialWarning {
  id: string;
  stationId: string;
  title: string;
  description: string;
  issuingAuthority: 'India Meteorological Department (IMD)' | 'Central Water Commission (CWC)' | 'Uttarakhand State Disaster Management Authority (USDMA)' | 'District Disaster Management Authority (DDMA)';
  severity: 'INFO' | 'WATCH' | 'WARNING' | 'CRITICAL';
  issuedAt: string;
  validUntil: string;
  bulletinNumber?: string;
  sourceUrl?: string;
  areaAffected: string;
  isOfficial: boolean;
}

export interface HourlyForecastItem {
  time: string;
  displayHour: string;
  precipitationMm: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  tempC: number;
}

export interface AlertPreference {
  heavyRainfall: boolean;
  riverLevel: boolean;
  officialFloodWarnings: boolean;
  highRiskChanges: boolean;
  emergencyAlerts: boolean;
  browserPushEnabled?: boolean;
}

export type ViewMode = 
  | 'overview' 
  | 'river' 
  | 'rainfall' 
  | 'forecast' 
  | 'dam' 
  | 'alerts' 
  | 'whatif' 
  | 'assistant' 
  | 'emergency' 
  | 'history'
  | 'testing'
  | 'dashboard'
  | 'risk';

export type ActiveTab = ViewMode;

/**
 * Single observation record in the time series (minimum 7-day data)
 */
export interface HydrologicalObservation {
  timestamp: string; // e.g. "2026-08-24 00:00" or ISO
  displayTime: string; // e.g. "Aug 24 00:00" or "Day 1 08:00"
  city: string;
  river: string;
  monitoring_station: string;
  river_flow_m3s: number | null;
  water_level_m: number | null;
  rainfall_mm: number | null;
  dam_name: string | null;
  dam_release_m3s: number | null;
  reservoir_level_m: number | null;
  warning_threshold: number | null;
  danger_threshold: number | null;
  rateOfChangePercent?: number | null;
  isRapidIncrease?: boolean;
}

export interface DamStation {
  id: string;
  name: string;
  river: string;
  distanceUpstreamKm: number | null;
  reservoirLevelPercent: number | null;
  reservoirElevationMeters: number | null;
  inflowM3s: number | null;
  dischargeM3s: number | null;
  previousDischargeM3s?: number | null;
  gateStatus: string | null; // e.g. "4 of 12 Gates Opened" or null
  safetyStatus: 'NORMAL' | 'ELEVATED' | 'HIGH_SPILLWAY_RELEASE' | 'UNKNOWN' | 'CAUTION';
  lastUpdated: string;
  isAvailable: boolean;
  travelTimeToStationHours: number | null;
  sourceAttribution?: string;
  note?: string;
}

export interface RiskFactorBreakdown {
  flowFactor: number; // 0-100
  surgeRateFactor: number; // 0-100
  waterLevelFactor: number; // 0-100
  rainfallFactor: number; // 0-100
  damFactor: number; // 0-100
  dominantDriver: string;
}

export interface WeatherConditionInfo {
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  weatherDescription: string | null;
  isAvailable: boolean;
  timestamp?: string;
}

export interface WeatherForecastDay {
  date: string;
  dayName: string; // e.g. "Today", "Tomorrow", "Wed", "Thu"
  weatherCode: number;
  weatherDescription: string;
  iconType: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain' | 'heavy-rain' | 'thunderstorm';
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationProbability: number;
  floodRiskCorrelation: 'LOW_RISK' | 'MONITOR' | 'ELEVATED' | 'HIGH';
  floodRiskExplanation: string;
}

export interface RainfallStationObservation {
  stationId: string;
  stationName: string; // e.g. "Dehradun — Asharori"
  shortName?: string; // e.g. "Asharori"
  city: string;
  rainfall24h: number | null; // e.g. 57.0 (or null if unavailable)
  rainfallIntensityMmHr: number | null; // e.g. 6.5 mm/h
  measurementPeriod: string; // "previous 24 hours"
  observationTimestamp: string; // e.g. "Sep 2, 2026, 08:30 IST"
  source: string; // "IMD"
  sourceFullName?: string; // "India Meteorological Department (IMD)"
  dataFreshness: string; // "Live / Recent (Verified)"
  isAvailable: boolean;
  stationType?: 'AWS' | 'OBSERVATORY' | 'RAINGAUGE';
  elevationMeters?: number;
  statusNote?: string;
}

export interface MonitoringStation {
  id: string;
  city: string;
  stateOrRegion: string;
  country: string;
  riverName: string;
  basinName: string;
  gaugeStationName: string;
  latitude: number;
  longitude: number;
  upstreamDam: DamStation;
  catchmentAreaKm2?: number;
  focusDescription: string;
  
  // Operational Mode & Data Status
  dataMode: AppOperationalMode;
  dataSourceStatus: DataSourceStatus;
  waterLevelSource: string;
  dischargeSource: string;
  rainfallSource: string;
  reservoirSource: string;
  
  // Source fresh / staleness metadata
  isStale?: boolean;
  staleTimestamp?: string;
  officialDataSourceUrl?: string;

  // Real-time telemetry
  currentFlow: number | null; // m³/s
  previousFlow: number | null; // m³/s
  flowChangePercent: number; // %
  isRapidIncrease: boolean; // true if surge > 25%
  currentWaterLevel: number | null; // meters
  previousWaterLevel: number | null; // meters
  
  // Stage Thresholds & Labels
  normalStage: number; // m
  alertStage: number; // m
  warningStage: number; // m
  criticalStage: number; // m (Danger threshold)
  bankfullLevel: number; // m
  designPeakFlow: number; // m³/s
  thresholdType: ThresholdType;
  warningStageLabel: string; // e.g. "Official CWC Warning Level" vs "Prototype threshold"
  criticalStageLabel: string; // e.g. "Official CWC Danger Level" vs "Prototype threshold"

  // Weather & Dam telemetry
  rainfall24h: number | null; // mm
  rainfall1h?: number | null; // mm
  rainfall6h?: number | null; // mm
  rainfallIntensityMmHr?: number | null;
  weatherCondition?: WeatherConditionInfo;
  forecast?: WeatherForecastDay[];
  hourlyForecast?: HourlyForecastItem[];
  officialWarnings?: OfficialWarning[];

  // Detailed Multi-Station Rainfall Observations
  rainfallObservationStations?: RainfallStationObservation[];
  selectedRainfallStationId?: string;
  rainfallMeasurementPeriod?: string;
  rainfallObservationTimestamp?: string;
  rainfallObservationStationName?: string;
  rainfallFreshness?: string;
  hasMultipleRainfallStations?: boolean;
  aiSimpleExplanation?: string;
  
  // Available Data Source Flags
  availableDataSources: {
    riverLevel: boolean;
    discharge: boolean;
    rainfall: boolean;
    weather: boolean;
    reservoir: boolean;
  };

  // Computed Risk
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskFactors: RiskFactorBreakdown;
  evidenceRiskAssessment?: EvidenceBasedRiskAssessment;

  // Station Metadata & Display Aliases
  cwcStationName?: string;
  imdStationName?: string;
  thresholdSource?: string;
  lastUpdated?: string;

  // 7-day Historical telemetry observations
  history: HydrologicalObservation[];
  lastTelemetryUpdate: string;
}

export type AlertType = 
  | 'rapid_surge' 
  | 'threshold_breach' 
  | 'dam_release' 
  | 'heavy_rainfall' 
  | 'compound_risk';

export interface AlertItem {
  id: string;
  stationId: string;
  stationName: string;
  riverName: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  reason: string;
  affectedMeasurement: string;
  recommendation: string;
  timestamp: string;
  type: AlertType;
  metrics?: {
    previousFlow?: number | null;
    currentFlow?: number | null;
    changePercent?: number | null;
    waterLevel?: number | null;
    threshold?: number | null;
    damDischarge?: number | null;
    rainfallMm?: number | null;
  };
}

export interface WhatIfScenario {
  id: string;
  userId?: string;
  stationId: string;
  stationName: string;
  riverName: string;
  flowDeltaPercent: number; // e.g. +30%
  additionalDamDischargeM3s: number; // e.g. +500 m³/s
  additionalRainfallMm: number; // e.g. +40mm
  
  baselineFlow: number;
  projectedFlow: number;
  baselineWaterLevel: number;
  projectedWaterLevel: number;
  baselineRiskScore: number;
  projectedRiskScore: number;
  projectedRiskLevel: RiskLevel;
  riskDelta: number;
  
  aiAnalysis: string;
  createdAt: string;
}

export interface AquaSentinelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  stationId?: string;
  stationContext?: string;
  language?: 'en' | 'hi';
  isHypotheticalAnalysis?: boolean;
  isFallback?: boolean;
  dataClassification?: 'LIVE' | 'SIMULATION' | 'FORECAST';
  groundingSources?: string[];
}

export interface UserSavedStation {
  id: string;
  userId?: string;
  stationId: string;
  stationName: string;
  riverName: string;
  customAlertFlowM3s?: number;
  customAlertStageMeters?: number;
  notes?: string;
  savedAt: string;
}

export interface ObservationLog {
  id: string;
  userId?: string;
  stationId: string;
  stationName: string;
  riverName: string;
  timestamp: string;
  observerName?: string;
  flowObserved?: number;
  waterLevelObserved?: number;
  weatherCondition?: string;
  notes: string;
  riskAssessment: RiskLevel;
}

export type EmergencyUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'TEAM_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
export type EvidenceVerificationStatus = 'CITIZEN_SUBMITTED_PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface EmergencyReport {
  id: string;
  userId?: string;
  userDisplayName?: string;
  isAnonymous?: boolean;
  stationId: string;
  locationName: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number; // In meters
  gpsCapturedAt?: string;
  peopleNeedingAssistance: number;
  hasChildren: boolean;
  hasElderly: boolean;
  hasMobilityIssues: boolean;
  urgency: EmergencyUrgency;
  description: string;
  situationType?: string;
  contactNumber?: string;
  status: IncidentStatus;
  
  // Photo & Video Evidence
  photoUrl?: string; // Compressed Base64 data URL or Storage URL
  photoName?: string;
  photoSizeBytes?: number;
  videoUrl?: string; // Data URL or Storage URL
  videoName?: string;
  videoSizeBytes?: number;
  evidenceStatus?: EvidenceVerificationStatus;

  isResponderVerified: boolean;
  verifiedBy?: string;
  verificationNotes?: string;
  assignedTeam?: string;
  flagCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPeopleReport {
  id: string;
  userId?: string;
  stationId: string;
  locationArea: string;
  reportedCount: number;
  notes?: string;
  createdAt: string;
}

export interface UserAlertPreference {
  userId: string;
  enabled: boolean;
  riverAlerts: boolean;
  heavyRainfallAlerts: boolean;
  damReleaseAlerts: boolean;
  floodRiskAlerts: boolean;
  selectedStationId: string;
  browserNotificationsGranted: boolean;
  updatedAt: string;
}

export interface TestScenario {
  id: string;
  number: number;
  title: string;
  shortName: string;
  description: string;
  targetCity: string;
  targetStationId: string;
  inputs: {
    rainfall_mm: number;
    rainfall_description: string;
    flow_m3s: number;
    previous_flow_m3s: number;
    flow_change_percent: number;
    water_level_m: number;
    previous_water_level_m: number;
    dam_name: string | null;
    dam_release_m3s: number | null;
    previous_dam_release_m3s: number | null;
    dam_gate_status: string | null;
  };
  expectedTriggerBanner?: string;
  expectedRiskLevel: RiskLevel;
}
