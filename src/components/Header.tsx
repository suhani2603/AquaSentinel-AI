import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Download, 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  List, 
  Search,
  Flame,
  LogOut,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { ViewMode, JournalStats } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNewEntry: () => void;
  onOpenPrompts: () => void;
  onOpenAudio: () => void;
  onOpenExportImport: () => void;
  isAudioPlaying: boolean;
  stats: JournalStats;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user?: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onNewEntry,
  onOpenPrompts,
  onOpenAudio,
  onOpenExportImport,
  isAudioPlaying,
  stats,
  searchQuery,
  onSearchChange,
  user,
  onSignOut,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 transition-all shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand and User Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div id="brand-icon-wrapper" className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 id="app-title" className="text-base sm:text-lg font-bold tracking-tight text-stone-900 font-serif">
                  Personal Journal
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-semibold border border-emerald-300/60">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Firestore Sync</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {user?.displayName ? `Welcome, ${user.displayName.split(' ')[0]}` : 'Multi-turn reflections with Gemini'}
              </p>
            </div>
          </div>

          {/* Mobile Streak & Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {stats.currentStreak > 0 && (
              <div 
                id="mobile-streak-pill"
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-semibold text-amber-800"
                title={`${stats.currentStreak} day writing streak`}
              >
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{stats.currentStreak}d</span>
              </div>
            )}

            {user && onSignOut && (
              <button
                id="mobile-signout-btn"
                onClick={onSignOut}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg border border-stone-200 bg-white"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            
            <button
              id="mobile-new-entry-btn"
              onClick={onNewEntry}
              className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-xs"
              aria-label="New Journal Entry"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm mx-auto md:mx-4 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            id="journal-search-input"
            type="text"
            placeholder="Search entries, thoughts, AI insights..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-stone-800 text-xs rounded-xl border border-transparent focus:border-stone-300 focus:outline-hidden transition-all placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 hover:text-stone-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Desktop Streak */}
          {stats.currentStreak > 0 && (
            <div 
              id="desktop-streak-badge"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-900"
              title={`${stats.currentStreak} day writing streak`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{stats.currentStreak}d Streak</span>
            </div>
          )}

          {/* View Mode Switcher */}
          <div id="view-mode-selector" className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/70">
            <button
              id="view-mode-grid"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-stone-900 shadow-2xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-list"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-stone-900 shadow-2xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Timeline List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-calendar"
              onClick={() => onViewModeChange('calendar')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-white text-stone-900 shadow-2xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Prompts button */}
          <button
            id="prompts-button"
            onClick={onOpenPrompts}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200/80 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Reflective Prompts"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Prompts</span>
          </button>

          {/* Ambient Sound toggle */}
          <button
            id="ambient-sound-button"
            onClick={onOpenAudio}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all shadow-2xs cursor-pointer ${
              isAudioPlaying
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200/80'
            }`}
            title="Ambient Focus Sounds"
          >
            {isAudioPlaying ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span className="hidden sm:inline">Sounds</span>
          </button>

          {/* Export / Backup button */}
          <button
            id="export-import-button"
            onClick={onOpenExportImport}
            className="p-1.5 text-stone-600 bg-white hover:bg-stone-100 border border-stone-200/80 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Backup & Export Archive"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* New Entry Primary Button (Desktop) */}
          <button
            id="desktop-new-entry-btn"
            onClick={onNewEntry}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>Write Entry</span>
          </button>

          {/* User Profile & Sign Out Dropdown/Button */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-stone-300 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-xs font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
              {onSignOut && (
                <button
                  id="desktop-signout-btn"
                  onClick={onSignOut}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
