import { JournalEntry } from '../types';

export const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    title: 'Morning light through the kitchen window',
    content: `Today started with an exceptionally gentle stillness. Woke up at 6:30 AM before the city truly started stirring. Made a fresh pour-over coffee with Ethiopian beans and sat by the window watching the golden morning light filter through the maple leaves outside.

### Things I observed today:
- The quiet hum of the breeze rustling the blinds.
- The warm steam rising from my favorite ceramic mug.
- A neighborhood cat calmly inspecting the garden fence.

It reminded me how rare and necessary these unfiltered moments of unhurried presence are. So often I rush straight into task lists and notifications. Today, I took 20 deliberate minutes just to breathe and simply be.

*Note to self:* Protect the morning silence. It sets the tone for the entire architecture of the day.`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    mood: 'peaceful',
    weather: 'sunny',
    tags: ['Mindfulness', 'Gratitude', 'Life'],
    isFavorite: true,
    promptUsed: 'What was a small, quiet moment today that brought you unexpected peace or delight?',
    location: 'Home, Kitchen'
  },
  {
    id: 'entry-2',
    title: 'Reflections on finishing the quarterly milestone',
    content: `We wrapped up the final project review this afternoon. The last two weeks felt intense, with endless iterations, but stepping back and seeing everything come together smoothly was deeply gratifying.

Key takeaways from this cycle:
1. **Clear communication beats quick assumptions:** Taking extra minutes to clarify expectations saved hours of rework later.
2. **Rest is part of the work:** Burning the candle at both ends diminished my clarity. The best breakthroughs came after a walk outdoors.
3. **Appreciate the team:** A quick message of genuine gratitude went a long way in keeping morale high.

Tomorrow I'm dedicating time to reorganize my workspace and clear out old notes to make room for new creative ideas.`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    mood: 'grateful',
    weather: 'partly-cloudy',
    tags: ['Work', 'Reflection', 'Goals'],
    isFavorite: false,
    location: 'Studio Desk'
  },
  {
    id: 'entry-3',
    title: 'An evening walk and a sudden summer rain',
    content: `Caught in a sudden warm evening shower while walking through the park. Instead of running for shelter, I put my hood up and just walked with deliberate slowness.

The scent of rain on dry pavement (petrichor) is unmatched. Everything felt washed clean, vibrant, and renewed. I listened to the rhythmic patter on the trees and felt my thoughts untangle.

Sometimes when feeling overwhelmed, the best remedy isn't more thinking—it's sensory immersion in the natural world.`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
    mood: 'reflective',
    weather: 'rainy',
    tags: ['Life', 'Reflection'],
    isFavorite: true,
    promptUsed: 'Describe your current emotional landscape. If your mood were weather, what would it look like?'
  }
];
