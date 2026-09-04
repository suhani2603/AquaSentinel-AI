import { MonitoringStation, HydrologicalObservation } from '../types';

/**
 * Formats an ISO observation timestamp to a readable date/time string.
 */
export function formatObservationTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
}

/**
 * Retrieves and persists actual measured river-level observations for a station
 * during the past 7 days from the connected telemetry source.
 * Ensures strict station data isolation to prevent cross-station contamination.
 */
export function getStationRiverObservations(station: MonitoringStation): HydrologicalObservation[] {
  if (!station || !station.id) return [];

  const storageKey = `aquasentinel_live_obs_${station.id}`;
  let localObs: HydrologicalObservation[] = [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localObs = parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading observation history from localStorage:', e);
  }

  // Combined observations keyed by rounded minute timestamp
  const combinedMap = new Map<string, HydrologicalObservation>();

  const addObs = (obs: HydrologicalObservation) => {
    if (!obs || !obs.timestamp || obs.water_level_m === null || obs.water_level_m === undefined) return;
    
    // Strict isolation: verify observation matches station city/river
    if (obs.city && station.city) {
      const obsCity = obs.city.toLowerCase().trim();
      const stationCity = station.city.toLowerCase().trim();
      if (!obsCity.includes(stationCity) && !stationCity.includes(obsCity)) {
        return;
      }
    }

    const d = new Date(obs.timestamp);
    if (isNaN(d.getTime())) return;

    // Deduplicate by 10-minute time window
    const roundedMinutes = Math.floor(d.getMinutes() / 10) * 10;
    const windowDate = new Date(d);
    windowDate.setMinutes(roundedMinutes, 0, 0);
    const key = windowDate.toISOString();

    if (!combinedMap.has(key)) {
      combinedMap.set(key, {
        ...obs,
        displayTime: obs.displayTime || formatObservationTime(obs.timestamp)
      });
    }
  };

  // 1. Process observations from station.history (if provided by server/live service)
  if (Array.isArray(station.history)) {
    station.history.forEach(addObs);
  }

  // 2. Process stored local observations
  localObs.forEach(addObs);

  // 3. Include previous measurement cycle if available from the connected station
  if (
    station.previousWaterLevel !== null && 
    station.previousWaterLevel !== undefined &&
    station.lastTelemetryUpdate
  ) {
    const lastUpdateMs = new Date(station.lastTelemetryUpdate).getTime();
    if (!isNaN(lastUpdateMs)) {
      const prevTime = new Date(lastUpdateMs - 3 * 3600 * 1000).toISOString();
      addObs({
        timestamp: prevTime,
        displayTime: formatObservationTime(prevTime),
        city: station.city,
        river: station.riverName,
        monitoring_station: station.gaugeStationName,
        water_level_m: Number(station.previousWaterLevel.toFixed(2)),
        river_flow_m3s: station.previousFlow ?? null,
        rainfall_mm: null,
        dam_name: station.upstreamDam?.name || null,
        dam_release_m3s: station.upstreamDam?.previousDischargeM3s || null,
        reservoir_level_m: null,
        warning_threshold: station.thresholdType === 'OFFICIAL_CWC' ? station.warningStage : null,
        danger_threshold: station.thresholdType === 'OFFICIAL_CWC' ? station.criticalStage : null
      });
    }
  }

  // 4. Include current live measurement point from the connected station
  if (
    station.currentWaterLevel !== null && 
    station.currentWaterLevel !== undefined &&
    station.lastTelemetryUpdate
  ) {
    const curTime = station.lastTelemetryUpdate;
    addObs({
      timestamp: curTime,
      displayTime: formatObservationTime(curTime),
      city: station.city,
      river: station.riverName,
      monitoring_station: station.gaugeStationName,
      water_level_m: Number(station.currentWaterLevel.toFixed(2)),
      river_flow_m3s: station.currentFlow ?? null,
      rainfall_mm: station.rainfall24h ?? null,
      dam_name: station.upstreamDam?.name || null,
      dam_release_m3s: station.upstreamDam?.dischargeM3s || null,
      reservoir_level_m: null,
      warning_threshold: station.thresholdType === 'OFFICIAL_CWC' ? station.warningStage : null,
      danger_threshold: station.thresholdType === 'OFFICIAL_CWC' ? station.criticalStage : null
    });
  }

  // 5. Restrict strictly to the past 7 days relative to the latest observation or now
  const allObs = Array.from(combinedMap.values());
  if (allObs.length === 0) return [];

  const timestamps = allObs
    .map((o) => new Date(o.timestamp).getTime())
    .filter((t) => !isNaN(t));

  const anchorMs = timestamps.length > 0 ? Math.max(...timestamps, Date.now()) : Date.now();
  const sevenDaysAgoMs = anchorMs - (7 * 24 * 3600 * 1000 + 4 * 3600 * 1000);

  const observationsList = allObs.filter((obs) => {
    const t = new Date(obs.timestamp).getTime();
    return !isNaN(t) && t >= sevenDaysAgoMs && t <= anchorMs + 3600 * 1000;
  });

  // 6. Chronological ordering ascending
  observationsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 7. Save back to localStorage for seamless persistence
  try {
    localStorage.setItem(storageKey, JSON.stringify(observationsList));
  } catch (e) {
    console.warn('Failed to save river observations to localStorage:', e);
  }

  return observationsList;
}
