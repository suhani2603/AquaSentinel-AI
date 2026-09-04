import { 
  MonitoringStation, 
  RiskLevel, 
  RiskFactorBreakdown, 
  AlertItem, 
  WhatIfScenario,
  EvidenceBasedRiskAssessment 
} from '../types';
import { compareWithHistoricalRainfallBaseline } from '../data/historicalDehradunData';

/**
 * Evidence-Based Flood Risk Assessment for Dehradun Hydrology
 * 
 * CORE PRINCIPLE: REAL DATA > HISTORICAL EVIDENCE > OFFICIAL WARNINGS > AI INTERPRETATION
 * - No arbitrary percentages (e.g. Rain 40% + River 30% + Forecast 30% is banned)
 * - Strict 5-tier status: NORMAL, WATCH, WARNING, DANGER, INSUFFICIENT_DATA
 * - Independent evaluation of Rainfall Condition & River Condition
 * - Prioritizes official IMD / CWC / DDMA bulletins
 */
export function evaluateEvidenceBasedRisk(station: Partial<MonitoringStation> & { rescueReportsCount?: number }): EvidenceBasedRiskAssessment {
  const currentWaterLevel = station.currentWaterLevel ?? null;
  const previousWaterLevel = station.previousWaterLevel ?? null;
  const warningStage = station.warningStage ?? 3.20;
  const criticalStage = station.criticalStage ?? 4.50;
  const normalStage = station.normalStage ?? 1.20;
  const rainfall24h = station.rainfall24h ?? null;
  const rainfallIntensity = station.rainfallIntensityMmHr ?? null;
  const officialWarnings = station.officialWarnings || [];
  const activeRescueReportsCount = station.rescueReportsCount ?? 0;

  const triggers: string[] = [];

  // 1. Evaluate Rainfall Condition (against 10+ year Dehradun baseline)
  let rainfallCondition: EvidenceBasedRiskAssessment['rainfallCondition'] = 'DATA_UNAVAILABLE';
  const histRain = compareWithHistoricalRainfallBaseline(rainfall24h);

  if (rainfall24h === null || rainfall24h === undefined || isNaN(rainfall24h)) {
    rainfallCondition = 'DATA_UNAVAILABLE';
  } else if (rainfall24h >= 115.6 || (rainfallIntensity !== null && rainfallIntensity >= 30)) {
    rainfallCondition = 'EXTREME';
    triggers.push(`24-hour rainfall (${rainfall24h.toFixed(1)} mm) meets extreme flood / cloudburst criteria (>115.5 mm)`);
  } else if (rainfall24h >= 64.5 || (rainfallIntensity !== null && rainfallIntensity >= 15)) {
    rainfallCondition = 'HISTORICALLY_UNUSUAL';
    triggers.push(`24-hour rainfall (${rainfall24h.toFixed(1)} mm) meets official IMD Heavy Rain baseline (64.5–115.5 mm)`);
  } else if (rainfall24h >= 35.0) {
    rainfallCondition = 'ELEVATED';
    triggers.push(`24-hour rainfall (${rainfall24h.toFixed(1)} mm) is elevated above seasonal baseflow (35–64 mm)`);
  } else {
    rainfallCondition = 'NORMAL';
  }

  // 2. Evaluate River Condition (Against surveyed foothill thresholds)
  let riverCondition: EvidenceBasedRiskAssessment['riverCondition'] = 'DATA_UNAVAILABLE';
  let waterDiff = 0;
  if (currentWaterLevel !== null && previousWaterLevel !== null) {
    waterDiff = Number((currentWaterLevel - previousWaterLevel).toFixed(2));
  }

  if (currentWaterLevel === null || currentWaterLevel === undefined || isNaN(currentWaterLevel)) {
    riverCondition = 'DATA_UNAVAILABLE';
  } else if (currentWaterLevel >= criticalStage) {
    riverCondition = 'DANGER_THRESHOLD_BREACHED';
    triggers.push(`River stage (${currentWaterLevel.toFixed(2)} m) has breached official Danger Stage (${criticalStage.toFixed(2)} m)`);
  } else if (currentWaterLevel >= warningStage || (currentWaterLevel >= warningStage - 0.25 && waterDiff > 0.05)) {
    riverCondition = 'APPROACHING_WARNING';
    triggers.push(`River stage (${currentWaterLevel.toFixed(2)} m) is at or approaching Warning Mark (${warningStage.toFixed(2)} m)`);
  } else if (waterDiff > 0.08 || currentWaterLevel > normalStage + 0.5) {
    riverCondition = 'RISING';
    triggers.push(`River stage is actively rising (+${waterDiff.toFixed(2)} m in 3h) from steep mountain runoff`);
  } else {
    riverCondition = 'STABLE';
  }

  // 3. Official Warnings Check (IMD / CWC / USDMA / DDMA)
  const officialWarningActive = officialWarnings.length > 0;
  let officialWarningSummary: string | null = null;
  let hasCriticalWarning = false;
  let hasHighWarning = false;

  if (officialWarningActive) {
    const topWarning = officialWarnings[0];
    officialWarningSummary = `${topWarning.issuingAuthority.split('(')[0].trim()}: ${topWarning.title}`;
    if (topWarning.severity === 'CRITICAL') {
      hasCriticalWarning = true;
      triggers.push(`Active official emergency alert: "${topWarning.title}"`);
    } else if (topWarning.severity === 'WARNING') {
      hasHighWarning = true;
      triggers.push(`Active official weather/flood warning: "${topWarning.title}"`);
    }
  }

  // 4. Ground-Level Rescue Reports (Supporting evidence)
  if (activeRescueReportsCount > 0) {
    triggers.push(`${activeRescueReportsCount} community rescue / distress call(s) logged in river corridor`);
  }

  // 5. Compute Evidence-Based Risk Level (Deterministic Hierarchy)
  let riskLevel: RiskLevel = 'NORMAL';
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  let confidenceReason = 'Direct verified IMD telemetry and river stage observations available.';

  // Scenario A: Both primary telemetry streams are missing -> INSUFFICIENT_DATA
  if (rainfallCondition === 'DATA_UNAVAILABLE' && riverCondition === 'DATA_UNAVAILABLE') {
    riskLevel = 'INSUFFICIENT_DATA';
    confidence = 'LOW';
    confidenceReason = 'Both rainfall and river telemetry are currently missing. AquaSentinel does not invent risk when data is absent.';
    triggers.push('No verified rainfall or river telemetry available for this station');
  } else if (rainfallCondition === 'DATA_UNAVAILABLE' || riverCondition === 'DATA_UNAVAILABLE') {
    confidence = 'MEDIUM';
    confidenceReason = rainfallCondition === 'DATA_UNAVAILABLE'
      ? 'Rainfall observation gauge offline; relying primarily on river stage and official bulletins.'
      : 'River stage gauge offline; relying on verified IMD rainfall telemetry and official bulletins.';
  }

  if (riskLevel !== 'INSUFFICIENT_DATA') {
    // DANGER condition:
    // 1. River breached danger stage OR
    // 2. Extreme rainfall (>115.6mm) + rising river OR
    // 3. Critical official emergency alert active with rising/elevated water
    if (
      riverCondition === 'DANGER_THRESHOLD_BREACHED' ||
      (rainfallCondition === 'EXTREME' && (riverCondition === 'APPROACHING_WARNING' || riverCondition === 'RISING')) ||
      (hasCriticalWarning && (riverCondition === 'APPROACHING_WARNING' || rainfallCondition === 'HISTORICALLY_UNUSUAL'))
    ) {
      riskLevel = 'DANGER';
    }
    // WARNING condition:
    // 1. River approaching or breaching warning stage OR
    // 2. Active official IMD/CWC warning OR
    // 3. Historically unusual rainfall (IMD Heavy Rain >64.5mm) with rising trend OR
    // 4. Extreme rainfall even if river has not yet risen (due to short 30-min lag time)
    else if (
      riverCondition === 'APPROACHING_WARNING' ||
      hasHighWarning ||
      hasCriticalWarning ||
      rainfallCondition === 'EXTREME' ||
      (rainfallCondition === 'HISTORICALLY_UNUSUAL' && riverCondition === 'RISING')
    ) {
      riskLevel = 'WARNING';
    }
    // WATCH condition:
    // 1. Elevated rainfall (35-64mm) OR
    // 2. Rising river trend OR
    // 3. Verified citizen rescue reports logged in corridor
    else if (
      rainfallCondition === 'HISTORICALLY_UNUSUAL' ||
      rainfallCondition === 'ELEVATED' ||
      riverCondition === 'RISING' ||
      activeRescueReportsCount > 0
    ) {
      riskLevel = 'WATCH';
    }
    // NORMAL condition:
    else {
      riskLevel = 'NORMAL';
    }
  }

  // 6. Threshold Comparison string
  let officialThresholdComparison = '';
  if (currentWaterLevel !== null) {
    if (currentWaterLevel >= criticalStage) {
      officialThresholdComparison = `+${(currentWaterLevel - criticalStage).toFixed(2)} m ABOVE Danger Mark (${criticalStage.toFixed(2)} m)`;
    } else if (currentWaterLevel >= warningStage) {
      officialThresholdComparison = `+${(currentWaterLevel - warningStage).toFixed(2)} m ABOVE Warning Stage (${warningStage.toFixed(2)} m)`;
    } else {
      officialThresholdComparison = `${(warningStage - currentWaterLevel).toFixed(2)} m below Warning Stage (${warningStage.toFixed(2)} m)`;
    }
  } else {
    officialThresholdComparison = 'Stage comparison unavailable (sensor offline)';
  }

  // 7. Plain Language Summary & Action Recommendation
  let plainLanguageSummary = '';
  let actionRecommendation = '';

  switch (riskLevel) {
    case 'DANGER':
      plainLanguageSummary = `Severe flood conditions verified on ${station.riverName || 'Dehradun River'}. River stage or extreme mountain runoff has breached safe limits.`;
      actionRecommendation = `Evacuate low-lying riparian settlements immediately. Do not attempt to cross submerged bridges, culverts, or causeways. Follow District Magistrate & SDRF instructions.`;
      break;
    case 'WARNING':
      plainLanguageSummary = `Verified hydrological indicators or official government warnings indicate significant flood risk across the ${station.riverName || 'Dehradun'} corridor.`;
      actionRecommendation = `Avoid riverbeds and low-lying banks in Song, Rispana, and Bindal. Keep emergency kits accessible and stay tuned to official DDMA bulletins.`;
      break;
    case 'WATCH':
      plainLanguageSummary = `Conditions are moderately elevated above seasonal baselines. Water is rising or rainfall runoff is active.`;
      actionRecommendation = `Monitor weather and river trends closely. Ensure local culverts and drains are unobstructed.`;
      break;
    case 'INSUFFICIENT_DATA':
      plainLanguageSummary = `Insufficient telemetry to responsibly compute flood risk. Showing latest verified historical reference.`;
      actionRecommendation = `Consult direct IMD Dehradun bulletin (mausam.imd.gov.in) and State Disaster Management (USDMA) for authoritative status.`;
      break;
    case 'NORMAL':
    default:
      plainLanguageSummary = `No verified indication of unusual or hazardous conditions. Monitored parameters are within historical seasonal ranges.`;
      actionRecommendation = `Normal seasonal activities may continue. Follow routine monsoon weather advisories.`;
      break;
  }

  return {
    riskLevel,
    riskScoreLabel: riskLevel === 'DANGER' ? 'DANGER' : riskLevel,
    rainfallCondition,
    riverCondition,
    primaryTriggers: triggers.length > 0 ? triggers : ['All parameters within normal baseline range'],
    historicalComparison: histRain.historicalContextEn,
    dataConfidence: confidence,
    confidenceReason,
    officialThresholdComparison,
    officialWarningActive,
    officialWarningSummary,
    verifiedRescueIncidentsCount: activeRescueReportsCount,
    plainLanguageSummary,
    actionRecommendation
  };
}

/**
 * Transparent Rule-Based Flood Risk Engine
 * Computes evidence-based risk assessment from physical telemetry and official baselines.
 * Gemini does NOT invent this score; deterministic evidence rules determine it.
 */
export function calculateRiskScore(station: Partial<MonitoringStation>): {
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactorBreakdown;
  explanation: string;
} {
  const assessment = evaluateEvidenceBasedRisk(station);

  // Map categorical risk level to a representative indicator value (0, 35, 70, 95)
  // for any components requiring numeric scale compatibility, while UI displays textual status.
  const riskScoreMap: Record<RiskLevel, number> = {
    NORMAL: 15,
    WATCH: 40,
    WARNING: 72,
    DANGER: 95,
    CRITICAL: 95,
    INSUFFICIENT_DATA: 0
  };

  const riskScore = riskScoreMap[assessment.riskLevel] ?? 15;

  const currentFlow = station.currentFlow || 0;
  const designPeakFlow = station.designPeakFlow || 850;
  const flowRatio = Math.min(Math.max((currentFlow / designPeakFlow) * 100, 0), 100);

  const riskFactors: RiskFactorBreakdown = {
    flowFactor: Math.round(flowRatio),
    surgeRateFactor: station.flowChangePercent ? Math.round(Math.min(station.flowChangePercent, 100)) : 0,
    waterLevelFactor: assessment.riverCondition === 'DANGER_THRESHOLD_BREACHED' ? 95 : assessment.riverCondition === 'APPROACHING_WARNING' ? 75 : assessment.riverCondition === 'RISING' ? 45 : 15,
    rainfallFactor: assessment.rainfallCondition === 'EXTREME' ? 95 : assessment.rainfallCondition === 'HISTORICALLY_UNUSUAL' ? 75 : assessment.rainfallCondition === 'ELEVATED' ? 45 : 10,
    damFactor: 0,
    dominantDriver: assessment.primaryTriggers[0] || 'Seasonal Baseflow'
  };

  return {
    riskScore,
    riskLevel: assessment.riskLevel,
    riskFactors,
    explanation: assessment.plainLanguageSummary
  };
}

/**
 * Generates structured hydrological alerts from station telemetry.
 */
export function generateStationAlerts(station: MonitoringStation): AlertItem[] {
  const alerts: AlertItem[] = [];
  const time = station.lastTelemetryUpdate || new Date().toISOString();
  const stationLocation = `${station.city} (${station.riverName})`;

  // 1. Rapid Surge Alert
  if (station.isRapidIncrease || station.flowChangePercent >= 25) {
    alerts.push({
      id: `alert-surge-${station.id}`,
      stationId: station.id,
      stationName: station.city,
      riverName: station.riverName,
      severity: station.flowChangePercent >= 60 ? 'critical' : 'warning',
      title: 'RAPID FLOW INCREASE DETECTED',
      reason: `River flow increased abruptly from ${formatNumber(station.previousFlow)} m³/s to ${formatNumber(station.currentFlow)} m³/s (+${station.flowChangePercent.toFixed(1)}%).`,
      affectedMeasurement: `Discharge: ${formatNumber(station.currentFlow)} m³/s (Δ +${station.flowChangePercent.toFixed(1)}%)`,
      recommendation: 'Verify conditions with official local hydrological and emergency authorities.',
      timestamp: time,
      type: 'rapid_surge',
      metrics: {
        previousFlow: station.previousFlow,
        currentFlow: station.currentFlow,
        changePercent: station.flowChangePercent
      }
    });
  }

  // 2. Stage Threshold Breach
  if (station.currentWaterLevel >= station.criticalStage) {
    alerts.push({
      id: `alert-critical-stage-${station.id}`,
      stationId: station.id,
      stationName: station.city,
      riverName: station.riverName,
      severity: 'critical',
      title: 'CRITICAL DANGER THRESHOLD EXCEEDED',
      reason: `Current water level (${station.currentWaterLevel.toFixed(2)}m) has surpassed the Critical Danger Stage (${station.criticalStage.toFixed(2)}m) by ${(station.currentWaterLevel - station.criticalStage).toFixed(2)}m.`,
      affectedMeasurement: `Water Level: ${station.currentWaterLevel.toFixed(2)}m (Danger Mark: ${station.criticalStage.toFixed(2)}m)`,
      recommendation: 'Verify conditions with official local hydrological and emergency authorities.',
      timestamp: time,
      type: 'threshold_breach',
      metrics: {
        waterLevel: station.currentWaterLevel,
        threshold: station.criticalStage
      }
    });
  } else if (station.currentWaterLevel >= station.warningStage) {
    alerts.push({
      id: `alert-warning-stage-${station.id}`,
      stationId: station.id,
      stationName: station.city,
      riverName: station.riverName,
      severity: 'warning',
      title: 'WARNING STAGE BREACHED',
      reason: `River level is at ${station.currentWaterLevel.toFixed(2)}m, breaching the designated Warning Threshold (${station.warningStage.toFixed(2)}m).`,
      affectedMeasurement: `Water Level: ${station.currentWaterLevel.toFixed(2)}m (Warning: ${station.warningStage.toFixed(2)}m)`,
      recommendation: 'Verify conditions with official local hydrological and emergency authorities.',
      timestamp: time,
      type: 'threshold_breach',
      metrics: {
        waterLevel: station.currentWaterLevel,
        threshold: station.warningStage
      }
    });
  }

  // 3. Upstream Dam Release Alert
  if (
    station.upstreamDam &&
    station.upstreamDam.isAvailable &&
    station.upstreamDam.dischargeM3s !== null &&
    (station.upstreamDam.safetyStatus === 'HIGH_SPILLWAY_RELEASE' ||
      (station.upstreamDam.previousDischargeM3s &&
        station.upstreamDam.dischargeM3s >= station.upstreamDam.previousDischargeM3s * 1.4))
  ) {
    const isSimulated = station.upstreamDam.gateStatus?.toLowerCase().includes('simulated') || true;
    const titleText = isSimulated ? 'SIMULATED DAM RELEASE INCREASE' : 'UPSTREAM DAM SPILLWAY RELEASE INCREASE';
    
    alerts.push({
      id: `alert-dam-${station.id}`,
      stationId: station.id,
      stationName: station.city,
      riverName: station.riverName,
      severity: station.upstreamDam.safetyStatus === 'HIGH_SPILLWAY_RELEASE' ? 'critical' : 'warning',
      title: titleText,
      reason: `Upstream dam/barrage (${station.upstreamDam.name}) release increased to ${formatNumber(station.upstreamDam.dischargeM3s)} m³/s (previous: ${formatNumber(station.upstreamDam.previousDischargeM3s)} m³/s).`,
      affectedMeasurement: `Dam Outflow: ${formatNumber(station.upstreamDam.dischargeM3s)} m³/s`,
      recommendation: 'Verify conditions with official local hydrological and emergency authorities.',
      timestamp: time,
      type: 'dam_release',
      metrics: {
        damDischarge: station.upstreamDam.dischargeM3s
      }
    });
  }

  // 4. Catchment Rainfall Alert
  if (station.rainfall24h !== null && station.rainfall24h >= 50) {
    alerts.push({
      id: `alert-rainfall-${station.id}`,
      stationId: station.id,
      stationName: station.city,
      riverName: station.riverName,
      severity: station.rainfall24h >= 80 ? 'critical' : 'warning',
      title: 'HEAVY CATCHMENT PRECIPITATION',
      reason: `24-hour cumulative rainfall reached ${station.rainfall24h.toFixed(1)} mm, accelerating surface runoff and tributary inflows.`,
      affectedMeasurement: `Rainfall (24h): ${station.rainfall24h.toFixed(1)} mm`,
      recommendation: 'Verify conditions with official local hydrological and emergency authorities.',
      timestamp: time,
      type: 'heavy_rainfall',
      metrics: {
        rainfallMm: station.rainfall24h
      }
    });
  }

  return alerts;
}

/**
 * Computes a hypothetical "What-If" scenario simulation.
 */
export function simulateWhatIfScenario(
  station: MonitoringStation,
  flowDeltaPercent: number,
  additionalDamDischargeM3s: number,
  additionalRainfallMm: number
): WhatIfScenario {
  const baselineFlow = station.currentFlow || 200;
  const flowFromPercentage = baselineFlow * (1 + flowDeltaPercent / 100);
  const flowFromDam = additionalDamDischargeM3s * 0.85;
  const flowFromRainfall = (additionalRainfallMm / 25) * (baselineFlow * 0.15);
  
  const projectedFlow = Math.round(flowFromPercentage + flowFromDam + flowFromRainfall);
  
  // Rating Curve Approximation: Stage ~ Base + k * (Q/Q0)^0.55 - 1
  const flowRatio = projectedFlow / Math.max(baselineFlow, 50);
  const baselineStage = station.currentWaterLevel;
  const estimatedStageRise = (Math.pow(flowRatio, 0.55) - 1) * 1.6;
  const projectedWaterLevel = Number((baselineStage + Math.max(estimatedStageRise, -0.8)).toFixed(2));

  // Compute simulated risk
  const simulatedStation: Partial<MonitoringStation> = {
    ...station,
    currentFlow: projectedFlow,
    flowChangePercent: Math.max(flowDeltaPercent, ((projectedFlow - baselineFlow) / baselineFlow) * 100),
    currentWaterLevel: projectedWaterLevel,
    rainfall24h: (station.rainfall24h || 0) + additionalRainfallMm,
    upstreamDam: {
      ...station.upstreamDam,
      dischargeM3s: (station.upstreamDam?.dischargeM3s || 0) + additionalDamDischargeM3s
    }
  };

  const { riskScore: projectedRiskScore, riskLevel: projectedRiskLevel } = calculateRiskScore(simulatedStation);
  const riskDelta = projectedRiskScore - station.riskScore;

  let scenarioSummary = `Hypothetical simulation indicates that a ${flowDeltaPercent >= 0 ? '+' : ''}${flowDeltaPercent}% flow change`;
  if (additionalDamDischargeM3s > 0) {
    scenarioSummary += `, +${additionalDamDischargeM3s} m³/s dam release`;
  }
  if (additionalRainfallMm > 0) {
    scenarioSummary += `, and +${additionalRainfallMm}mm rainfall`;
  }
  scenarioSummary += ` would result in projected river discharge of ~${formatNumber(projectedFlow)} m³/s and stage elevation of ${projectedWaterLevel.toFixed(2)}m (Risk Score: ${projectedRiskScore}/100, ${projectedRiskLevel}).`;

  return {
    id: `sim-${Date.now()}`,
    stationId: station.id,
    stationName: station.city,
    riverName: station.riverName,
    flowDeltaPercent,
    additionalDamDischargeM3s,
    additionalRainfallMm,
    baselineFlow,
    projectedFlow,
    baselineWaterLevel: station.currentWaterLevel,
    projectedWaterLevel,
    baselineRiskScore: station.riskScore,
    projectedRiskScore,
    projectedRiskLevel,
    riskDelta,
    aiAnalysis: scenarioSummary,
    createdAt: new Date().toISOString()
  };
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'Data unavailable';
  return num.toLocaleString('en-US');
}

export function formatStage(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'Data unavailable';
  return `${num.toFixed(2)} m`;
}

export function formatRainfall(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'Data unavailable';
  return `${num.toFixed(1)} mm`;
}

export function getRiskBadgeClasses(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  glow: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-rose-500/10 text-rose-400',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-500',
        glow: 'shadow-rose-500/20'
      };
    case 'WARNING':
      return {
        bg: 'bg-amber-500/10 text-amber-400',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
        glow: 'shadow-amber-500/20'
      };
    case 'WATCH':
      return {
        bg: 'bg-sky-500/10 text-sky-400',
        text: 'text-sky-400',
        border: 'border-sky-500/30',
        dot: 'bg-sky-500',
        glow: 'shadow-sky-500/20'
      };
    case 'NORMAL':
    default:
      return {
        bg: 'bg-emerald-500/10 text-emerald-400',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
        glow: 'shadow-emerald-500/20'
      };
  }
}

/**
 * Translates technical river telemetry into friendly plain language.
 */
export function getRiverPlainLanguageStatus(station: MonitoringStation): {
  headline: string;
  description: string;
  trend: 'rising_fast' | 'rising' | 'stable' | 'falling' | 'critical';
  trendLabel: string;
} {
  const isCritical = station.currentWaterLevel >= station.criticalStage;
  const isWarning = station.currentWaterLevel >= station.warningStage;
  const change = station.flowChangePercent;

  if (isCritical) {
    return {
      headline: '🚨 Danger mark breached',
      description: `River water level has exceeded the critical flood threshold by ${(station.currentWaterLevel - station.criticalStage).toFixed(2)} meters.`,
      trend: 'critical',
      trendLabel: 'Critical Flood Level'
    };
  }

  if (station.isRapidIncrease || change >= 25) {
    return {
      headline: '🌊 River is rising rapidly',
      description: `Discharge has jumped by ${change > 0 ? '+' : ''}${change.toFixed(1)}% compared to the previous reading.`,
      trend: 'rising_fast',
      trendLabel: `Surging (+${change.toFixed(1)}%)`
    };
  }

  if (isWarning) {
    return {
      headline: '⚠️ Water level is at warning stage',
      description: `River is currently elevated and within ${(station.criticalStage - station.currentWaterLevel).toFixed(2)}m of the danger mark.`,
      trend: 'rising',
      trendLabel: 'Elevated Warning Stage'
    };
  }

  if (change > 8) {
    return {
      headline: '📈 River is rising steadily',
      description: `Flow volume has increased by ${change.toFixed(1)}% over the recent observation window.`,
      trend: 'rising',
      trendLabel: `Rising (+${change.toFixed(1)}%)`
    };
  }

  if (change < -8) {
    return {
      headline: '📉 River is receding',
      description: `Flow has dropped by ${Math.abs(change).toFixed(1)}% as floodwaters drain downstream safely.`,
      trend: 'falling',
      trendLabel: `Receding (${change.toFixed(1)}%)`
    };
  }

  return {
    headline: '💧 River flow is calm and stable',
    description: `Water elevation and volume are safely within normal seasonal channel capacity.`,
    trend: 'stable',
    trendLabel: 'Stable Nominal Flow'
  };
}

/**
 * Translates technical dam status into plain language.
 */
export function getDamPlainLanguageStatus(station: MonitoringStation): {
  headline: string;
  description: string;
  status: 'normal' | 'caution' | 'high_release' | 'no_dam';
} {
  const dam = station.upstreamDam;

  if (!dam || !dam.isAvailable || dam.dischargeM3s === null) {
    return {
      headline: 'ℹ️ Catchment runoff driven',
      description: `No direct upstream storage dam for ${station.city}; flood risk is primarily governed by regional rainfall.`,
      status: 'no_dam'
    };
  }

  if (dam.safetyStatus === 'HIGH_SPILLWAY_RELEASE') {
    return {
      headline: '🚨 Heavy spillway release active',
      description: `${dam.name} is releasing high water volumes (~${formatNumber(dam.dischargeM3s)} m³/s), expected at ${station.city} in ~${dam.travelTimeToStationHours || 6} hours.`,
      status: 'high_release'
    };
  }

  if (dam.previousDischargeM3s && dam.dischargeM3s >= dam.previousDischargeM3s * 1.3) {
    return {
      headline: '⚠️ Upstream release increasing',
      description: `Discharge from ${dam.name} has risen from ${formatNumber(dam.previousDischargeM3s)} to ${formatNumber(dam.dischargeM3s)} m³/s.`,
      status: 'caution'
    };
  }

  return {
    headline: '💧 Normal controlled release',
    description: `${dam.name} is operating at standard release rates (~${formatNumber(dam.dischargeM3s)} m³/s) with no sudden surges.`,
    status: 'normal'
  };
}

/**
 * Translates rainfall telemetry into plain language.
 */
export function getRainfallPlainLanguageStatus(station: MonitoringStation): {
  headline: string;
  description: string;
  status: 'dry' | 'moderate' | 'heavy' | 'extreme';
} {
  const rain = station.rainfall24h;

  if (rain === null || rain === undefined || rain < 2) {
    return {
      headline: '☀️ Dry conditions',
      description: 'Little to no precipitation recorded in the catchment basin over the past 24 hours.',
      status: 'dry'
    };
  }

  if (rain >= 80) {
    return {
      headline: '⛈️ Extreme downpour',
      description: `Intense precipitation (${rain.toFixed(1)} mm) is generating fast surface runoff into the ${station.riverName}.`,
      status: 'extreme'
    };
  }

  if (rain >= 40) {
    return {
      headline: '🌧️ Heavy rainfall in catchment',
      description: `Substantial rain (${rain.toFixed(1)} mm) is feeding tributary streams into the main river channel.`,
      status: 'heavy'
    };
  }

  return {
    headline: '🌦️ Moderate showers',
    description: `Catchment received ${rain.toFixed(1)} mm of rainfall, being absorbed normally by soils and channels.`,
    status: 'moderate'
  };
}

/**
 * Generates an overall plain-language situation summary.
 */
export function getOverallSituationSummary(station: MonitoringStation): string {
  const river = getRiverPlainLanguageStatus(station);
  const dam = getDamPlainLanguageStatus(station);
  const rain = getRainfallPlainLanguageStatus(station);

  if (station.riskLevel === 'CRITICAL') {
    return `In ${station.city}, the ${station.riverName} is at a critical flood level. ${river.description} ${dam.status === 'high_release' ? dam.description : ''} Immediate precautionary measures are advised.`;
  }

  if (station.riskLevel === 'WARNING') {
    return `In ${station.city}, the ${station.riverName} is on elevated warning status. ${river.description} ${rain.status === 'heavy' || rain.status === 'extreme' ? rain.description : 'Catchment runoff is adding pressure to the river stage.'}`;
  }

  if (station.riskLevel === 'WATCH') {
    return `In ${station.city}, river conditions are on watch status. ${river.description} Current telemetry shows manageable flow with no immediate overflow expected.`;
  }

  return `In ${station.city}, the ${station.riverName} is currently operating under normal, stable conditions. Water level is well within safe bank limits and upstream releases remain controlled.`;
}

