import { AIMessage, MoodType } from '../types';

export interface GeminiChatParams {
  message?: string;
  history?: AIMessage[];
  entryTitle?: string;
  entryContent?: string;
  entryMood?: MoodType;
  mode?: 'chat' | 'reflect' | 'summarize' | 'brainstorm';
}

export interface GeminiChatResponse {
  reply: string;
  mode: string;
  isFallback?: boolean;
}

export async function askGeminiReflection(params: GeminiChatParams): Promise<GeminiChatResponse> {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error contacting Gemini API:', error);
    return {
      reply: `I heard your reflection on "${params.entryTitle || 'your day'}". Taking a moment to express your feelings (${params.entryMood || 'peaceful'}) is a powerful mindful practice. What insight feels most prominent to you right now?`,
      mode: params.mode || 'chat',
      isFallback: true
    };
  }
}

export async function generateEntrySummary(title: string, content: string, mood?: string): Promise<{ summary: string; insights: string[] }> {
  try {
    const response = await fetch('/api/gemini/summarize-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content, mood }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return {
      summary: data.summary || 'A thoughtful journal reflection capturing the day\'s experiences.',
      insights: data.insights || []
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      summary: `Reflected on ${title || 'daily experiences'} with mindfulness and personal clarity.`,
      insights: [
        'Documented personal thoughts and emotional state',
        'Took dedicated time for mindful self-reflection'
      ]
    };
  }
}
