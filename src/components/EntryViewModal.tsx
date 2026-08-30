import React, { useState } from 'react';
import { JournalEntry, AIMessage } from '../types';
import { MOOD_CONFIG, WEATHER_CONFIG } from '../data/prompts';
import { GeminiCompanion } from './GeminiCompanion';
import { generateEntrySummary } from '../utils/gemini';
import { 
  X, 
  Edit3, 
  Star, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Printer, 
  Download,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';

interface EntryViewModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateEntryAI?: (entryId: string, aiMessages: AIMessage[], summary?: string, insights?: string[]) => void;
}

export const EntryViewModal: React.FC<EntryViewModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onUpdateEntryAI
}) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'gemini'>('entry');
  const [isSummarizing, setIsSummarizing] = useState(false);

  if (!entry) return null;

  const moodConfig = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.peaceful;
  const weatherConfig = entry.weather ? WEATHER_CONFIG[entry.weather] : null;

  const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  const wordCount = (entry.title + ' ' + entry.content).trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.ceil(wordCount / 200) || 1;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    let md = `# ${entry.title}\n**Date:** ${formattedDate} at ${formattedTime}\n**Mood:** ${moodConfig.label}\n\n${entry.content}`;
    if (entry.aiSummary) {
      md += `\n\n## Gemini Reflection Summary\n${entry.aiSummary}`;
    }
    if (entry.aiMessages && entry.aiMessages.length > 0) {
      md += `\n\n## Conversation with Gemini\n` + entry.aiMessages.map(m => `**${m.role === 'user' ? 'You' : 'Gemini'}:** ${m.content}`).join('\n\n');
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'entry'}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleQuickSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await generateEntrySummary(entry.title, entry.content, moodConfig.label);
      if (onUpdateEntryAI) {
        onUpdateEntryAI(entry.id, entry.aiMessages || [], res.summary, res.insights);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Simple Markdown-like paragraph & block rendering
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-lg font-bold font-serif text-stone-900 mt-5 mb-2">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-xl font-bold font-serif text-stone-900 mt-5 mb-2.5">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-2xl font-bold font-serif text-stone-900 mt-6 mb-3">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} className="border-l-4 border-amber-300 pl-4 py-1.5 my-3 italic text-stone-700 font-serif bg-amber-50/50 rounded-r-lg">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
        const isDone = trimmed.startsWith('- [x] ');
        const taskText = trimmed.replace(/- \[[ x]\] /, '');
        elements.push(
          <div key={idx} className="flex items-center gap-2 my-1.5 text-stone-800 text-sm">
            <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${isDone ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400'}`}>
              {isDone && '✓'}
            </span>
            <span className={isDone ? 'line-through text-stone-400' : ''}>{taskText}</span>
          </div>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={idx} className="ml-5 list-disc my-1 text-stone-800 font-serif text-base">
            {trimmed.substring(2)}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={idx} className="ml-5 list-decimal my-1 text-stone-800 font-serif text-base">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else if (trimmed === '---') {
        elements.push(<hr key={idx} className="my-5 border-stone-200" />);
      } else if (trimmed === '') {
        elements.push(<div key={idx} className="h-2.5" />);
      } else {
        elements.push(
          <p key={idx} className="text-stone-800 font-serif text-base leading-relaxed mb-3">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div 
      id="entry-view-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="entry-view-paper-card"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] transition-all"
      >
        {/* Top Action Bar */}
        <div id="entry-view-header" className="px-5 py-3 border-b border-stone-200/80 bg-stone-50/90 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-3">
            <button
              id="entry-view-close-btn"
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* View vs Gemini Tabs */}
            <div className="flex items-center bg-stone-200/60 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('entry')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'entry' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Journal Entry</span>
              </button>
              <button
                onClick={() => setActiveTab('gemini')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'gemini' ? 'bg-amber-100 text-amber-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-amber-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Gemini Reflection</span>
                {entry.aiMessages && entry.aiMessages.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-[10px] text-amber-900 flex items-center justify-center font-bold">
                    {entry.aiMessages.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Star Favorite */}
            <button
              id="entry-view-favorite-btn"
              onClick={() => onToggleFavorite(entry.id)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                entry.isFavorite
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600'
              }`}
              title={entry.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
            >
              <Star className={`w-3.5 h-3.5 ${entry.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* Print */}
            <button
              id="entry-view-print-btn"
              onClick={handlePrint}
              className="p-1.5 text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-all cursor-pointer"
              title="Print Journal Entry"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Download MD */}
            <button
              id="entry-view-download-btn"
              onClick={handleDownloadMarkdown}
              className="p-1.5 text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-all cursor-pointer"
              title="Export as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Edit Entry */}
            <button
              id="entry-view-edit-btn"
              onClick={() => onEdit(entry)}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer ml-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>

            {/* Delete Entry */}
            <button
              id="entry-view-delete-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this entry?')) {
                  onDelete(entry.id);
                  onClose();
                }
              }}
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Tab Content */}
        {activeTab === 'entry' ? (
          <div id="entry-view-content" className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
            
            {/* Mood & Metadata */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                id="entry-view-mood-pill"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${moodConfig.bg} ${moodConfig.color} ${moodConfig.border}`}
              >
                <span>{moodConfig.emoji}</span>
                <span>{moodConfig.label}</span>
              </span>

              {weatherConfig && (
                <span 
                  id="entry-view-weather-pill"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
                >
                  <span>{weatherConfig.label}</span>
                </span>
              )}

              {entry.location && (
                <span 
                  id="entry-view-location-pill"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200"
                >
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span>{entry.location}</span>
                </span>
              )}

              <span className="text-xs text-stone-400 ml-auto">
                {formattedDate} • {formattedTime} • {wordCount} words
              </span>
            </div>

            {/* Title */}
            <h1 id="entry-view-title" className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-tight">
              {entry.title}
            </h1>

            {/* Prompt Highlight (if used) */}
            {entry.promptUsed && (
              <div id="entry-view-prompt-box" className="p-3.5 bg-amber-50/70 border-l-4 border-amber-400 rounded-r-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Journal Prompt</span>
                </div>
                <p className="text-stone-800 italic font-serif text-sm">
                  "{entry.promptUsed}"
                </p>
              </div>
            )}

            {/* AI Summary Banner (if generated) */}
            {entry.aiSummary ? (
              <div id="entry-view-ai-summary-card" className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-serif text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gemini Reflection Summary</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('gemini')}
                    className="text-[11px] text-amber-800 font-semibold hover:underline flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Open Dialogue</span>
                  </button>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  {entry.aiSummary}
                </p>
                {entry.aiInsights && entry.aiInsights.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {entry.aiInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-stone-600">
                        <Lightbulb className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-stone-700 font-medium">Generate an instant essence summary & mindful takeaways</span>
                </div>
                <button
                  onClick={handleQuickSummarize}
                  disabled={isSummarizing}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isSummarizing ? (
                    <span className="w-3 h-3 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Summarize with Gemini</span>
                </button>
              </div>
            )}

            {/* Entry Body */}
            <div id="entry-view-body-text" className="pt-2 border-t border-stone-100">
              {renderFormattedContent(entry.content)}
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div id="entry-view-tags" className="pt-4 border-t border-stone-200/80 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-stone-400">Tags:</span>
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    id={`entry-view-tag-${tag.toLowerCase()}`}
                    className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-medium rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col">
            <GeminiCompanion
              entry={entry}
              userId={entry.userId || 'user'}
              onUpdateAIMessages={(newMessages) => {
                if (onUpdateEntryAI) {
                  onUpdateEntryAI(entry.id, newMessages, entry.aiSummary, entry.aiInsights);
                }
              }}
              onApplySummary={(summary, insights) => {
                if (onUpdateEntryAI) {
                  onUpdateEntryAI(entry.id, entry.aiMessages || [], summary, insights);
                }
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div id="entry-view-footer" className="px-6 py-2.5 bg-stone-50 border-t border-stone-200/80 text-xs text-stone-400 flex items-center justify-between shrink-0">
          <span>Saved to isolated Cloud Firestore</span>
          {entry.updatedAt !== entry.createdAt && (
            <span>Last updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
          )}
        </div>

      </div>
    </div>
  );
};
