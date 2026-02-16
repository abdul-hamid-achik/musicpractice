import type { Scale } from '../types/music-theory'

export const SCALES: Omit<Scale, 'id'>[] = [
  // Diatonic
  {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    category: 'diatonic',
    description: 'The most common scale in Western music, bright and happy sounding.',
  },
  {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    category: 'diatonic',
    description: 'The natural minor scale, dark and melancholic.',
  },
  {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    category: 'diatonic',
    description: 'Minor scale with a raised 7th, creating a distinctive exotic sound.',
  },
  {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    category: 'diatonic',
    description: 'Minor scale with raised 6th and 7th, commonly used in jazz.',
  },

  // Pentatonic
  {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    category: 'pentatonic',
    description: 'Five-note scale with a bright, open sound. Great for improvisation.',
  },
  {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    category: 'pentatonic',
    description: 'Five-note minor scale, the foundation of blues and rock soloing.',
  },

  // Blues
  {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    category: 'blues',
    description: 'Minor pentatonic with an added flat 5th (blue note).',
  },
  {
    name: 'Major Blues',
    intervals: [0, 2, 3, 4, 7, 9],
    category: 'blues',
    description: 'Major pentatonic with an added flat 3rd for a bluesy feel.',
  },

  // Modes
  {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    category: 'mode',
    description: 'Minor mode with a raised 6th. Common in jazz, funk, and blues.',
  },
  {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    category: 'mode',
    description: 'Minor mode with a flat 2nd. Spanish and flamenco flavor.',
  },
  {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    category: 'mode',
    description: 'Major mode with a raised 4th. Dreamy and ethereal quality.',
  },
  {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    category: 'mode',
    description: 'Major mode with a flat 7th. Common in rock, blues, and country.',
  },
  {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    category: 'mode',
    description: 'The darkest mode with a flat 2nd and flat 5th. Rarely used as a tonal center.',
  },

  // Exotic
  {
    name: 'Whole Tone',
    intervals: [0, 2, 4, 6, 8, 10],
    category: 'exotic',
    description: 'Symmetrical scale of whole steps. Dreamy, ambiguous sound.',
  },
  {
    name: 'Diminished (Half-Whole)',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    category: 'exotic',
    description: 'Symmetrical eight-note scale alternating half and whole steps.',
  },
  {
    name: 'Diminished (Whole-Half)',
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    category: 'exotic',
    description: 'Symmetrical eight-note scale alternating whole and half steps.',
  },
  {
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    category: 'exotic',
    description: 'All twelve notes. Used for chromatic runs and passing tones.',
  },
  {
    name: 'Hungarian Minor',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    category: 'exotic',
    description: 'Harmonic minor with a raised 4th. Dramatic and Eastern European sound.',
  },
  {
    name: 'Double Harmonic',
    intervals: [0, 1, 4, 5, 7, 8, 11],
    category: 'exotic',
    description: 'Also called Byzantine scale. Middle Eastern and Indian music.',
  },
  {
    name: 'Phrygian Dominant',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    category: 'exotic',
    description: 'Fifth mode of harmonic minor. Flamenco and Middle Eastern music.',
  },
  {
    name: 'Lydian Dominant',
    intervals: [0, 2, 4, 6, 7, 9, 10],
    category: 'exotic',
    description: 'Fourth mode of melodic minor. Used over dominant 7th chords in jazz.',
  },
  {
    name: 'Super Locrian',
    intervals: [0, 1, 3, 4, 6, 8, 10],
    category: 'exotic',
    description: 'Also called Altered scale. Used over altered dominant chords in jazz.',
  },
  {
    name: 'Bebop Dominant',
    intervals: [0, 2, 4, 5, 7, 9, 10, 11],
    category: 'exotic',
    description: 'Mixolydian with added major 7th. Keeps chord tones on strong beats.',
  },
  {
    name: 'Japanese (In Sen)',
    intervals: [0, 1, 5, 7, 10],
    category: 'exotic',
    description: 'Traditional Japanese pentatonic scale with a haunting quality.',
  },
  {
    name: 'Egyptian',
    intervals: [0, 2, 5, 7, 10],
    category: 'exotic',
    description: 'Suspended pentatonic scale with an ancient, modal sound.',
  },
  {
    name: 'Hirajoshi',
    intervals: [0, 4, 6, 7, 11],
    category: 'exotic',
    description: 'Japanese pentatonic scale used in traditional koto music.',
  },
  {
    name: 'Iwato',
    intervals: [0, 1, 5, 6, 10],
    category: 'exotic',
    description: 'Dark Japanese scale, the inverse of Hirajoshi.',
  },
  {
    name: 'Prometheus',
    intervals: [0, 2, 4, 6, 9, 10],
    category: 'exotic',
    description: 'Six-note scale used by Scriabin. Mystic and unresolved quality.',
  },
  {
    name: 'Augmented',
    intervals: [0, 3, 4, 7, 8, 11],
    category: 'exotic',
    description: 'Symmetrical six-note scale built from two augmented triads.',
  },
  {
    name: 'Neapolitan Minor',
    intervals: [0, 1, 3, 5, 7, 8, 11],
    category: 'exotic',
    description: 'Harmonic minor with a flat 2nd. Dark and dramatic.',
  },
  {
    name: 'Neapolitan Major',
    intervals: [0, 1, 3, 5, 7, 9, 11],
    category: 'exotic',
    description: 'Major scale with a flat 2nd. Unusual and majestic.',
  },
  {
    name: 'Persian',
    intervals: [0, 1, 4, 5, 6, 8, 11],
    category: 'exotic',
    description: 'Evokes the sound of traditional Persian music.',
  },
  {
    name: 'Arabian',
    intervals: [0, 2, 4, 5, 6, 8, 10],
    category: 'exotic',
    description: 'Scale commonly associated with Arabian musical traditions.',
  },
  {
    name: 'Balinese',
    intervals: [0, 1, 3, 7, 8],
    category: 'exotic',
    description: 'Pentatonic scale from Balinese gamelan music.',
  },
  {
    name: 'Enigmatic',
    intervals: [0, 1, 4, 6, 8, 10, 11],
    category: 'exotic',
    description: 'Rare scale created by Verdi. Mysterious and ambiguous.',
  },
]
