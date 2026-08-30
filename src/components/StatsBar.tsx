import React from 'react';
import { JournalStats, MoodType } from '../types';
import { MOOD_CONFIG, DEFAULT_TAGS } from '../data/prompts';
import { Star, BookMarked, PenTool, Sparkles } from 'lucide-react';

interface StatsBarProps {
  stats: JournalStats;
  selectedMood: MoodType | 'all';
  onMoodSelect: (mood: MoodType | 'all') => void;
  selectedTag: string | 'all';
  onTagSelect: (tag: string | 'all') => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
  allTags: string[];
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  selectedMood,
  onMoodSelect,
  selectedTag,
  onTagSelect,
  favoritesOnly,
  onFavoritesToggle,
  allTags
}) => {
  const displayTags = Array.from(new Set([...DEFAULT_TAGS, ...allTags])).slice(0, 10);

  return (
    <div id="stats-and-filters" className="mb-6 space-y-4">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Total Entries */}
        <div id="stat-total-entries" className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <BookMarked className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-medium uppercase tracking-wider">Entries</span>
          </div>
          <p className="text-xl font-bold text-stone-900 font-sans-ui">{stats.totalEntries}</p>
        </div>

        {/* Total Words */}
        <div id="stat-total-words" className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <PenTool className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-medium uppercase tracking-wider">Words Written</span>
          </div>
          <p className="text-xl font-bold text-stone-900 font-sans-ui">{stats.totalWords.toLocaleString()}</p>
        </div>

        {/* Current Streak */}
        <div id="stat-streak" className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Streak</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-bold text-stone-900 font-sans-ui">{stats.currentStreak}</p>
            <span className="text-xs text-stone-400">days</span>
          </div>
        </div>

        {/* Top Mood */}
        <div id="stat-top-mood" className="p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Dominant Mood</span>
          </div>
          <p className="text-base font-semibold text-stone-800 flex items-center gap-1.5 truncate">
            {stats.topMood ? (
              <>
                <span>{MOOD_CONFIG[stats.topMood]?.emoji}</span>
                <span className="capitalize">{MOOD_CONFIG[stats.topMood]?.label}</span>
              </>
            ) : (
              <span className="text-stone-400 text-sm">No entries yet</span>
            )}
          </p>
        </div>

      </div>

      {/* Filter Row: Moods & Tags & Favorites */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        
        {/* Mood Filter Pill Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            id="filter-mood-all"
            onClick={() => onMoodSelect('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all shrink-0 cursor-pointer ${
              selectedMood === 'all'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            All Moods
          </button>
          
          {(Object.keys(MOOD_CONFIG) as MoodType[]).map((m) => {
            const conf = MOOD_CONFIG[m];
            const isSelected = selectedMood === m;
            return (
              <button
                key={m}
                id={`filter-mood-${m}`}
                onClick={() => onMoodSelect(isSelected ? 'all' : m)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  isSelected
                    ? `${conf.bg} ${conf.color} ${conf.border} ring-1 ring-offset-1 ring-stone-400 font-semibold`
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{conf.emoji}</span>
                <span className="capitalize">{conf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Favorites only button */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            id="filter-favorites-toggle"
            onClick={onFavoritesToggle}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
              favoritesOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}`} />
            <span>Favorites</span>
          </button>
        </div>

      </div>

      {/* Tags Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-400 font-medium text-xs mr-1 shrink-0">Tags:</span>
        <button
          id="filter-tag-all"
          onClick={() => onTagSelect('all')}
          className={`px-2.5 py-0.5 rounded-md transition-all shrink-0 cursor-pointer ${
            selectedTag === 'all'
              ? 'bg-stone-800 text-white font-semibold'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All
        </button>
        {displayTags.map((tag) => (
          <button
            key={tag}
            id={`filter-tag-${tag.toLowerCase()}`}
            onClick={() => onTagSelect(selectedTag === tag ? 'all' : tag)}
            className={`px-2.5 py-0.5 rounded-md transition-all shrink-0 cursor-pointer ${
              selectedTag === tag
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
};
