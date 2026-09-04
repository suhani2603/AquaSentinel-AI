import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  MapPin, 
  Sliders, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Send,
  Waves,
  CloudRain,
  TrendingUp,
  Dam,
  Check
} from 'lucide-react';
import { AlertItem, MonitoringStation, UserSavedStation } from '../types';
import { generateStationAlerts } from '../utils/hydrology';
import { INITIAL_STATIONS } from '../data/stationsData';

interface AlertsViewProps {
  stations: MonitoringStation[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  savedStations?: UserSavedStation[];
  onSaveCustomThresholds?: (stationId: string, flowM3s?: number, stageM?: number) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  stations = [],
  selectedStationId,
  onSelectStation,
}) => {
  const safeStations = stations && stations.length > 0 ? stations : INITIAL_STATIONS;
  const currentStation = safeStations.find((s) => s.id === selectedStationId) || safeStations[0] || INITIAL_STATIONS[0];
  
  // Notification Preferences State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aquasentinel_notifs_enabled') === 'true';
  });
  const [prefFloodAlerts, setPrefFloodAlerts] = useState<boolean>(true);
  const [prefHeavyRainAlerts, setPrefHeavyRainAlerts] = useState<boolean>(true);
  const [prefRapidRiseAlerts, setPrefRapidRiseAlerts] = useState<boolean>(true);
  const [prefDamReleaseAlerts, setPrefDamReleaseAlerts] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'current_alerts' | 'get_alerts'>('current_alerts');

  // Save preferences
  const handleSavePreferences = () => {
    localStorage.setItem('aquasentinel_notifs_enabled', String(notificationsEnabled));
    localStorage.setItem('aquasentinel_pref_flood', String(prefFloodAlerts));
    localStorage.setItem('aquasentinel_pref_rain', String(prefHeavyRainAlerts));
    localStorage.setItem('aquasentinel_pref_rise', String(prefRapidRiseAlerts));
    localStorage.setItem('aquasentinel_pref_dam', String(prefDamReleaseAlerts));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Generate alerts for all stations
  const allAlerts: (AlertItem & { alertCategory: 'NORMAL' | 'WATCH' | 'WARNING' | 'DANGER' })[] = [];
  safeStations.forEach((st) => {
    const rawAlerts = generateStationAlerts(st);
    rawAlerts.forEach((a) => {
      let cat: 'NORMAL' | 'WATCH' | 'WARNING' | 'DANGER' = 'WATCH';
      if (a.severity === 'critical') cat = 'DANGER';
      else if (a.severity === 'warning') cat = 'WARNING';
      else cat = 'WATCH';

      allAlerts.push({
        ...a,
        alertCategory: cat
      });
    });
  });

  // Filter alerts for current station or all
  const currentStationAlerts = allAlerts.filter(a => a.stationId === currentStation.id);

  const getCategoryBadge = (cat: 'NORMAL' | 'WATCH' | 'WARNING' | 'DANGER') => {
    switch (cat) {
      case 'DANGER':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> DANGER (Critical Flood Stage)
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> WARNING (Approaching Warning Level)
          </span>
        );
      case 'WATCH':
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800 rounded-full flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-600" /> FLOOD WATCH (Hydrological Advisory)
          </span>
        );
    }
  };

  return (
    <div id="alerts-page" className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Banner with Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Safety Alerts & Notifications
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              {currentStation.city}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Official thresholds, rapid river-rise warnings, and citizen alert subscriptions
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('current_alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'current_alerts'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Active Notices ({currentStationAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('get_alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'get_alerts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Get Safety Alerts</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CURRENT ACTIVE ALERTS */}
      {activeTab === 'current_alerts' && (
        <div className="space-y-4">
          {currentStationAlerts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                No Active Flood Warnings for {currentStation.city}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
                River levels and catchment rainfall are currently within safe baseline parameters. Continue normal activity.
              </p>
            </div>
          ) : (
            currentStationAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-all ${
                  alert.alertCategory === 'DANGER'
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80'
                    : alert.alertCategory === 'WARNING'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80'
                    : 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(alert.alertCategory)}
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    📍 {alert.stationName} ({alert.riverName})
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-base">
                    {alert.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {alert.reason}
                  </p>
                </div>

                {/* Plain Language "What you should do" Guidance */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    What You Should Do:
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {alert.recommendation || 'Stay away from riverbanks, avoid low causeways, and follow local District Disaster Management Authority directives.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: GET SAFETY ALERTS / NOTIFICATION SUBSCRIPTIONS */}
      {activeTab === 'get_alerts' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Customize Your Flood & Rainfall Notifications
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Select which alerts you want to receive for your monitored location.
            </p>
          </div>

          {/* Master Notifications Toggle */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                Enable Alert Notifications
              </span>
              <span className="text-xs text-zinc-500">
                Receive browser and in-app updates for urgent flood hazards
              </span>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="cursor-pointer text-blue-600 dark:text-blue-400"
            >
              {notificationsEnabled ? (
                <ToggleRight className="w-9 h-9" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Location Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Monitored Area
            </label>
            <select
              value={currentStation.id}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              {safeStations.map((st) => (
                <option key={st.id} value={st.id}>
                  📍 {st.city} — {st.riverName} ({st.basinName})
                </option>
              ))}
            </select>
          </div>

          {/* Individual Alert Type Toggles */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Alert Categories
            </span>

            {/* 1. River Level Alerts */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                    River Level & Flood Warning Alerts
                  </span>
                  <span className="text-xs text-zinc-500">
                    Notifies when water approaches or exceeds official warning levels
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefFloodAlerts}
                onChange={(e) => setPrefFloodAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            {/* 2. Heavy Rainfall Alerts */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Heavy Rainfall & Downpour Warnings
                  </span>
                  <span className="text-xs text-zinc-500">
                    Alerts when intense localized rainfall is detected in the catchment
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefHeavyRainAlerts}
                onChange={(e) => setPrefHeavyRainAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            {/* 3. Rapid River Rise */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Rapid River-Rise Alerts
                  </span>
                  <span className="text-xs text-zinc-500">
                    Triggers if water level surges quickly (&gt;20% increase in 6h)
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefRapidRiseAlerts}
                onChange={(e) => setPrefRapidRiseAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            {/* 4. Dam Release Alerts */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Dam className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Dam Spillway Release Updates
                  </span>
                  <span className="text-xs text-zinc-500">
                    Notifies when upstream dams discharge emergency flood volumes
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefDamReleaseAlerts}
                onChange={(e) => setPrefDamReleaseAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Preferences are saved to your account
            </span>
            <button
              onClick={handleSavePreferences}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Notification Settings</span>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
