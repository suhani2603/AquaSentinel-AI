import React, { useState } from 'react';
import { JOURNAL_PROMPTS, JournalPrompt } from '../data/prompts';
import { Sparkles, X, Plus, Shuffle } from 'lucide-react';

interface PromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

const CATEGORIES = ['All', 'Gratitude', 'Reflection', 'Mindfulness', 'Growth', 'Creativity'] as const;

export const PromptsModal: React.FC<PromptsModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [randomPrompt, setRandomPrompt] = useState<JournalPrompt | null>(null);

  if (!isOpen) return null;

  const filteredPrompts = selectedCategory === 'All'
    ? JOURNAL_PROMPTS
    : JOURNAL_PROMPTS.filter((p) => p.category === selectedCategory);

  const handlePickRandom = () => {
    const list = selectedCategory === 'All' 
      ? JOURNAL_PROMPTS 
      : JOURNAL_PROMPTS.filter((p) => p.category === selectedCategory);
    const chosen = list[Math.floor(Math.random() * list.length)];
    setRandomPrompt(chosen);
  };

  return (
    <div 
      id="prompts-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="prompts-modal-card"
        className="w-full max-w-2xl bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 id="prompts-modal-title" className="text-base font-bold text-stone-900 font-sans-ui">
                Reflective Journal Prompts
              </h3>
              <p className="text-xs text-stone-500">Spark inspiration and unblock your thoughts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="prompts-shuffle-btn"
              onClick={handlePickRandom}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Surprise Me</span>
            </button>
            <button
              id="prompts-modal-close-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="px-6 py-3 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`prompt-cat-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Random Prompt (if clicked) */}
        {randomPrompt && (
          <div className="mx-6 mt-4 p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
                Random Pick ({randomPrompt.category})
              </span>
              <p className="text-sm font-serif-journal font-medium text-stone-900 mt-0.5">
                "{randomPrompt.prompt}"
              </p>
            </div>
            <button
              id="random-prompt-use-btn"
              onClick={() => {
                onSelectPrompt(randomPrompt.prompt);
                onClose();
              }}
              className="shrink-0 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Use This
            </button>
          </div>
        )}

        {/* Prompts List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredPrompts.map((p) => (
            <div
              key={p.id}
              id={`prompt-item-${p.id}`}
              className="group p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50/90 transition-all flex items-center justify-between gap-4"
            >
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mb-1.5 border border-amber-200/60">
                  {p.category}
                </span>
                <p className="text-sm sm:text-base font-serif-journal text-stone-800">
                  "{p.prompt}"
                </p>
              </div>

              <button
                id={`prompt-use-btn-${p.id}`}
                onClick={() => {
                  onSelectPrompt(p.prompt);
                  onClose();
                }}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
