import React, { useState } from 'react';
import { Sparkles, Shield, BookOpen, MessageSquare, Compass, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onSignIn?: () => Promise<void>;
  isLoading?: boolean;
  onContinueAsGuest?: () => void;
  totalEntriesCount?: number;
}

export function LandingPage({ onSignIn, isLoading = false, onContinueAsGuest, totalEntriesCount }: LandingPageProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadingState = isLoading || internalLoading;

  const handleLogin = async () => {
    try {
      setAuthError(null);
      setInternalLoading(true);
      if (onSignIn) {
        await onSignIn();
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // If user closed popup, don't show harsh error
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setAuthError(err?.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div id="landing-page-container" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-200">
      
      {/* Top Navbar */}
      <header id="landing-header" className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-900 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-semibold text-lg tracking-tight text-stone-900">Personal Journal</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-900 font-medium">with Gemini AI</span>
            </div>
          </div>

          <button
            id="landing-header-signin-button"
            onClick={handleLogin}
            disabled={loadingState}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200/80 border border-stone-300/80 rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {loadingState ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-stone-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <GoogleIcon />
            )}
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Features */}
      <main id="landing-hero-section" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/60 border border-stone-300 text-stone-700 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Powered by Gemini 2.5 Flash & Isolated Cloud Firestore</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 max-w-2xl leading-tight sm:leading-tight mb-5">
          A serene space to write, reflect, and discover clarity with Gemini.
        </h1>

        {/* Subtitle */}
        <p className="text-stone-600 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
          Write multi-turn journal entries with an intelligent AI reflection companion. All thoughts, insights, and conversations are safely isolated in your private Firestore database.
        </p>

        {/* Call to Action Button */}
        <div className="w-full max-w-sm flex flex-col items-center gap-3 mb-12">
          <button
            id="landing-hero-cta-button"
            onClick={handleLogin}
            disabled={loadingState}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold text-stone-900 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-xl shadow-xs transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loadingState ? (
              <span className="inline-block w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <GoogleIcon />
            )}
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {onContinueAsGuest && (
            <button
              id="landing-guest-button"
              onClick={onContinueAsGuest}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium underline-offset-4 hover:underline py-1 transition-colors cursor-pointer"
            >
              Continue without signing in (Local guest session)
            </button>
          )}

          <span className="text-xs text-stone-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict user-level isolation in Cloud Firestore</span>
          </span>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs w-full text-left">
              {authError}
            </div>
          )}
        </div>

        {/* 3 Core Pillars */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-6 border-t border-stone-200">
          
          <div id="feature-card-conversations" className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mb-3.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-semibold text-base text-stone-900 mb-1.5">Multi-Turn AI Dialogue</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Converse with Gemini directly about your entries. Ask for constructive perspectives, explore feelings, and brainstorm tomorrow's actions.
            </p>
          </div>

          <div id="feature-card-summaries" className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center justify-center mb-3.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-semibold text-base text-stone-900 mb-1.5">Instant Summaries & Insights</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Transform long stream-of-consciousness writing into clear essence summaries and key emotional takeaways automatically.
            </p>
          </div>

          <div id="feature-card-firestore" className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mb-3.5">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-semibold text-base text-stone-900 mb-1.5">Isolated Cloud Firestore</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every document is secured under your authenticated user ID. Other users cannot query or access your personal journal data.
            </p>
          </div>

        </div>

        {/* Feature checklist */}
        <div className="mt-10 py-4 px-6 rounded-xl bg-stone-100/80 border border-stone-200/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-600 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Realtime Cloud Sync
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Focus Ambient Sounds
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mood & Streak Analytics
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Calendar & Feed Views
          </span>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200/80 bg-white text-center text-xs text-stone-400">
        <p>Personal Journal • Authenticated with Firebase Auth & Cloud Firestore</p>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}
