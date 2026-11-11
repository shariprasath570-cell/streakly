export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Motivation gets you going, but habit keeps you growing.", author: "John C. Maxwell" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "It's not what we do once in a while that shapes our lives, but what we do consistently.", author: "Tony Robbins" },
  { text: "Consistency is what transforms average into excellence.", author: "Tony Robbins" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Every action you take is a vote for the person you wish to become.", author: "James Clear" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Persistence is the twin sister of excellence.", author: "Marabel Morgan" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Progress isn't always visible, but it is always happening when you show up.", author: "Unknown" },
  { text: "The best way to predict your future is to create it.", author: "Peter Drucker" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Slow progress is still progress. Keep going.", author: "Unknown" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
  { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "Great things are not done by impulse, but by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "Make it so easy you can't say no.", author: "Leo Babauta" },
  { text: "You will never always be motivated. You must learn to be disciplined.", author: "Unknown" },
  { text: "Show up, especially on the days you don't feel like it.", author: "Unknown" },
];

/** Deterministic daily quote — the same quote for everyone all day, then a new one. */
export function quoteForDay(date = new Date()): Quote {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const index = ((dayOfYear % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[index];
}
