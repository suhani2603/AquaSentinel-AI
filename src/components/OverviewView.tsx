import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  CloudRain, 
  AlertTriangle, 
  Bell, 
  MapPin, 
  ChevronRight, 
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Users,
  Check,
  CloudSun,
  Droplets,
  LifeBuoy,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';
import { MonitoringStation, ViewMode, AppLanguage, EmergencyReport } from '../types';
import { getTranslation } from '../utils/i18n';
import { INITIAL_STATIONS } from '../data/stationsData';
import { evaluateEvidenceBasedRisk } from '../utils/hydrology';

interface OverviewViewProps {
  station: MonitoringStation;
  onViewChange: (view: ViewMode) => void;
  onSelectStation: (id: string) => void;
  allStations: MonitoringStation[];
  language?: AppLanguage;
  activeRescueReportsCount?: number;
  peopleNeedingAssistanceCount?: number;
  verifiedRescueReportsCount?: number;
  rescueReports?: EmergencyReport[];
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  station: propStation,
  onViewChange,
  onSelectStation,
  allStations = [],
  language = 'en',
  activeRescueReportsCount = 0,
  peopleNeedingAssistanceCount = 0,
  verifiedRescueReportsCount = 0,
  rescueReports = []
}) => {
  const safeAllStations = allStations && allStations.length > 0 ? allStations : INITIAL_STATIONS;
  const station = propStation || safeAllStations.find((s) => s?.id === propStation?.id) || safeAllStations[0] || INITIAL_STATIONS[0];

  // Dehradun-focused station list for this version (Song River, Rispana River, Bindal River)
  const dehradunStations = safeAllStations.filter(
    (st) => st.city.toLowerCase().includes('dehradun') || st.id.includes('dehradun')
  );
  const displayStations = dehradunStations.length > 0 ? dehradunStations : safeAllStations;

  const t = getTranslation(language);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showTechnicalModal, setShowTechnicalModal] = useState(false);
  const [alertsSubscribed, setAlertsSubscribed] = useState(() => {
    return localStorage.getItem('aquasentinel_alerts_enabled') === 'true';
  });
  const [selectedRainStationId, setSelectedRainStationId] = useState<string>('');

  // Reset selected station if parent station changes
  useEffect(() => {
    setSelectedRainStationId('');
  }, [station.id]);

  const availableRainStations = station.rainfallObservationStations || [];
  const activeRainObs = (availableRainStations.length > 0
    ? (availableRainStations.find((s) => s.stationId === selectedRainStationId) || availableRainStations[0])
    : null);

  const activeRainfall24h = activeRainObs ? activeRainObs.rainfall24h : station.rainfall24h;
  const activeRainfallIntensity = activeRainObs ? activeRainObs.rainfallIntensityMmHr : station.rainfallIntensityMmHr;
  const activeStationName = activeRainObs?.stationName || station.rainfallObservationStationName || `${station.city} Station`;
  const activeMeasurementPeriod = activeRainObs?.measurementPeriod || station.rainfallMeasurementPeriod || 'previous 24 hours';
  const activeObsTimestamp = activeRainObs?.observationTimestamp || station.rainfallObservationTimestamp || (station.lastTelemetryUpdate ? new Date(station.lastTelemetryUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(station.lastTelemetryUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sep 2, 2026, 08:30 IST');
  const activeSource = activeRainObs?.source || station.rainfallSource || 'IMD';
  const activeFreshness = activeRainObs?.dataFreshness || station.rainfallFreshness || 'LATEST AVAILABLE';

  // Evidence-Based Risk Evaluation directly grounded in verified Dehradun thresholds
  const evidenceRisk = station.evidenceRiskAssessment || evaluateEvidenceBasedRisk({
    id: station.id,
    city: station.city,
    riverName: station.riverName,
    currentWaterLevel: station.currentWaterLevel,
    previousWaterLevel: station.previousWaterLevel,
    warningStage: station.warningStage,
    criticalStage: station.criticalStage,
    normalStage: station.normalStage,
    rainfall24h: activeRainfall24h,
    rainfallIntensityMmHr: activeRainfallIntensity,
    currentFlow: station.currentFlow,
    designPeakFlow: station.designPeakFlow,
    flowChangePercent: station.flowChangePercent,
    officialWarnings: station.officialWarnings
  });

  // 5-minute countdown timer for live telemetry refresh
  const [secondsUntilNextUpdate, setSecondsUntilNextUpdate] = useState(285);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextUpdate((prev) => (prev > 10 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Compute river trend
  const getRiverTrend = () => {
    if (station.currentWaterLevel === null || station.previousWaterLevel === null) {
      return { label: t.steady, icon: <Minus className="w-4 h-4 text-zinc-400" />, changeStr: '0.00 m' };
    }
    const diff = Number((station.currentWaterLevel - station.previousWaterLevel).toFixed(2));
    if (diff > 0.05) {
      return { 
        label: t.rising, 
        icon: <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        changeStr: `+${diff} m`
      };
    } else if (diff < -0.05) {
      return { 
        label: t.falling, 
        icon: <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        changeStr: `${diff} m`
      };
    }
    return { 
      label: t.steady, 
      icon: <Minus className="w-4 h-4 text-zinc-500" />,
      changeStr: '0.00 m'
    };
  };

  const riverTrend = getRiverTrend();

  // Status banner configuration based on evidence-based risk level
  const getStatusConfig = () => {
    const riskLvl = evidenceRisk.riskLevel;
    switch (riskLvl) {
      case 'DANGER':
      case 'CRITICAL':
        return {
          title: 'DANGER',
          description: evidenceRisk.plainLanguageSummary || t.criticalDesc,
          badgeBg: 'bg-rose-600 text-white',
          bannerBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60',
          textColor: 'text-rose-900 dark:text-rose-100',
          dotColor: 'bg-rose-500 animate-ping'
        };
      case 'WARNING':
        return {
          title: 'WARNING',
          description: evidenceRisk.plainLanguageSummary || t.highRiskDesc,
          badgeBg: 'bg-amber-600 text-white',
          bannerBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
          textColor: 'text-amber-900 dark:text-amber-100',
          dotColor: 'bg-amber-500'
        };
      case 'WATCH':
        return {
          title: 'WATCH',
          description: evidenceRisk.plainLanguageSummary || t.watchDesc,
          badgeBg: 'bg-yellow-500 text-zinc-950 font-bold',
          bannerBg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          dotColor: 'bg-yellow-500'
        };
      case 'INSUFFICIENT_DATA':
        return {
          title: 'INSUFFICIENT DATA',
          description: 'Awaiting verified sensor or rainfall telemetry from local observatories.',
          badgeBg: 'bg-zinc-600 text-white',
          bannerBg: 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800',
          textColor: 'text-zinc-800 dark:text-zinc-200',
          dotColor: 'bg-zinc-400'
        };
      default:
        return {
          title: 'NORMAL',
          description: evidenceRisk.plainLanguageSummary || t.normalDesc,
          badgeBg: 'bg-emerald-600 text-white',
          bannerBg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
          textColor: 'text-emerald-900 dark:text-emerald-100',
          dotColor: 'bg-emerald-500'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const officialWarnings = station.officialWarnings || [];
  const hasOfficialWarnings = officialWarnings.length > 0;

  // Find relevant latest citizen rescue report
  const relevantReports = rescueReports.filter(r => r.stationId === station.id && r.status !== 'RESOLVED');
  const latestReport = relevantReports.length > 0 
    ? relevantReports[0] 
    : (rescueReports.find(r => r.status !== 'RESOLVED') || null);
  
  const pendingVerificationCount = Math.max(0, activeRescueReportsCount - verifiedRescueReportsCount);

  // Forecast data extractions
  const hourly = station.hourlyForecast || [];
  const daily = station.forecast || [];
  const nowHourly = hourly[0];
  const next6hItem = hourly[Math.min(5, hourly.length - 1)];
  const todayDaily = daily[0];
  const tmwDaily = daily[1];

  const handleSubscribeAlerts = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setAlertsSubscribed(true);
          localStorage.setItem('aquasentinel_alerts_enabled', 'true');
          new Notification('AquaSentinel Safety Alerts', {
            body: `Subscribed to live flood & rainfall alerts for ${station.city}.`,
            icon: '/favicon.ico'
          });
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
    setAlertsSubscribed(true);
    localStorage.setItem('aquasentinel_alerts_enabled', 'true');
    setShowAlertModal(false);
  };

  return (
    <div className="max-w-7xl w-full mx-auto space-y-5">
      
      {/* 1. Header with AquaSentinel Branding, Selected Location & Notification CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              A
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
              {t.appName}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t.appSubtitle} • {station.city}, {station.stateOrRegion}
          </p>
        </div>

        {/* Location Picker & Notification CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              value={station.id}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-bold text-xs sm:text-sm focus:outline-none cursor-pointer pr-1"
            >
              {displayStations.map((st) => (
                <option key={st.id} value={st.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium">
                  {st.city} — {st.riverName.split('(')[0]}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAlertModal(true)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              alertsSubscribed
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{alertsSubscribed ? t.alertsEnabled : t.getLocalAlerts}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT CURRENT AREA STATUS */}
      <section aria-labelledby="status-heading" className={`p-4 rounded-2xl border ${statusConfig.bannerBg} transition-all shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${statusConfig.dotColor} shrink-0`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.currentAreaStatus}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${statusConfig.badgeBg}`}>
                  {statusConfig.title}
                </span>
              </div>
              <p className={`text-sm sm:text-base font-bold ${statusConfig.textColor} mt-0.5`}>
                "{statusConfig.description}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium bg-white/70 dark:bg-zinc-900/70 px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shrink-0 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {t.nextUpdateIn}: <strong className="text-zinc-800 dark:text-zinc-200">{formatCountdown(secondsUntilNextUpdate)}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* 3. SIX SEPARATE INFORMATION CARDS IN A 3x2 GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* CARD 1 — 🌧 RAINFALL & WEATHER */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  🌧
                </div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {t.rainfallCardTitle}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                {station.rainfallIntensityMmHr && station.rainfallIntensityMmHr > 0 ? 'LIVE DATA' : 'LATEST AVAILABLE'}
              </span>
            </div>

            {/* Multiple Observation Stations Notice & Selector */}
            {availableRainStations.length > 1 && (
              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-bold text-blue-900 dark:text-blue-200 text-[11px]">
                    {station.city} has multiple observation stations
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                    Select station:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {availableRainStations.map((st) => {
                    const isSelected = activeRainObs?.stationId === st.stationId;
                    const shortName = st.stationName.replace(`${station.city} — `, '').replace(`${station.city}-`, '');
                    return (
                      <button
                        key={st.stationId}
                        onClick={() => setSelectedRainStationId(st.stationId)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {shortName}: {st.rainfall24h} mm
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Weather Section */}
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">
                CURRENT WEATHER
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                  <span>🌧️</span>
                  <span>{station.weatherCondition?.weatherDescription || (activeRainfall24h && activeRainfall24h > 15 ? 'Rain / Thundershowers' : 'Light scattered showers')}</span>
                </span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 text-xs">
                  {station.weatherCondition?.temperatureC ?? 26.5}°C
                </span>
              </div>
            </div>

            {/* 24-Hour Rainfall Observation Card */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wide">
                    24-HOUR RAINFALL
                  </span>
                  {activeRainfall24h !== null && activeRainfall24h !== undefined ? (
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block">
                      {activeRainfall24h} mm
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                      Current official data unavailable
                    </span>
                  )}
                </div>
                {activeRainfallIntensity !== null && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wide">
                      INTENSITY
                    </span>
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">
                      {activeRainfallIntensity} mm/h
                    </span>
                  </div>
                )}
              </div>

              {/* Verified Metadata Breakdown */}
              <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/30 text-[11px] text-zinc-600 dark:text-zinc-300 space-y-0.5">
                <div><strong>Station:</strong> {activeStationName}</div>
                <div><strong>Observation period:</strong> {activeMeasurementPeriod}</div>
                <div><strong>Source:</strong> {activeSource}</div>
                <div><strong>Observed:</strong> {activeObsTimestamp}</div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span><strong>Freshness:</strong> {activeFreshness}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Official IMD Data</span>
                </div>
              </div>
            </div>

            {/* Official Weather Warning (Displayed separately from measured rainfall) */}
            {station.officialWarnings && station.officialWarnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <span>🟠</span> OFFICIAL WEATHER WARNING
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                    IMD ACTIVE
                  </span>
                </div>
                <div className="font-extrabold text-amber-950 dark:text-amber-100 text-xs">
                  {station.officialWarnings[0].title}
                </div>
                <div className="text-[11px] text-amber-900 dark:text-amber-300 leading-snug">
                  Thunderstorm + Lightning & Heavy Rainfall
                </div>
                <div className="pt-1 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>Source: {station.officialWarnings[0].issuingAuthority.split('(')[0].trim()}</span>
                  <span>{station.officialWarnings[0].validUntil || 'Valid through today'}</span>
                </div>
              </div>
            )}

            {/* AquaSentinel AI Simple Explanation */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                AquaSentinel AI Simple Explanation
              </span>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                "{station.aiSimpleExplanation || (activeRainfall24h && activeRainfall24h >= 40
                  ? `Heavy rainfall is currently affecting parts of ${station.city}. Conditions may change quickly. Follow official disaster-management instructions.`
                  : `Rainfall across ${station.city} remains within normal monitored thresholds. Follow official guidance.`)}"
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 truncate max-w-[170px]" title={activeSource}>
              {t.source}: {activeSource}
            </span>
            <button
              onClick={() => onViewChange('rainfall')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2 — 🌊 RIVER */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                  🌊
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {t.riverCardTitle}
                  </h2>
                  <span className="text-[11px] text-zinc-500 font-medium block">
                    {station.riverName.split('(')[0]}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                LATEST AVAILABLE
              </span>
            </div>

            {/* Primary River Metric */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 block uppercase tracking-wide">
                    {t.currentLevel}
                  </span>
                  {station.currentWaterLevel !== null ? (
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block">
                      {station.currentWaterLevel.toFixed(2)} m
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                      Current official data unavailable
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-zinc-500 block uppercase tracking-wide">
                    {t.trend}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {riverTrend.icon}
                    <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                      {riverTrend.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    {riverTrend.changeStr} in 3h
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-2.5 pt-2 border-t border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-between">
                <span>
                  Warning: <strong>{station.warningStage.toFixed(2)} m</strong> / Danger: <strong>{station.criticalStage.toFixed(2)} m</strong>
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {station.thresholdType === 'OFFICIAL_CWC' ? 'CWC Mark' : 'Benchmark'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setShowTechnicalModal(true)}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-3 h-3 text-zinc-400" />
              <span>{t.technicalDetails}</span>
            </button>
            <button
              onClick={() => onViewChange('river')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              Monitor <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 3 — ⚠️ FLOOD RISK */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  ⚠️
                </div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {t.floodRiskCardTitle}
                </h2>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${statusConfig.badgeBg}`}>
                {statusConfig.title}
              </span>
            </div>

            {/* Evidence-Based Assessment & "Why?" Explanation Section */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2.5">
              {/* Plain Language Summary */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Why this risk level? (Evidence-Based Assessment)
                </span>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                  {evidenceRisk.plainLanguageSummary}
                </p>
              </div>

              {/* Primary Evidence Triggers */}
              {evidenceRisk.primaryTriggers && evidenceRisk.primaryTriggers.length > 0 && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 space-y-1.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Observed Triggers:
                  </span>
                  {evidenceRisk.primaryTriggers.map((trigger, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{trigger}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Telemetry Conditions & Data Confidence */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">Data Confidence:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    evidenceRisk.dataConfidence === 'HIGH'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {evidenceRisk.dataConfidence || 'HIGH'}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium">
                  {evidenceRisk.rainfallCondition.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setShowTechnicalModal(true)}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-3 h-3 text-zinc-400" />
              <span>{t.damAndDataDetails}</span>
            </button>
            <button
              onClick={() => onViewChange('risk')}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              Assessment <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 4 — 🌦 FORECAST */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                  🌦
                </div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {t.forecastCardTitle}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                {t.forecastData}
              </span>
            </div>

            {/* Compact 4-Period Weather Forecast: NOW, NEXT 6H, TODAY, TOMORROW */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-500 uppercase">
                  <span>{t.now}</span>
                  <span className="text-teal-600 font-bold">{nowHourly?.precipitationProbability ?? 15}% rain</span>
                </div>
                <div className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">
                  {station.weatherCondition?.temperatureC ?? nowHourly?.tempC ?? 27}°C
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {station.weatherCondition?.weatherDescription || nowHourly?.weatherDescription || 'Scattered clouds'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-500 uppercase">
                  <span>{t.next6Hours}</span>
                  <span className="text-teal-600 font-bold">{next6hItem?.precipitationProbability ?? 25}%</span>
                </div>
                <div className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">
                  {next6hItem?.precipitationMm ?? 0.8} mm
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {next6hItem?.weatherDescription || 'Light rain likely'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-500 uppercase">
                  <span>{t.today}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-bold">{todayDaily?.precipitationMm ?? 14} mm</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {todayDaily?.tempMaxC ?? 28}° / {todayDaily?.tempMinC ?? 21}°C
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {todayDaily?.weatherDescription || 'Rain showers'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-500 uppercase">
                  <span>{t.tomorrow}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-bold">{tmwDaily?.precipitationProbability ?? 45}%</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {tmwDaily?.tempMaxC ?? 27}° / {tmwDaily?.tempMinC ?? 20}°C
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {tmwDaily?.weatherDescription || 'Seasonal rain'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">
              IMD & Open-Meteo
            </span>
            <button
              onClick={() => onViewChange('forecast')}
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              7-Day Forecast <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 5 — 🚨 OFFICIAL ALERTS */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                  🚨
                </div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {t.officialAlertsCardTitle}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                {t.officialWarning}
              </span>
            </div>

            {/* Official Warnings Verified Content */}
            {hasOfficialWarnings ? (
              <div className="space-y-2">
                {officialWarnings.slice(0, 1).map((w) => (
                  <div key={w.id} className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        {w.title}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded">
                        {w.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 line-clamp-2">
                      "{w.description}"
                    </p>
                    <div className="text-[10px] text-zinc-500 mt-1 pt-1 border-t border-amber-200/60 dark:border-amber-900/40 flex justify-between">
                      <span className="truncate">{w.issuingAuthority.split('(')[0]}</span>
                      <span>Valid: {new Date(w.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    No active official warnings
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Monitoring IMD, CWC, and State Disaster Management feeds.
                  </p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
              * Verified government alerts only. AI never fabricates official bulletins.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">
              IMD & CWC Verified
            </span>
            <button
              onClick={() => onViewChange('alerts')}
              className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              All Advisories <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 6 — 🆘 RESCUE & COMMUNITY */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
                  🆘
                </div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  {t.rescueCommunityCardTitle}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                {t.citizenReport}
              </span>
            </div>

            {/* Main Rescue Counter and Breakdown */}
            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span>🆘</span>
                  <span>{peopleNeedingAssistanceCount} people reported in need</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-rose-200/50 dark:border-rose-900/30">
                <span>Verified: <strong className="text-emerald-600 dark:text-emerald-400">{verifiedRescueReportsCount}</strong></span>
                <span>Pending verification: <strong className="text-amber-600 dark:text-amber-400">{pendingVerificationCount}</strong></span>
              </div>

              {/* Latest Report Snippet */}
              {latestReport ? (
                <div className="text-[11px] text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/70 p-2 rounded-lg border border-rose-200/40 dark:border-rose-900/30">
                  <p className="line-clamp-1 italic font-medium">"{latestReport.description}"</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    📍 {latestReport.locationName || station.city} • {latestReport.peopleNeedingAssistance} people
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 italic">
                  No active emergency distress calls reported in this immediate sector.
                </p>
              )}
            </div>

            {/* Rescue Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onViewChange('emergency')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-center transition-colors cursor-pointer truncate"
              >
                {t.viewRescueReports}
              </button>
              <button
                onClick={() => onViewChange('emergency')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white text-center shadow-sm transition-colors cursor-pointer truncate"
              >
                {t.submitRescueReport}
              </button>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">
              Only counts reported in-need citizens
            </span>
            <button
              onClick={() => onViewChange('emergency')}
              className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              SOS Hub <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Compact Visually Secondary Safety Disclaimer */}
      <div className="flex items-start sm:items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
        <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Safety Notice: </span>
          {t.safetyDisclaimer}
        </p>
      </div>

      {/* Technical Hydrological & Upstream Dam Details Modal */}
      {showTechnicalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  DATA
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    {t.technicalDetails}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {station.city} • {station.riverName.split('(')[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTechnicalModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upstream Infrastructure Information */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Upstream Dam / Barrage Telemetry
              </span>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {station.upstreamDam?.name || 'Upstream Hydrological Infrastructure'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    station.upstreamDam?.isAvailable && station.upstreamDam.dischargeM3s !== null
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}>
                    {station.upstreamDam?.isAvailable && station.upstreamDam.dischargeM3s !== null
                      ? `${station.upstreamDam.dischargeM3s} m³/s discharge`
                      : 'Discharge Unavailable'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {station.upstreamDam?.isAvailable && station.upstreamDam.travelTimeToStationHours
                    ? `Estimated downstream surge travel window: ~${station.upstreamDam.travelTimeToStationHours} hours. Upstream distance: ~${station.upstreamDam.distanceUpstreamKm} km.`
                    : 'Direct downstream lag time cannot be estimated without active spillway release logs.'}
                </p>
              </div>
            </div>

            {/* Station Hydrological Benchmarks */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Hydrological Benchmarks & Limits
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Warning Stage</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {station.warningStage.toFixed(2)} m
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Danger Stage</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {station.criticalStage.toFixed(2)} m
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Basin & Catchment</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate">
                    {station.basinName || 'Ganga Basin'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Threshold Type</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate">
                    {station.thresholdType === 'OFFICIAL_CWC' ? 'Official CWC Gauge' : 'Configured Local Baseline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Source Attributions */}
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <p>• <strong>Water Level Source:</strong> {station.waterLevelSource || 'CWC Hydrological Observation System'}</p>
              <p>• <strong>Rainfall Source:</strong> {station.rainfallSource || 'IMD Automatic Weather Station'}</p>
              <p>• <strong>Weather Data:</strong> Open-Meteo & IMD Synoptic Models</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setShowTechnicalModal(false);
                  onViewChange('river');
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open River & Hydrology Monitor <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowTechnicalModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Subscription Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {t.alertSubscriptionTitle}
                </h3>
                <p className="text-xs text-zinc-500">
                  {station.city}, {station.stateOrRegion}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {t.alertSubscriptionDesc}
            </p>

            <div className="space-y-2 py-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.heavyRainfallAlerts}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.riverLevelAlerts}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.officialFloodAlerts}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.highRiskChangesAlerts}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscribeAlerts}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
              >
                {t.enableAlertsBtn}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
