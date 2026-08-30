import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, RefreshCw, Lightbulb, FileText, MessageCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { AIMessage, JournalEntry, MoodType } from '../types';
import { askGeminiReflection } from '../utils/gemini';

interface GeminiCompanionProps {
  entry: Partial<JournalEntry>;
  userId: string;
  onUpdateAIMessages?: (messages: AIMessage[], summary?: string, insights?: string[]) => void;
  onApplySummary?: (summary: string, insights: string[]) => void;
  compact?: boolean;
}

export function GeminiCompanion({
  entry,
  userId,
  onUpdateAIMessages,
  onApplySummary,
  compact = false
}: GeminiCompanionProps) {
  const [messages, setMessages] = useState<AIMessage[]>(entry.aiMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'reflect' | 'summarize' | 'brainstorm' | 'chat'>('reflect');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync if entry prop changes
  useEffect(() => {
    if (entry.aiMessages && entry.aiMessages.length > 0) {
      setMessages(entry.aiMessages);
    }
  }, [entry.id, entry.aiMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string, modeOverride?: 'reflect' | 'summarize' | 'brainstorm' | 'chat') => {
    const text = textToSend !== undefined ? textToSend : input.trim();
    const mode = modeOverride || activeMode;

    if (!text && mode === 'chat') return;
    if (isLoading) return;

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text || (mode === 'summarize' ? 'Please summarize my entry and extract key insights.' : mode === 'brainstorm' ? 'Please brainstorm constructive perspectives and next steps.' : 'Please provide a mindful reflection on what I wrote.'),
      createdAt: new Date().toISOString(),
      type: mode
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askGeminiReflection({
        message: text,
        history: messages,
        entryTitle: entry.title,
        entryContent: entry.content,
        entryMood: entry.mood as MoodType,
        mode
      });

      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.reply,
        createdAt: new Date().toISOString(),
        type: mode
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      // If user asked to summarize, check if we can update summary metadata
      if (mode === 'summarize' && onApplySummary) {
        onApplySummary(response.reply, []);
      }

      if (onUpdateAIMessages) {
        onUpdateAIMessages(finalMessages);
      }
    } catch (err) {
      console.error('Error asking Gemini:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: 'Reflect on my day', mode: 'reflect' as const, text: 'What mindful reflections and emotional nuances do you observe in my entry?' },
    { label: 'Summarize essence', mode: 'summarize' as const, text: 'Please summarize this entry and extract 2-3 key insights.' },
    { label: 'Brainstorm next steps', mode: 'brainstorm' as const, text: 'What are 3 constructive, gentle action ideas or journaling prompts for tomorrow?' },
    { label: 'Find hidden positives', mode: 'chat' as const, text: 'Help me find an unexpected positive or opportunity for growth in this situation.' }
  ];

  return (
    <div id="gemini-companion-panel" className="flex flex-col h-full bg-stone-50/70 rounded-2xl border border-stone-200/90 overflow-hidden">
      
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-white border-b border-stone-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 font-serif flex items-center gap-1.5">
              <span>Gemini Reflection Companion</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-amber-100/80 text-amber-900 rounded">2.5 Flash</span>
            </h4>
            <p className="text-[10px] text-stone-500">Multi-turn reflection & insights saved in Firestore</p>
          </div>
        </div>

        {/* Mode selector pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveMode('reflect')}
            className={`px-2 py-1 rounded-md font-medium transition-all ${
              activeMode === 'reflect' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Reflect
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('summarize')}
            className={`px-2 py-1 rounded-md font-medium transition-all ${
              activeMode === 'summarize' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('brainstorm')}
            className={`px-2 py-1 rounded-md font-medium transition-all ${
              activeMode === 'brainstorm' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Brainstorm
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-3.5 py-2 bg-stone-100/60 border-b border-stone-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading || !entry.content}
            onClick={() => {
              setActiveMode(qp.mode);
              handleSendMessage(qp.text, qp.mode);
            }}
            className="shrink-0 text-[11px] px-2.5 py-1 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-stone-700 hover:text-amber-900 rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 min-h-[160px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4">
            <div className="w-10 h-10 rounded-full bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-800 mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-stone-800 font-serif mb-1">
              Ready to explore your thoughts
            </p>
            <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
              Ask Gemini to reflect on your journal entry, generate an essence summary, or brainstorm constructive takeaways.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-2xs relative group ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-stone-100 rounded-tr-xs'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-xs'
                }`}
              >
                {/* Message Header tag if type */}
                {msg.type && msg.role === 'assistant' && (
                  <div className="text-[10px] font-mono font-medium text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{msg.type}</span>
                  </div>
                )}

                {/* Message Text formatted */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Footer timestamp & copy */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-60">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-0.5 rounded text-stone-500 hover:text-stone-900"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2.5 justify-start items-center">
            <div className="w-6 h-6 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-500 flex items-center gap-2 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-150"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-300"></span>
              <span className="text-[11px] ml-1 font-serif text-stone-600">Gemini is reflecting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2.5 sm:p-3 bg-white border-t border-stone-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeMode === 'reflect'
              ? 'Ask for reflections or perspectives...'
              : activeMode === 'summarize'
              ? 'Request a summary focus...'
              : 'Brainstorm or ask a question...'
          }
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-stone-900 placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !entry.content)}
          className="px-3.5 py-2 bg-amber-300 hover:bg-amber-400 text-stone-900 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
        >
          <Send className="w-3 h-3" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

    </div>
  );
}
