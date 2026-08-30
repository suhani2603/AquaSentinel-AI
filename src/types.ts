export type MoodType = 'grateful' | 'peaceful' | 'joyful' | 'energized' | 'contemplative' | 'anxious' | 'tired' | 'reflective';

export type WeatherType = 'sunny' | 'partly-cloudy' | 'rainy' | 'cloudy' | 'snowy' | 'windy' | 'starry';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  type?: 'reflection' | 'summary' | 'brainstorm' | 'chat';
}

export interface JournalEntry {
  id: string;
  userId?: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  mood: MoodType;
  weather?: WeatherType;
  tags: string[];
  isFavorite: boolean;
  promptUsed?: string;
  location?: string;
  aiSummary?: string;
  aiInsights?: string[];
  aiMessages?: AIMessage[];
}

export type ViewMode = 'list' | 'grid' | 'calendar';

export interface JournalFilter {
  searchQuery: string;
  selectedMood: MoodType | 'all';
  selectedTag: string | 'all';
  favoritesOnly: boolean;
  startDate?: string;
  endDate?: string;
  sortBy: 'newest' | 'oldest' | 'title';
}

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  topMood: MoodType | null;
  moodCounts: Record<MoodType, number>;
}
