import { MonitoringStation, ObservationLog, WhatIfScenario } from '../types';

const SAVED_STATIONS_STORAGE_KEY = 'aquasentinel_saved_stations_v1';
const GUEST_OBS_STORAGE_KEY = 'aquasentinel_guest_obs_v1';
const GUEST_SIMS_STORAGE_KEY = 'aquasentinel_guest_sims_v1';

export function getLocalSavedStationIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_STATIONS_STORAGE_KEY);
    if (!raw) return ['delhi-yamuna', 'cologne-rhine'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ['delhi-yamuna', 'cologne-rhine'];
  } catch {
    return ['delhi-yamuna', 'cologne-rhine'];
  }
}

export function saveLocalSavedStationIds(ids: string[]): void {
  try {
    localStorage.setItem(SAVED_STATIONS_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save stations to local storage:', err);
  }
}

export function getLocalGuestObservations(): ObservationLog[] {
  try {
    const raw = localStorage.getItem(GUEST_OBS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalGuestObservations(obs: ObservationLog[]): void {
  try {
    localStorage.setItem(GUEST_OBS_STORAGE_KEY, JSON.stringify(obs));
  } catch (err) {
    console.error('Failed to save guest observations:', err);
  }
}

export function getLocalGuestSimulations(): WhatIfScenario[] {
  try {
    const raw = localStorage.getItem(GUEST_SIMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalGuestSimulations(sims: WhatIfScenario[]): void {
  try {
    localStorage.setItem(GUEST_SIMS_STORAGE_KEY, JSON.stringify(sims));
  } catch (err) {
    console.error('Failed to save guest simulations:', err);
  }
}

export function exportStationReportMarkdown(station: MonitoringStation): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const dam = station.upstreamDam;
  
  let md = `# AquaSentinel Hydrological Telemetry & Risk Report\n`;
  md += `**Location:** ${station.city} (${station.country}) | **River:** ${station.riverName} (${station.basinName})\n`;
  md += `**Gauge Station:** ${station.gaugeStationName} (Lat: ${station.latitude}, Lon: ${station.longitude})\n`;
  md += `**Report Generated:** ${new Date().toLocaleString()}\n\n`;
  md += `> **NOTICE:** AquaSentinel is an AI-powered hydrological decision-support platform and calculated risk indicator. It is NOT an official government flood or evacuation warning.\n\n`;
  md += `---\n\n`;
  md += `## 1. Real Measured Telemetry\n\n`;
  md += `- **Current Volumetric Discharge / Flow:** ${station.currentFlow?.toLocaleString()} m³/s\n`;
  md += `- **Previous Measurement Flow:** ${station.previousFlow?.toLocaleString()} m³/s\n`;
  md += `- **Flow Surge Rate:** ${station.flowChangePercent > 0 ? '+' : ''}${station.flowChangePercent.toFixed(1)}% ${station.isRapidIncrease ? '(⚠️ RAPID INCREASE DETECTED)' : ''}\n`;
  md += `- **Current River Stage / Water Level:** ${station.currentWaterLevel.toFixed(2)} m\n`;
  md += `- **Normal Stage:** ${station.normalStage.toFixed(2)} m\n`;
  md += `- **Alert Monitoring Stage:** ${station.alertStage.toFixed(2)} m\n`;
  md += `- **Warning Stage:** ${station.warningStage.toFixed(2)} m\n`;
  md += `- **Critical Flood Stage:** ${station.criticalStage.toFixed(2)} m\n`;
  md += `- **Bankfull Level:** ${station.bankfullLevel.toFixed(2)} m\n`;
  md += `- **24h Catchment Rainfall:** ${station.rainfall24h !== null ? `${station.rainfall24h} mm` : 'Data unavailable'}\n\n`;
  
  md += `## 2. Upstream Water Control & Dam Telemetry\n\n`;
  if (dam) {
    md += `- **Dam / Barrage Name:** ${dam.name} (${dam.distanceUpstreamKm} km upstream)\n`;
    md += `- **Data Availability:** ${dam.isAvailable ? 'ACTIVE TELEMETRY' : 'DATA UNAVAILABLE / SENSOR OFFLINE'}\n`;
    md += `- **Discharge / Outflow:** ${dam.dischargeM3s !== null ? `${dam.dischargeM3s.toLocaleString()} m³/s` : 'Data unavailable'}\n`;
    md += `- **Reservoir Level:** ${dam.reservoirLevelPercent !== null ? `${dam.reservoirLevelPercent}% (${dam.reservoirElevationMeters} m a.s.l.)` : 'Data unavailable'}\n`;
    md += `- **Gate Status:** ${dam.gateStatus || 'Data unavailable'}\n`;
    md += `- **Estimated Travel Time to Station:** ~${dam.travelTimeToStationHours} hours\n\n`;
  }

  md += `## 3. Calculated Risk Indicators\n\n`;
  md += `- **Flood Risk Index:** ${station.riskScore}/100\n`;
  md += `- **Risk Level Category:** **${station.riskLevel}**\n`;
  md += `- **Dominant Driver:** ${station.riskFactors.dominantDriver}\n`;
  md += `- **Stage Factor:** ${station.riskFactors.waterLevelFactor}/100\n`;
  md += `- **Discharge Factor:** ${station.riskFactors.flowFactor}/100\n`;
  md += `- **Surge Rate Factor:** ${station.riskFactors.surgeRateFactor}/100\n`;
  md += `- **Dam Factor:** ${station.riskFactors.damFactor}/100\n`;
  md += `- **Precipitation Factor:** ${station.riskFactors.rainfallFactor}/100\n\n`;

  md += `## 4. Telemetry Time-Series (Last 24 Hours)\n\n`;
  md += `| Time | Flow (m³/s) | Water Level (m) | Dam Release (m³/s) |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  (station.history || []).forEach(h => {
    const timeFormatted = h.displayTime || (h.timestamp.includes('T') ? h.timestamp.split('T')[1]?.slice(0, 5) : h.timestamp);
    md += `| ${timeFormatted} | ${h.river_flow_m3s?.toLocaleString() ?? 'N/A'} | ${h.water_level_m?.toFixed(2) ?? 'N/A'} | ${h.dam_release_m3s !== null && h.dam_release_m3s !== undefined ? h.dam_release_m3s.toLocaleString() : 'N/A'} |\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aquasentinel-report-${station.city.toLowerCase()}-${dateStr}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportStationReportJSON(station: MonitoringStation): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const payload = {
    exportedAt: new Date().toISOString(),
    system: 'AquaSentinel AI River, Dam & Flood Risk Monitoring Platform',
    disclaimer: 'Calculated decision-support risk indicator, not an official government evacuation warning.',
    station
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aquasentinel-telemetry-${station.city.toLowerCase()}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
