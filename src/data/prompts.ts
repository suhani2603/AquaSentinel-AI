export interface JournalPrompt {
  id: string;
  category: 'Gratitude' | 'Reflection' | 'Mindfulness' | 'Growth' | 'Creativity';
  prompt: string;
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: 'p1',
    category: 'Gratitude',
    prompt: 'What was a small, quiet moment today that brought you unexpected peace or delight?'
  },
  {
    id: 'p2',
    category: 'Gratitude',
    prompt: 'Who is someone in your life you feel thankful for right now, and why?'
  },
  {
    id: 'p3',
    category: 'Gratitude',
    prompt: 'Name three simple sensory experiences today (a sound, a taste, a texture) that you appreciated.'
  },
  {
    id: 'p4',
    category: 'Reflection',
    prompt: 'What was the most meaningful conversation or interaction you had today?'
  },
  {
    id: 'p5',
    category: 'Reflection',
    prompt: 'If you could revisit one hour of this week with fresh eyes, which hour would it be?'
  },
  {
    id: 'p6',
    category: 'Reflection',
    prompt: 'What is something you learned about yourself or others in the past few days?'
  },
  {
    id: 'p7',
    category: 'Mindfulness',
    prompt: 'Describe your current emotional landscape. If your mood were weather, what would it look like?'
  },
  {
    id: 'p8',
    category: 'Mindfulness',
    prompt: 'What tension or worry are you currently holding that you can give yourself permission to release?'
  },
  {
    id: 'p9',
    category: 'Mindfulness',
    prompt: 'What does your body and mind need most right at this exact moment?'
  },
  {
    id: 'p10',
    category: 'Growth',
    prompt: 'What is a small courage step you took recently, or one you want to take tomorrow?'
  },
  {
    id: 'p11',
    category: 'Growth',
    prompt: 'What habit or routine has been serving your well-being recently?'
  },
  {
    id: 'p12',
    category: 'Creativity',
    prompt: 'If you had an entire afternoon completely free with no obligations, what would you make or explore?'
  },
  {
    id: 'p13',
    category: 'Creativity',
    prompt: 'Describe a place that feels like a sanctuary to your imagination.'
  }
];

export const MOOD_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  peaceful: {
    label: 'Peaceful',
    emoji: '🌿',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  grateful: {
    label: 'Grateful',
    emoji: '✨',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  joyful: {
    label: 'Joyful',
    emoji: '☀️',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  energized: {
    label: 'Energized',
    emoji: '⚡',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  contemplative: {
    label: 'Contemplative',
    emoji: '🌊',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200'
  },
  reflective: {
    label: 'Reflective',
    emoji: '📖',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  },
  anxious: {
    label: 'Anxious',
    emoji: '☁️',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  tired: {
    label: 'Tired',
    emoji: '🌙',
    color: 'text-stone-600',
    bg: 'bg-stone-100',
    border: 'border-stone-200'
  }
};

export const WEATHER_CONFIG: Record<string, { label: string; iconName: string }> = {
  sunny: { label: 'Sunny', iconName: 'Sun' },
  'partly-cloudy': { label: 'Partly Cloudy', iconName: 'CloudSun' },
  cloudy: { label: 'Cloudy', iconName: 'Cloud' },
  rainy: { label: 'Rainy', iconName: 'CloudRain' },
  snowy: { label: 'Snowy', iconName: 'Snowflake' },
  windy: { label: 'Windy', iconName: 'Wind' },
  starry: { label: 'Clear Night', iconName: 'Moon' }
};

export const DEFAULT_TAGS = [
  'Gratitude',
  'Reflection',
  'Life',
  'Mindfulness',
  'Ideas',
  'Work',
  'Health',
  'Travel',
  'Memories',
  'Goals'
];
