import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. AI features will return simulated guidance.');
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Multi-turn Gemini AI reflection, conversation, summary, and brainstorming
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { 
      message, 
      history = [], 
      entryTitle = '', 
      entryContent = '', 
      entryMood = '',
      mode = 'chat' // 'chat' | 'reflect' | 'summarize' | 'brainstorm'
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Graceful fallback response when API key is pending configuration
      let fallbackText = '';
      if (mode === 'summarize') {
        fallbackText = `**Summary of your reflection:**\nYou reflected on "${entryTitle || 'your day'}", sharing honest thoughts about your experiences and emotions (${entryMood || 'present moment'}).\n\n**Key Takeaways:**\n- Value in taking time for self-reflection.\n- Clear focus on personal growth and mindfulness.`;
      } else if (mode === 'brainstorm') {
        fallbackText = `Here are 3 constructive journaling ideas based on your reflection:\n1. **Explore the underlying feelings:** What led up to this moment today?\n2. **Gratitude reframe:** What is one unexpected positive outcome you can find?\n3. **Forward action:** What is one small, gentle step you'd like to take tomorrow?`;
      } else {
        fallbackText = `Thank you for sharing this reflection. It takes openness to put your thoughts into words. Notice how you felt writing about "${entryTitle || 'this topic'}"—what stands out to you the most as you look back on it now?`;
      }

      return res.json({
        reply: fallbackText,
        mode,
        isFallback: true
      });
    }

    let systemInstruction = `You are a thoughtful, empathetic, and highly perceptive personal journaling companion and reflection guide.
Your purpose is to help the user reflect deeply, gain emotional clarity, find constructive perspectives, and celebrate their personal growth.
Always maintain a warm, respectful, supportive, and non-judgmental tone.
Use clear formatting with Markdown (paragraphs, bullet points, bold text) when helpful.
Keep responses focused, concise, and meaningful (typically 2-4 well-crafted paragraphs or structured bullet points).`;

    if (mode === 'summarize') {
      systemInstruction += `
The user is requesting a concise, perceptive summary and key insights of their journal entry.
Format your response cleanly:
- A brief 1-2 sentence core reflection summary.
- **Key Realizations & Themes**: 2-3 bullet points identifying central emotions, lessons, or patterns.
- **Mindful Takeaway**: 1 gentle closing thought or question to sit with.`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `
The user is looking for brainstorming ideas, reframing perspectives, or forward-looking prompts based on their journal entry.
Provide 3-4 creative, practical, or mindful suggestions with clear bullet points.`;
    } else if (mode === 'reflect') {
      systemInstruction += `
Provide an empathetic deep reflection on what the user wrote. Acknowledge the nuances of their feelings (Mood: ${entryMood}), highlight their resilience or self-awareness, and offer a gentle inquiry.`;
    }

    // Build context prompt with current entry content and conversation history
    const contextHeader = entryContent 
      ? `[Current Journal Entry Context]\nTitle: ${entryTitle || 'Untitled'}\nMood: ${entryMood || 'Neutral'}\nContent:\n${entryContent}\n\n`
      : '';

    // Convert prior conversation history to format
    const contents: any[] = [];

    // Include context as first user turn if history is empty, or pre-prompt
    if (history.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `${contextHeader}${message || 'Please provide a thoughtful reflection on my journal entry.'}` }]
      });
    } else {
      // First turn includes context
      const firstMsg = history[0];
      contents.push({
        role: firstMsg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: `${contextHeader}${firstMsg.content}` }]
      });

      for (let i = 1; i < history.length; i++) {
        contents.push({
          role: history[i].role === 'assistant' ? 'model' : 'user',
          parts: [{ text: history[i].content }]
        });
      }

      if (message) {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    const reply = response.text || 'I listened carefully to your reflection. What would you like to explore next?';

    res.json({
      reply,
      mode,
      isFallback: false
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process AI reflection',
      reply: 'I apologize, but I encountered a temporary issue while reflecting on your entry. Please try again in a moment.'
    });
  }
});

// Single-shot summarization endpoint
app.post('/api/gemini/summarize-entry', async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    const ai = getGeminiClient();

    if (!ai || !content) {
      return res.json({
        summary: `Reflected on "${title || 'daily thoughts'}" exploring feelings and experiences with mindfulness.`,
        insights: [
          'Recognized personal thoughts and mental space',
          'Documented feelings and meaningful observations'
        ]
      });
    }

    const prompt = `Analyze this journal entry:
Title: ${title || 'Untitled'}
Mood: ${mood || 'Not specified'}
Content:
${content}

Provide:
1. A concise 1-2 sentence essence summary.
2. 2-3 key insights or underlying themes (short bullet points).

Output in JSON format with keys "summary" (string) and "insights" (array of strings).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      res.json({
        summary: parsed.summary || 'A thoughtful journal reflection capturing the day\'s experiences.',
        insights: Array.isArray(parsed.insights) ? parsed.insights : []
      });
    } catch {
      res.json({
        summary: response.text || 'A thoughtful reflection on personal experiences.',
        insights: []
      });
    }
  } catch (error: any) {
    console.error('Summarize error:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      summary: 'Self-reflection recorded in journal.',
      insights: []
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
