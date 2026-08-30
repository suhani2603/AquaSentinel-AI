import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, MoodType, WeatherType, AIMessage } from '../types';
import { MOOD_CONFIG, WEATHER_CONFIG, DEFAULT_TAGS, JOURNAL_PROMPTS } from '../data/prompts';
import { GeminiCompanion } from './GeminiCompanion';
import { 
  Save, 
  X, 
  Star, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Bold, 
  Italic, 
  Heading3, 
  List, 
  Quote, 
  Clock, 
  CheckSquare, 
  Minus,
  Trash2,
  Calendar,
  MapPin,
  MessageSquare
} from 'lucide-react';

interface EntryEditorProps {
  initialEntry?: JournalEntry | null;
  onSave: (entry: JournalEntry) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  initialPrompt?: string;
  userId?: string;
}

export const EntryEditor: React.FC<EntryEditorProps> = ({
  initialEntry,
  onSave,
  onClose,
  onDelete,
  initialPrompt,
  userId = 'user'
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'peaceful');
  const [weather, setWeather] = useState<WeatherType>(initialEntry?.weather || 'sunny');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ['Reflection']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(initialEntry?.isFavorite || false);
  const [createdAt, setCreatedAt] = useState(
    initialEntry ? new Date(initialEntry.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [location, setLocation] = useState(initialEntry?.location || '');
  const [promptUsed, setPromptUsed] = useState(initialEntry?.promptUsed || initialPrompt || '');
  const [aiSummary, setAiSummary] = useState(initialEntry?.aiSummary || '');
  const [aiInsights, setAiInsights] = useState<string[]>(initialEntry?.aiInsights || []);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>(initialEntry?.aiMessages || []);
  const [showGeminiPanel, setShowGeminiPanel] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsDirty(true);
  }, [title, content, mood, weather, tags, isFavorite, createdAt, location, promptUsed]);

  // Keyboard shortcut: Ctrl/Cmd + S to save, Esc to exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        if (isZenMode) {
          setIsZenMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, mood, weather, tags, isFavorite, createdAt, location, promptUsed, isZenMode, aiSummary, aiInsights, aiMessages]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      return;
    }

    const now = new Date().toISOString();
    const entryData: JournalEntry = {
      id: initialEntry ? initialEntry.id : `entry-${Date.now()}`,
      userId,
      title: title.trim() || 'Untitled Reflection',
      content: content,
      createdAt: new Date(createdAt).toISOString() || now,
      updatedAt: now,
      mood,
      weather,
      tags: tags.filter(Boolean),
      isFavorite,
      promptUsed: promptUsed.trim() || undefined,
      location: location.trim() || undefined,
      aiSummary: aiSummary || undefined,
      aiInsights: aiInsights.length > 0 ? aiInsights : undefined,
      aiMessages: aiMessages.length > 0 ? aiMessages : undefined
    };

    onSave(entryData);
  };

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const insertFormatting = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const replacement = before + selectedText + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertTimestamp = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    insertFormatting(`[${timeStr}] `);
  };

  const handleRandomPrompt = () => {
    const random = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    setPromptUsed(random.prompt);
  };

  // Word & Reading statistics
  const wordCount = (title + ' ' + content).trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const readTimeMin = Math.ceil(wordCount / 200) || 1;

  return (
    <div 
      id="entry-editor-container"
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs transition-all overflow-y-auto ${
        isZenMode ? 'p-0!' : ''
      }`}
    >
      <div 
        id="entry-editor-card"
        className={`w-full bg-white shadow-2xl flex flex-col transition-all paper-texture ${
          isZenMode 
            ? 'h-full min-h-screen rounded-none border-none max-w-none' 
            : showGeminiPanel
              ? 'max-w-6xl max-h-[92vh] rounded-2xl border border-stone-300'
              : 'max-w-4xl max-h-[92vh] rounded-2xl border border-stone-300'
        }`}
      >
        
        {/* Top Control Bar */}
        <div id="editor-top-bar" className="px-6 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              id="editor-close-btn"
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
              title="Close editor (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {initialEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Gemini Reflection Toggle */}
            <button
              id="editor-gemini-toggle-btn"
              type="button"
              onClick={() => setShowGeminiPanel(!showGeminiPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showGeminiPanel
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Reflect with Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{showGeminiPanel ? 'Hide Gemini' : 'Reflect with Gemini'}</span>
            </button>

            {/* Zen Mode Toggle */}
            <button
              id="zen-mode-toggle-btn"
              onClick={() => setIsZenMode(!isZenMode)}
              className={`p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isZenMode 
                  ? 'bg-stone-900 text-white border-stone-900' 
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title={isZenMode ? 'Exit Zen Mode' : 'Distraction-Free Zen Mode'}
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Favorite toggle */}
            <button
              id="editor-favorite-toggle"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite 
                  ? 'bg-amber-50 text-amber-600 border-amber-300' 
                  : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600'
              }`}
              title={isFavorite ? 'Favorited' : 'Add to Favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* Delete button (if editing existing) */}
            {initialEntry && onDelete && (
              <button
                id="editor-delete-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this journal entry?')) {
                    onDelete(initialEntry.id);
                  }
                }}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-all cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Save Button */}
            <button
              id="editor-save-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </div>

        {/* Main Content Area: Editor + Optional Gemini Side Panel */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Editor Main Scrollable Body */}
          <div id="editor-body" className={`flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 ${showGeminiPanel ? 'md:max-w-[58%]' : ''}`}>
            
            {/* Metadata Section: Mood, Weather, Date, Location */}
            <div id="editor-metadata-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-stone-100/60 p-4 rounded-xl border border-stone-200/80">
              
              {/* Mood selector */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Current Mood
                </label>
                <select
                  id="editor-mood-select"
                  value={mood}
                  onChange={(e) => setMood(e.target.value as MoodType)}
                  className="w-full bg-white text-stone-800 text-xs font-medium px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:border-stone-500 cursor-pointer"
                >
                  {(Object.keys(MOOD_CONFIG) as MoodType[]).map((m) => (
                    <option key={m} value={m}>
                      {MOOD_CONFIG[m].emoji} {MOOD_CONFIG[m].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weather selector */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Weather
                </label>
                <select
                  id="editor-weather-select"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value as WeatherType)}
                  className="w-full bg-white text-stone-800 text-xs font-medium px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:border-stone-500 cursor-pointer"
                >
                  {(Object.keys(WEATHER_CONFIG) as WeatherType[]).map((w) => (
                    <option key={w} value={w}>
                      {WEATHER_CONFIG[w].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date selector */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Date & Time
                </label>
                <div className="relative">
                  <input
                    id="editor-date-input"
                    type="datetime-local"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    className="w-full bg-white text-stone-800 text-xs font-medium px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:border-stone-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Location input */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Location (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    id="editor-location-input"
                    type="text"
                    placeholder="e.g., Home, Cafe, Park"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white text-stone-800 text-xs font-medium pl-8 pr-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:border-stone-500"
                  />
                </div>
              </div>

            </div>

            {/* Prompt banner / prompt generator */}
            {promptUsed ? (
              <div id="editor-prompt-active-banner" className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Writing Prompt</p>
                    <p className="text-sm italic text-stone-800 mt-0.5">"{promptUsed}"</p>
                  </div>
                </div>
                <button
                  id="editor-remove-prompt-btn"
                  onClick={() => setPromptUsed('')}
                  className="text-stone-400 hover:text-stone-600 p-1 text-xs cursor-pointer"
                  title="Remove prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="editor-inspire-prompt-btn"
                  onClick={handleRandomPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-medium text-amber-800 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Inspire me with a reflective prompt</span>
                </button>
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-1">
              <input
                id="editor-title-input"
                type="text"
                placeholder="Title for today's entry..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-bold font-serif text-stone-900 placeholder:text-stone-300 border-b border-stone-200 focus:border-stone-400 pb-2 focus:outline-hidden bg-transparent"
                autoFocus
              />
            </div>

            {/* Formatting helper toolbar */}
            <div id="editor-format-toolbar" className="flex items-center flex-wrap gap-1 p-1 bg-stone-100/70 border border-stone-200/80 rounded-xl">
              <button
                id="format-bold-btn"
                type="button"
                onClick={() => insertFormatting('**', '**', 'bold text')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-italic-btn"
                type="button"
                onClick={() => insertFormatting('*', '*', 'italic text')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-heading-btn"
                type="button"
                onClick={() => insertFormatting('### ', '\n', 'Heading')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Heading 3"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-bullet-btn"
                type="button"
                onClick={() => insertFormatting('- ', '\n', 'List item')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-task-btn"
                type="button"
                onClick={() => insertFormatting('- [ ] ', '\n', 'Daily reflection task')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Checklist item"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-quote-btn"
                type="button"
                onClick={() => insertFormatting('> ', '\n', 'Memorable quote or thought')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Quote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-divider-btn"
                type="button"
                onClick={() => insertFormatting('\n---\n')}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Divider line"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                id="format-time-btn"
                type="button"
                onClick={insertTimestamp}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Insert Timestamp"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Writing Area */}
            <div className="relative">
              <textarea
                id="editor-content-textarea"
                ref={textareaRef}
                placeholder="What is on your mind? Capture your thoughts, feelings, realizations, and stories..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[300px] p-4 text-base sm:text-lg font-serif text-stone-800 leading-relaxed placeholder:text-stone-300 focus:outline-hidden bg-transparent border-0 resize-y"
                style={{ lineHeight: 1.75 }}
              />
            </div>

            {/* Tags Management */}
            <div id="editor-tags-section" className="pt-4 border-t border-stone-200/80">
              <label className="block text-xs font-semibold text-stone-600 mb-2">
                Tags & Themes:
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    id={`editor-tag-pill-${tag.toLowerCase()}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/90 text-amber-800 text-xs font-medium rounded-lg"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-amber-600 hover:text-amber-900 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Add custom tag input */}
                <div className="flex items-center gap-1">
                  <input
                    id="editor-custom-tag-input"
                    type="text"
                    placeholder="+ Add tag..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(customTagInput);
                      }
                    }}
                    className="w-24 px-2 py-1 text-xs bg-stone-100 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-400 placeholder:text-stone-400"
                  />
                </div>

                {/* Quick default tag suggestions */}
                <div className="flex flex-wrap gap-1 ml-2">
                  {DEFAULT_TAGS.filter((dt) => !tags.includes(dt)).slice(0, 5).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => handleAddTag(dt)}
                      className="px-2 py-0.5 text-[11px] text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-200 rounded-md border border-stone-200/60 transition-colors cursor-pointer"
                    >
                      +{dt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Gemini AI Companion Panel */}
          {showGeminiPanel && (
            <div className="flex-1 md:w-[42%] border-t md:border-t-0 md:border-l border-stone-200 p-4 sm:p-5 bg-stone-50/50 flex flex-col overflow-hidden">
              <GeminiCompanion
                entry={{
                  id: initialEntry?.id || 'draft',
                  userId,
                  title: title || 'Draft Entry',
                  content,
                  mood,
                  weather,
                  tags,
                  createdAt,
                  updatedAt: new Date().toISOString(),
                  aiSummary,
                  aiInsights,
                  aiMessages
                }}
                userId={userId}
                onUpdateAIMessages={(newMessages) => setAiMessages(newMessages)}
                onApplySummary={(summary, insights) => {
                  setAiSummary(summary);
                  if (insights) setAiInsights(insights);
                }}
              />
            </div>
          )}

        </div>

        {/* Footer Info Bar */}
        <div id="editor-footer" className="px-6 py-3 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-4">
            <span id="editor-word-count">
              <strong>{wordCount}</strong> {wordCount === 1 ? 'word' : 'words'}
            </span>
            <span id="editor-char-count" className="hidden sm:inline">
              <strong>{charCount}</strong> characters
            </span>
            <span id="editor-read-time" className="hidden sm:inline">
              ~{readTimeMin} min read
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Tip: Press <kbd className="px-1 py-0.5 bg-stone-200 rounded text-stone-700 font-mono text-[10px]">Ctrl+S</kbd> to save
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
