import { JournalEntry, JournalStats, MoodType } from '../types';
import { INITIAL_ENTRIES } from '../data/initialData';

const STORAGE_KEY = 'personal_journal_entries_v1';

export function getStoredEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
      return INITIAL_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_ENTRIES;
  } catch (error) {
    console.error('Failed to parse entries from localStorage', error);
    return INITIAL_ENTRIES;
  }
}

export function saveStoredEntries(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save entries to localStorage', error);
  }
}

export function calculateJournalStats(entries: JournalEntry[]): JournalStats {
  const totalEntries = entries.length;
  let totalWords = 0;

  const moodCounts: Record<MoodType, number> = {
    grateful: 0,
    peaceful: 0,
    joyful: 0,
    energized: 0,
    contemplative: 0,
    anxious: 0,
    tired: 0,
    reflective: 0
  };

  const datesSet = new Set<string>();

  entries.forEach((e) => {
    // Count words
    const words = (e.title + ' ' + e.content).trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;

    // Mood count
    if (moodCounts[e.mood] !== undefined) {
      moodCounts[e.mood]++;
    }

    // Date tracking for streak (YYYY-MM-DD)
    const dateStr = new Date(e.createdAt).toISOString().split('T')[0];
    datesSet.add(dateStr);
  });

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;

  if (datesSet.size > 0) {
    const sortedDates = Array.from(datesSet).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if streak includes today or yesterday
    let checkDate = sortedDates.includes(today) ? new Date(today) : (sortedDates.includes(yesterday) ? new Date(yesterday) : null);

    if (checkDate) {
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (datesSet.has(dStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // Longest streak calculation
    const allSorted = Array.from(datesSet).sort();
    let tempStreak = 0;
    let prevTime = 0;

    for (const d of allSorted) {
      const time = new Date(d).getTime();
      if (prevTime === 0) {
        tempStreak = 1;
      } else if (time - prevTime === 86400000) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevTime = time;
    }
  }

  // Find top mood
  let topMood: MoodType | null = null;
  let maxMoodCount = 0;
  for (const [m, count] of Object.entries(moodCounts) as [MoodType, number][]) {
    if (count > maxMoodCount) {
      maxMoodCount = count;
      topMood = m;
    }
  }

  return {
    totalEntries,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalWords,
    topMood,
    moodCounts
  };
}

export function exportEntriesAsJSON(entries: JournalEntry[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `personal-journal-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportEntriesAsMarkdown(entries: JournalEntry[]): void {
  let mdContent = `# Personal Journal Archive\n*Exported on ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}*\n\n---\n\n`;

  entries.forEach((e) => {
    const formattedDate = new Date(e.createdAt).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    mdContent += `## ${e.title || 'Untitled Entry'}\n`;
    mdContent += `**Date:** ${formattedDate} | **Mood:** ${e.mood} ${e.weather ? `| **Weather:** ${e.weather}` : ''}\n`;
    if (e.tags.length > 0) {
      mdContent += `**Tags:** ${e.tags.map((t) => `#${t}`).join(' ')}\n`;
    }
    if (e.promptUsed) {
      mdContent += `> *Prompt: ${e.promptUsed}*\n`;
    }
    mdContent += `\n${e.content}\n\n---\n\n`;
  });

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `personal-journal-archive-${new Date().toISOString().split('T')[0]}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
