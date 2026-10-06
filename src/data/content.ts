export const site = {
  name: 'Wormear',
  promise: 'Turn people who wish they could play into people who actually play.',
  tagline: 'Learn piano by playing — 10 minutes a day with Melody the earthworm.',
  philosophy: ['Learn', 'Practice', 'Play', 'Progress', 'Repeat'] as const,
};

export const stats = [
  { value: '10 min', label: 'bite-size daily lessons' },
  { value: '96%*', label: 'stick with it past week 2' },
  { value: '40+', label: 'songs in the starter library' },
  { value: '5', label: 'playful practice games' },
];

export const pressLogos = ['PianoParent', 'Keys&Kids', 'PracticeDaily', 'MusicMadeFun', 'EdTech Weekly'];

export const howItWorks = [
  {
    step: '1',
    title: 'Learn',
    text: 'Watch a 2-minute playful explainer, then tap it out on on-screen keys. No sheet-music fear — Melody guides every note.',
    icon: 'BookOpen',
  },
  {
    step: '2',
    title: 'Practice',
    text: 'Play tiny loops in Note Rush and Rhythm games. Instant feedback, zero judgment, streak-safe retries.',
    icon: 'Target',
  },
  {
    step: '3',
    title: 'Play',
    text: 'Perform real songs from lesson one — Ode to Joy, Twinkle, Happy Birthday. Record and share your take.',
    icon: 'MusicNote',
  },
  {
    step: '4',
    title: 'Progress & Repeat',
    text: 'Earn XP, level up Melody, keep your streak alive. The path always shows your next 10-minute win.',
    icon: 'TrendUp',
  },
];

export const gamification = [
  { title: '+XP for every note', text: 'Correct notes, rhythm and consistency all earn XP. Combos multiply it — practicing feels like scoring.', icon: 'Lightning' },
  { title: 'Streaks that stick', text: 'Daily goals from 5 minutes. Streak freeze protects sick days. 96%* of starters reach week two.', icon: 'Flame' },
  { title: 'Melody evolves', text: 'Your earthworm companion grows accessories and glows as you level from Egg → Hatchling → Headliner.', icon: 'Bug' },
  { title: 'Achievements & leagues', text: 'Badges for first song, perfect rhythm, 7-day streak. Friendly weekly leagues — never pay-to-win.', icon: 'Trophy' },
];

export const curriculumUnits = [
  { title: 'First Sounds', desc: 'High vs low, loud vs soft, finding middle C.', lessons: 8, status: 'done' as const },
  { title: 'Right-Hand Melodies', desc: 'Ode to Joy & Twinkle with finger numbers.', lessons: 12, status: 'done' as const },
  { title: 'Left Hand Joins', desc: 'Simple bass notes, hand-together patterns.', lessons: 10, status: 'current' as const },
  { title: 'Chords & Rhythm', desc: 'C / G / F chords, keeping the beat.', lessons: 12, status: 'locked' as const },
  { title: 'Play Full Songs', desc: 'Happy Birthday + your first performance.', lessons: 9, status: 'locked' as const },
];

export type GameStatus = 'in-mvp' | 'coming';
export const games: { name: string; desc: string; status: GameStatus; best: string }[] = [
  { name: 'Note Rush', desc: 'Catch falling notes before they splash. Trains instant note reading.', status: 'in-mvp', best: 'Reading speed' },
  { name: 'Chord Challenge', desc: 'Shape C, F and G chords against the clock. Streak bonuses for clean changes.', status: 'in-mvp', best: 'Chord shapes' },
  { name: 'Rhythm Garden', desc: 'Tap the beat to water Melody’s garden. From quarter notes to syncopation.', status: 'in-mvp', best: 'Timing' },
  { name: 'Sight-Reading Sprint', desc: 'Brand-new 4-bar melodies every run, graded kindly. Spaced repetition built in.', status: 'coming', best: 'Fluency' },
  { name: 'Song Mode', desc: 'Full backing band, karaoke-style note highway, record & share your performance.', status: 'coming', best: 'Performance' },
];

export const songs = [
  { title: 'Ode to Joy', composer: 'Beethoven', difficulty: 'Starter' as const, minutes: 6, color: '#3B2665', glyph: '♪' },
  { title: 'Twinkle Twinkle', composer: 'Traditional', difficulty: 'Starter' as const, minutes: 5, color: '#FF6B4A', glyph: '✦' },
  { title: 'Happy Birthday', composer: 'Traditional', difficulty: 'Easy' as const, minutes: 8, color: '#D55236', glyph: '♫' },
  { title: 'Lightly Row', composer: 'Traditional', difficulty: 'Easy' as const, minutes: 7, color: '#B97F0A', glyph: '♩' },
  { title: 'River Flows (simplified)', composer: 'Inspired study', difficulty: 'Medium' as const, minutes: 12, color: '#3B2665', glyph: '𝄞' },
];

export const instruments = [
  { name: 'Piano', status: 'Live now', live: true, text: 'Full curriculum, games and song library. On-screen keys or any MIDI keyboard.' },
  { name: 'Guitar', status: 'Coming soon', live: false, text: 'Strum-along path with chord games. Join the waitlist in the app.' },
  { name: 'Drums', status: 'Coming soon', live: false, text: 'Pad-friendly rhythm trainer built on Rhythm Garden.' },
  { name: 'Vocals', status: 'Coming soon', live: false, text: 'Pitch garden: sing in tune with Melody as your coach.' },
];

export const plans = [
  {
    id: 'free',
    name: 'Wormear Free',
    monthly: 0,
    yearly: 0,
    blurb: 'Start playing today — free forever.',
    cta: 'Start free',
    features: ['1 lesson path + daily game', 'Note Rush & Rhythm Garden', '3 starter songs', 'Streak + XP tracking', 'Melody companion (Egg stage)'],
  },
  {
    id: 'premium',
    name: 'Wormear Premium',
    monthly: 9.99,
    yearly: 59.99,
    blurb: 'Unlimited lessons, songs and streak protection.',
    cta: 'Go Premium',
    popular: true,
    features: [
      'Everything in Free, unlimited',
      'Full 40+ song library + monthly drops',
      'All 5 practice games incl. Song Mode',
      'MIDI keyboard support + offline mode',
      'Streak freeze, custom goals, family profiles',
      'Melody evolves to Headliner',
    ],
  },
];

export const testimonials = [
  { name: 'Priya, 29', role: 'Restarted after 15 years', quote: 'I wished I could play for a decade. Wormear got me through my first full song in nine days — ten minutes on my lunch break.', detail: 'Level 6 · 21-day streak' },
  { name: 'Marcus, dad of two', role: 'Kids ages 7 & 10', quote: 'Practice used to be a negotiation. Now they race to keep the worm’s streak alive. I steal the iPad after bedtime.', detail: 'Family plan · 34-day streak' },
  { name: 'Elena, 54', role: 'Total beginner', quote: 'No shame, no theory lectures. Just play, get stars, repeat. My granddaughter and I duet over video call now.', detail: 'Level 9 · First recital done' },
];

export const faqs = [
  { q: 'Do I need a piano to start?', a: 'No. Every lesson works with tap-anywhere on-screen keys. When you’re ready, any 49+ key keyboard — or a MIDI keyboard for note detection — makes it even better.' },
  { q: 'Do you support MIDI keyboards?', a: 'Yes — Premium detects notes over USB-MIDI in the browser and app, with latency calibration and kind grading. Free tier works fully without MIDI.' },
  { q: 'Is Wormear good for kids?', a: 'Absolutely. Big targets, kind feedback, no fail states, and Melody the earthworm cheers every attempt. Parents get weekly progress emails and practice goals.' },
  { q: 'I can’t read sheet music. Is that OK?', a: 'Perfect — most starters can’t. We teach by ear + finger numbers + light-up keys first, then sneak in reading through games so it never feels academic.' },
  { q: 'How much time does it take?', a: 'Ten minutes a day is the default goal. Lessons are 5–10 minutes; streaks reward consistency over marathons.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Monthly or yearly Premium cancels in two taps, you keep access until the period ends, and your XP, songs and streak history stay saved.' },
];

export const footerCols = [
  { title: 'Product', links: ['How it works', 'Practice games', 'Song library', 'Pricing', 'MIDI setup'] },
  { title: 'Company', links: ['Our method', 'About Melody', 'Careers', 'Press kit', 'Contact'] },
  { title: 'Resources', links: ['Blog', 'Help center', 'Parent guide', 'Teacher toolkit', 'Status'] },
];

export const footnote = '*Illustrative launch stats shown for design preview; real learner data will replace them after public beta.';
