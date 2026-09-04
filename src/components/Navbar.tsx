import React, { useState } from 'react';
import { 
  Home, 
  Waves, 
  CloudSun, 
  Bell, 
  Bot, 
  ShieldAlert, 
  SlidersHorizontal, 
  LogIn, 
  LogOut, 
  MapPin, 
  ChevronDown, 
  User as UserIcon,
  Menu,
  X,
  Languages,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppOperationalMode, MonitoringStation, ViewMode, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';
import { INITIAL_STATIONS } from '../data/stationsData';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  stations: MonitoringStation[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isGuest: boolean;
  onToggleGuest: () => void;
  activeAlertsCount: number;
  operationalMode: AppOperationalMode;
  onToggleOperationalMode?: (mode: AppOperationalMode) => void;
  language?: AppLanguage;
  onToggleLanguage?: (lang: AppLanguage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  stations = [],
  selectedStationId,
  onSelectStation,
  user,
  onSignIn,
  onSignOut,
  activeAlertsCount,
  operationalMode,
  language = 'en',
  onToggleLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const stationList = stations && stations.length > 0 ? stations : INITIAL_STATIONS;
  const currentStation = stationList.find((s) => s.id === selectedStationId) || stationList[0] || INITIAL_STATIONS[0];
  const t = getTranslation(language);

  // Dehradun-focused stations for this version (Song River, Rispana River, Bindal River)
  const dehradunStations = stationList.filter(
    (st) => st.city.toLowerCase().includes('dehradun') || st.id.includes('dehradun')
  );
  const displayStations = dehradunStations.length > 0 ? dehradunStations : stationList;

  const navLinks: { id: ViewMode; label: string; icon: React.ReactNode; badge?: number; isDanger?: boolean }[] = [
    { id: 'overview', label: t.navOverview, icon: <Home className="w-4 h-4" /> },
    { id: 'river', label: t.navRiver, icon: <Waves className="w-4 h-4" /> },
    { id: 'forecast', label: t.navForecast, icon: <CloudSun className="w-4 h-4" /> },
    { 
      id: 'alerts', 
      label: t.navAlerts, 
      icon: <Bell className="w-4 h-4" />, 
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined 
    },
    { id: 'assistant', label: t.navAssistant, icon: <Bot className="w-4 h-4" /> },
    { id: 'emergency', label: t.navRescue, icon: <ShieldAlert className="w-4 h-4" />, isDanger: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* Top micro bar for data integrity notice and language switcher */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-1 text-[11px] text-zinc-500 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Official Dehradun Observation Telemetry (IMD / CWC / State Hydrology Network)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            {onToggleLanguage && (
              <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => onToggleLanguage('en')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => onToggleLanguage('hi')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            )}
            <span className="hidden sm:inline text-zinc-400">
              For official disaster directives, always follow District Disaster Management (DDMA).
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onViewChange('overview');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight block leading-tight text-zinc-900 dark:text-zinc-50">
                  AquaSentinel
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase block">
                  Hydrological Safety
                </span>
              </div>
            </button>

            {/* Quick Location Badge / Switcher */}
            <div className="hidden md:flex items-center ml-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <select
                  value={currentStation.id}
                  onChange={(e) => onSelectStation(e.target.value)}
                  className="bg-transparent text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none cursor-pointer pr-1"
                >
                  {displayStations.map((st) => (
                    <option key={st.id} value={st.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                      📍 {st.city} — {st.riverName.split('(')[0].replace(' Catchment', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? item.isDanger
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold shadow-sm'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                      : item.isDanger
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Account Section */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 pr-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden sm:inline max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={onSignOut}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3 animate-fadeIn">
          {/* Mobile Location Selector */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Your Location</span>
            <select
              value={currentStation.id}
              onChange={(e) => {
                onSelectStation(e.target.value);
                setMobileMenuOpen(false);
              }}
              className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              {displayStations.map((st) => (
                <option key={st.id} value={st.id}>
                  📍 {st.city} — {st.riverName.split('(')[0].replace(' Catchment', '')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isActive
                      ? item.isDanger
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800'
                        : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                      : item.isDanger
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </header>
  );
};
