/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { JournalEntry, ViewMode, MoodType, AIMessage } from './types';
import { getStoredEntries, saveStoredEntries, calculateJournalStats } from './utils/storage';
import { 
  auth, 
  subscribeToUserEntries, 
  saveUserEntryToFirestore, 
  deleteUserEntryFromFirestore, 
  batchSyncEntriesToFirestore,
  signOutUser 
} from './lib/firebase';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { EntryList } from './components/EntryList';
import { CalendarView } from './components/CalendarView';
import { EntryEditor } from './components/EntryEditor';
import { EntryViewModal } from './components/EntryViewModal';
import { AmbientSoundPlayer } from './components/AmbientSoundPlayer';
import { PromptsModal } from './components/PromptsModal';
import { ExportImportModal } from './components/ExportImportModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isFirestoreSynced, setIsFirestoreSynced] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [entries, setEntries] = useState<JournalEntry[]>(() => getStoredEntries());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Modal States
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialPrompt, setEditorInitialPrompt] = useState<string | undefined>(undefined);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsGuestMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!currentUser) {
      setIsFirestoreSynced(false);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (firestoreEntries) => {
        // If user has entries in Firestore, update state
        if (firestoreEntries.length > 0) {
          setEntries(firestoreEntries);
          saveStoredEntries(firestoreEntries);
        } else {
          // If Firestore is empty but user had local demo entries, sync them to Firestore
          const localEntries = getStoredEntries();
          if (localEntries.length > 0) {
            batchSyncEntriesToFirestore(currentUser.uid, localEntries);
          }
        }
        setIsFirestoreSynced(true);
      },
      (error) => {
        console.warn('Firestore subscription notice (using local fallback):', error);
        setIsFirestoreSynced(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Sync to local storage as fallback
  useEffect(() => {
    saveStoredEntries(entries);
  }, [entries]);

  // Derived statistics
  const stats = useMemo(() => calculateJournalStats(entries), [entries]);

  // All unique user tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [entries]);

  // Filtered & Searched entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesContent = entry.content.toLowerCase().includes(q);
        const matchesTag = entry.tags.some((t) => t.toLowerCase().includes(q));
        const matchesLocation = entry.location?.toLowerCase().includes(q);
        const matchesPrompt = entry.promptUsed?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesContent && !matchesTag && !matchesLocation && !matchesPrompt) {
          return false;
        }
      }

      if (selectedMood !== 'all' && entry.mood !== selectedMood) {
        return false;
      }

      if (selectedTag !== 'all' && !entry.tags.includes(selectedTag)) {
        return false;
      }

      if (favoritesOnly && !entry.isFavorite) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, searchQuery, selectedMood, selectedTag, favoritesOnly]);

  // Handlers
  const handleSaveEntry = async (savedEntry: JournalEntry) => {
    const entryWithUser: JournalEntry = {
      ...savedEntry,
      userId: currentUser?.uid || 'guest'
    };

    // Optimistic local update
    const exists = entries.some((e) => e.id === entryWithUser.id);
    const updatedEntries = exists
      ? entries.map((e) => (e.id === entryWithUser.id ? entryWithUser : e))
      : [entryWithUser, ...entries];
    
    setEntries(updatedEntries);
    saveStoredEntries(updatedEntries);
    showToast(exists ? 'Journal entry updated' : 'New journal entry recorded');

    // Cloud Firestore persistence
    if (currentUser) {
      try {
        await saveUserEntryToFirestore(currentUser.uid, entryWithUser);
      } catch (err) {
        console.error('Failed to sync entry to Firestore:', err);
      }
    }

    setIsEditorOpen(false);
    setEditingEntry(null);
    setEditorInitialPrompt(undefined);

    if (viewingEntry && viewingEntry.id === entryWithUser.id) {
      setViewingEntry(entryWithUser);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const updatedEntries = entries.filter((e) => e.id !== id);
    setEntries(updatedEntries);
    saveStoredEntries(updatedEntries);
    setIsEditorOpen(false);
    setViewingEntry(null);
    showToast('Journal entry deleted');

    if (currentUser) {
      try {
        await deleteUserEntryFromFirestore(currentUser.uid, id);
      } catch (err) {
        console.error('Failed to delete entry from Firestore:', err);
      }
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    let targetEntry: JournalEntry | null = null;
    const updated = entries.map((entry) => {
      if (entry.id === id) {
        const nextState = !entry.isFavorite;
        targetEntry = { ...entry, isFavorite: nextState };
        showToast(nextState ? 'Added to favorites' : 'Removed from favorites');
        return targetEntry;
      }
      return entry;
    });

    setEntries(updated);
    saveStoredEntries(updated);

    if (viewingEntry && viewingEntry.id === id) {
      setViewingEntry((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }

    if (currentUser && targetEntry) {
      try {
        await saveUserEntryToFirestore(currentUser.uid, targetEntry);
      } catch (err) {
        console.error('Failed to update favorite status:', err);
      }
    }
  };

  const handleUpdateEntryAI = async (entryId: string, aiMessages: AIMessage[], summary?: string, insights?: string[]) => {
    let updatedEntry: JournalEntry | null = null;
    const updated = entries.map((entry) => {
      if (entry.id === entryId) {
        updatedEntry = {
          ...entry,
          aiMessages,
          aiSummary: summary !== undefined ? summary : entry.aiSummary,
          aiInsights: insights !== undefined ? insights : entry.aiInsights,
          updatedAt: new Date().toISOString()
        };
        return updatedEntry;
      }
      return entry;
    });

    setEntries(updated);
    saveStoredEntries(updated);

    if (viewingEntry && viewingEntry.id === entryId && updatedEntry) {
      setViewingEntry(updatedEntry);
    }

    if (currentUser && updatedEntry) {
      try {
        await saveUserEntryToFirestore(currentUser.uid, updatedEntry);
      } catch (err) {
        console.error('Failed to update entry AI to Firestore:', err);
      }
    }
  };

  const handleOpenNewEntry = (initialPrompt?: string, dateStr?: string) => {
    setEditingEntry(dateStr ? {
      id: `entry-${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      title: '',
      content: '',
      createdAt: new Date(`${dateStr}T12:00:00`).toISOString(),
      updatedAt: new Date().toISOString(),
      mood: 'peaceful',
      weather: 'sunny',
      tags: ['Reflection'],
      isFavorite: false,
      promptUsed: initialPrompt
    } : null);
    setEditorInitialPrompt(initialPrompt);
    setIsEditorOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setViewingEntry(null);
    setEditingEntry(entry);
    setEditorInitialPrompt(entry.promptUsed);
    setIsEditorOpen(true);
  };

  const handleImportEntries = (imported: JournalEntry[]) => {
    setEntries(imported);
    saveStoredEntries(imported);
    if (currentUser) {
      batchSyncEntriesToFirestore(currentUser.uid, imported);
    }
    showToast(`Restored ${imported.length} journal entries`);
  };

  const handleClearAll = () => {
    setEntries([]);
    saveStoredEntries([]);
    showToast('All journal entries have been cleared');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setIsGuestMode(false);
      showToast('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // If initial auth check is loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-600">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-serif text-lg text-stone-800">Opening your personal sanctuary...</p>
      </div>
    );
  }

  // If not logged in and not in guest mode, show the Landing & Login screen
  if (!currentUser && !isGuestMode) {
    return (
      <LandingPage
        onContinueAsGuest={() => setIsGuestMode(true)}
        totalEntriesCount={entries.length}
      />
    );
  }

  return (
    <div id="personal-journal-app" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col antialiased">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="app-toast-notification"
          className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce"
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Header with user auth info */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewEntry={() => handleOpenNewEntry()}
        onOpenPrompts={() => setIsPromptsOpen(true)}
        onOpenAudio={() => setIsAudioOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        isAudioPlaying={isAudioPlaying}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={currentUser}
        onSignOut={handleSignOut}
        isFirestoreSynced={isFirestoreSynced}
      />

      {/* Main Content Area */}
      <main id="main-content-section" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Metric Insights & Filter Pills */}
        <StatsBar
          stats={stats}
          selectedMood={selectedMood}
          onMoodSelect={setSelectedMood}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
          favoritesOnly={favoritesOnly}
          onFavoritesToggle={() => setFavoritesOnly(!favoritesOnly)}
          allTags={allTags}
        />

        {/* View Layout (Grid / Timeline List / Calendar) */}
        {viewMode === 'calendar' ? (
          <CalendarView
            entries={entries}
            onSelectEntry={(entry) => setViewingEntry(entry)}
            onNewEntryForDate={(dateStr) => handleOpenNewEntry(undefined, dateStr)}
          />
        ) : (
          <EntryList
            entries={filteredEntries}
            viewMode={viewMode}
            onSelectEntry={(entry) => setViewingEntry(entry)}
            onToggleFavorite={handleToggleFavorite}
            onNewEntry={() => handleOpenNewEntry()}
            searchQuery={searchQuery}
          />
        )}
      </main>

      {/* Footer */}
      <footer id="app-footer" className="py-6 border-t border-stone-200/80 bg-white text-center text-xs text-stone-400">
        <p>Personal Journal • A quiet space for mindful reflection and Gemini AI introspection</p>
      </footer>

      {/* Entry Editor Modal */}
      {isEditorOpen && (
        <EntryEditor
          initialEntry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingEntry(null);
            setEditorInitialPrompt(undefined);
          }}
          onDelete={handleDeleteEntry}
          initialPrompt={editorInitialPrompt}
          userId={currentUser?.uid || 'guest'}
        />
      )}

      {/* Entry Reader / View Modal */}
      {viewingEntry && (
        <EntryViewModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          onUpdateEntryAI={handleUpdateEntryAI}
        />
      )}

      {/* Ambient Sound Player Modal */}
      <AmbientSoundPlayer
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        onAudioStateChange={setIsAudioPlaying}
      />

      {/* Reflective Prompts Modal */}
      <PromptsModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        onSelectPrompt={(promptText) => {
          handleOpenNewEntry(promptText);
        }}
      />

      {/* Export & Import Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        entries={entries}
        onImportEntries={handleImportEntries}
        onClearAll={handleClearAll}
      />

    </div>
  );
}
