import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { MOOD_CONFIG } from '../data/prompts';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Star } from 'lucide-react';

interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntryForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onSelectEntry,
  onNewEntryForDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.toISOString().split('T')[0]);
  };

  // Map entries by date key (YYYY-MM-DD)
  const entriesByDate: Record<string, JournalEntry[]> = {};
  entries.forEach((e) => {
    const dStr = new Date(e.createdAt).toISOString().split('T')[0];
    if (!entriesByDate[dStr]) {
      entriesByDate[dStr] = [];
    }
    entriesByDate[dStr].push(e);
  });

  const selectedDateEntries = selectedDay ? entriesByDate[selectedDay] || [] : [];

  return (
    <div id="calendar-view-container" className="space-y-6">
      
      {/* Calendar Header */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            <h2 id="calendar-month-title" className="text-xl font-bold font-serif-journal text-stone-900">
              {monthNames[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="calendar-today-btn"
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
              <button
                id="calendar-prev-month-btn"
                onClick={handlePrevMonth}
                className="p-1.5 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="calendar-next-month-btn"
                onClick={handleNextMonth}
                className="p-1.5 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid Days */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[80px] bg-stone-50/50 rounded-xl border border-transparent" />
          ))}

          {/* Days in Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEntries = entriesByDate[dateStr] || [];
            const hasEntries = dayEntries.length > 0;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = selectedDay === dateStr;

            return (
              <div
                key={dateStr}
                id={`calendar-day-${dateStr}`}
                onClick={() => setSelectedDay(dateStr)}
                className={`min-h-[64px] sm:min-h-[80px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-stone-900 bg-amber-50/40 ring-2 ring-stone-900/10'
                    : isToday
                    ? 'border-amber-400 bg-white'
                    : hasEntries
                    ? 'border-stone-200 bg-white hover:border-stone-400'
                    : 'border-stone-100 bg-stone-50/40 hover:bg-stone-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                      isToday
                        ? 'bg-amber-500 text-white font-bold'
                        : isSelected
                        ? 'text-stone-900 font-bold'
                        : 'text-stone-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {hasEntries && (
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1 rounded-sm">
                      {dayEntries.length}
                    </span>
                  )}
                </div>

                {/* Mood emojis preview */}
                <div className="flex items-center gap-1 overflow-hidden mt-1">
                  {dayEntries.slice(0, 3).map((e, idx) => (
                    <span key={idx} className="text-xs" title={`${e.title} (${e.mood})`}>
                      {MOOD_CONFIG[e.mood]?.emoji || '🌿'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <div id="calendar-day-details" className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-serif-journal text-stone-900">
                Entries for {new Date(selectedDay + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-xs text-stone-500">
                {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'} recorded
              </p>
            </div>

            <button
              id="calendar-write-for-day-btn"
              onClick={() => onNewEntryForDate(selectedDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write for this date</span>
            </button>
          </div>

          {selectedDateEntries.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 font-serif-journal italic">
              No journal reflections recorded on this day.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateEntries.map((entry) => {
                const mood = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.peaceful;
                const timeStr = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={entry.id}
                    id={`calendar-day-entry-${entry.id}`}
                    onClick={() => onSelectEntry(entry)}
                    className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50/80 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{mood.emoji}</span>
                      <div>
                        <h4 className="font-bold font-serif-journal text-stone-900 text-sm sm:text-base">
                          {entry.title || 'Untitled Entry'}
                        </h4>
                        <p className="text-xs text-stone-400">
                          {timeStr} • {mood.label} • {entry.tags.map((t) => `#${t}`).join(' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.isFavorite && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      )}
                      <span className="text-xs text-stone-400 font-medium">View</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
