import React from 'react';
import { JournalEntry, ViewMode } from '../types';
import { MOOD_CONFIG } from '../data/prompts';
import { 
  Star, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Plus, 
  FileText,
  ChevronRight
} from 'lucide-react';

interface EntryListProps {
  entries: JournalEntry[];
  viewMode: ViewMode;
  onSelectEntry: (entry: JournalEntry) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onNewEntry: () => void;
  searchQuery: string;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  viewMode,
  onSelectEntry,
  onToggleFavorite,
  onNewEntry,
  searchQuery
}) => {
  if (entries.length === 0) {
    return (
      <div id="journal-empty-state" className="text-center py-16 px-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/80">
          <FileText className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-stone-800 font-sans-ui mb-1">
          {searchQuery ? 'No matching journal entries found' : 'Your journal is empty'}
        </h3>
        <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
          {searchQuery 
            ? `We couldn't find any entries matching "${searchQuery}". Try clearing filters or searching another keyword.`
            : 'Begin by capturing your thoughts, a mindful observation, or reflecting on your day.'}
        </p>
        <button
          id="empty-state-new-entry-btn"
          onClick={onNewEntry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Write your first entry</span>
        </button>
      </div>
    );
  }

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div id="entries-grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => {
          const mood = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.peaceful;
          const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const snippet = entry.content.replace(/[#*`>-]/g, '').slice(0, 140).trim();
          const wordCount = (entry.title + ' ' + entry.content).trim().split(/\s+/).filter(Boolean).length;

          return (
            <div
              key={entry.id}
              id={`journal-card-${entry.id}`}
              onClick={() => onSelectEntry(entry)}
              className="group bg-white hover:bg-stone-50/90 border border-stone-200/90 hover:border-stone-400/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span 
                    id={`card-mood-${entry.id}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${mood.bg} ${mood.color} ${mood.border}`}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      id={`card-fav-btn-${entry.id}`}
                      onClick={(e) => onToggleFavorite(entry.id, e)}
                      className="p-1 text-stone-300 hover:text-amber-500 rounded-md transition-colors cursor-pointer"
                      title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 
                  id={`card-title-${entry.id}`}
                  className="text-lg font-bold font-serif-journal text-stone-900 group-hover:text-stone-950 transition-colors line-clamp-2 mb-2 leading-snug"
                >
                  {entry.title || 'Untitled Entry'}
                </h3>

                {/* Prompt indicator if any */}
                {entry.promptUsed && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mb-2 line-clamp-1">
                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate">Prompt: {entry.promptUsed}</span>
                  </div>
                )}

                {/* Snippet text */}
                <p 
                  id={`card-snippet-${entry.id}`}
                  className="text-stone-600 text-sm font-serif-journal line-clamp-3 leading-relaxed mb-4"
                >
                  {snippet || 'No content written...'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
                <span>{wordCount} words</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // List (Timeline) View
  return (
    <div id="entries-timeline-container" className="space-y-3">
      {entries.map((entry) => {
        const mood = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.peaceful;
        const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        const formattedTime = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const snippet = entry.content.replace(/[#*`>-]/g, '').slice(0, 180).trim();
        const wordCount = (entry.title + ' ' + entry.content).trim().split(/\s+/).filter(Boolean).length;

        return (
          <div
            key={entry.id}
            id={`timeline-card-${entry.id}`}
            onClick={() => onSelectEntry(entry)}
            className="group bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-stone-400/80 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span 
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${mood.bg} ${mood.color} ${mood.border}`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </span>

                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formattedDate} at {formattedTime}
                </span>

                {entry.location && (
                  <span className="text-xs text-stone-400 flex items-center gap-1 hidden sm:flex">
                    <MapPin className="w-3 h-3" />
                    {entry.location}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold font-serif-journal text-stone-900 group-hover:text-stone-950 truncate mb-1">
                {entry.title || 'Untitled Reflection'}
              </h3>

              <p className="text-stone-600 text-xs sm:text-sm font-serif-journal line-clamp-1">
                {snippet || 'No content written...'}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
              <div className="text-xs text-stone-400">
                {wordCount} words
              </div>

              <button
                id={`timeline-fav-btn-${entry.id}`}
                onClick={(e) => onToggleFavorite(entry.id, e)}
                className="p-1.5 text-stone-300 hover:text-amber-500 rounded-md transition-colors cursor-pointer"
                title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>

              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-700 transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
