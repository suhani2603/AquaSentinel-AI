import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User as UserIcon, 
  AlertTriangle, 
  RotateCcw, 
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Info,
  Waves
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MonitoringStation, AquaSentinelMessage } from '../types';
import { askAquaSentinel } from '../utils/gemini';
import { formatNumber, getRiskBadgeClasses } from '../utils/hydrology';
import { DataSourceBadge } from './DataSourceBadge';
import { INITIAL_STATIONS } from '../data/stationsData';

interface AssistantViewProps {
  station?: MonitoringStation;
  messages: AquaSentinelMessage[];
  onSendMessage: (msg: AquaSentinelMessage) => void;
  onClearHistory: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  station: propStation,
  messages,
  onSendMessage,
  onClearHistory,
}) => {
  const station = propStation || INITIAL_STATIONS[0];
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const englishQuestions = [
    'Is my area safe right now?',
    'Why is the river rising?',
    "Will today's rainfall increase flood risk?",
    'What should I do if the river level keeps rising?',
    'Explain current water level in simple terms'
  ];

  const hindiQuestions = [
    'क्या मेरा क्षेत्र अभी सुरक्षित है?',
    'नदी का जलस्तर क्यों बढ़ रहा है?',
    'क्या आज की बारिश से बाढ़ का खतरा बढ़ेगा?',
    'यदि नदी का जलस्तर बढ़ता रहे तो मुझे क्या करना चाहिए?',
    'वर्तमान जलस्तर की सरल व्याख्या करें'
  ];

  const suggestedQuestions = language === 'hi' ? hindiQuestions : englishQuestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Voice Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice speech recognition is not supported on this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  const speakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: AquaSentinelMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      stationId: station.id,
      language
    };

    onSendMessage(userMsg);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await askAquaSentinel(query, station, messages, 'chat', language);
      const assistantMsg: AquaSentinelMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        stationId: station.id,
        dataClassification: station.dataMode === 'LIVE' ? 'LIVE' : 'SIMULATION',
        language
      };
      onSendMessage(assistantMsg);
    } catch (err) {
      console.error('Gemini error:', err);
      const errorMsg: AquaSentinelMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: language === 'hi'
          ? 'क्षमा करें, वर्तमान में जल सुरक्षा स्थिति का विश्लेषण करने में समस्या आ रही है। कृपया कुछ क्षणों बाद पुनः प्रयास करें।'
          : 'Unable to connect to Gemini safety model right now. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
        stationId: station.id,
        language
      };
      onSendMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ask-gemini-page" className="max-w-4xl mx-auto space-y-4 animate-fadeIn flex flex-col h-[calc(100vh-12rem)] min-h-[550px]">
      
      {/* Top Bar with Language & Station Context */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                AquaSentinel Gemini Assistant
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                AI Safety Guide
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Answering questions with live hydrological telemetry for <strong>{station.city}</strong>
            </p>
          </div>
        </div>

        {/* Language Selector & Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              🇮🇳 हिन्दी
            </button>
          </div>

          <button
            onClick={onClearHistory}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Scrollable Box */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4 shadow-sm">
        
        {/* Welcome Message if empty */}
        {messages.length === 0 && (
          <div className="py-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'hi' ? 'नमस्ते! मैं आपका जल सुरक्षा सहायक हूँ।' : 'Ask AquaSentinel AI'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {language === 'hi'
                  ? 'आप मुझसे नदी के जलस्तर, बारिश, आगामी बाढ़ के जोखिम या सुरक्षा उपायों के बारे में पूछ सकते हैं।'
                  : 'Ask about river levels, rainfall intensity, flood risks, and citizen safety guidance in simple terms.'}
              </p>
            </div>

            {/* Quick Suggested Questions */}
            <div className="pt-2 space-y-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
                {language === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested Questions'}
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-left font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message History */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm space-y-2 ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none'
                }`}
              >
                {/* AI Header & TTS button */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">AquaSentinel AI</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-[9px] font-mono">
                        {station.dataMode === 'LIVE' ? 'LIVE DATA' : 'SIMULATION'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => speakText(msg.id, msg.content)}
                      className="flex items-center gap-1 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      title={speakingMsgId === msg.id ? 'Stop listening' : 'Listen to response'}
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[10px] text-rose-500 font-bold">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 items-center text-zinc-400 text-xs animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
              <span>{language === 'hi' ? 'विश्लेषण किया जा रहा है...' : 'Analyzing live hydrology telemetry...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box with Voice Mic & Send */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex items-center gap-2 shrink-0">
        
        {/* Voice Input Button */}
        <button
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
          title={isListening ? 'Listening... click to stop' : 'Click to speak'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            language === 'hi'
              ? 'जल स्तर, वर्षा या बाढ़ सुरक्षा से जुड़ा प्रश्न पूछें...'
              : 'Ask a question about river safety, rainfall or flood warnings...'
          }
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
        />

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
