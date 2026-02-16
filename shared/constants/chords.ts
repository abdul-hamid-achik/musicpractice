import type { Chord } from '../types/music-theory'

export const CHORDS: Omit<Chord, 'id' | 'voicings' | 'instrumentType'>[] = [
  {
    name: 'Major',
    symbol: 'maj',
    intervals: [0, 4, 7],
  },
  {
    name: 'Minor',
    symbol: 'm',
    intervals: [0, 3, 7],
  },
  {
    name: 'Dominant 7th',
    symbol: '7',
    intervals: [0, 4, 7, 10],
  },
  {
    name: 'Major 7th',
    symbol: 'maj7',
    intervals: [0, 4, 7, 11],
  },
  {
    name: 'Minor 7th',
    symbol: 'm7',
    intervals: [0, 3, 7, 10],
  },
  {
    name: 'Diminished',
    symbol: 'dim',
    intervals: [0, 3, 6],
  },
  {
    name: 'Augmented',
    symbol: 'aug',
    intervals: [0, 4, 8],
  },
  {
    name: 'Suspended 2nd',
    symbol: 'sus2',
    intervals: [0, 2, 7],
  },
  {
    name: 'Suspended 4th',
    symbol: 'sus4',
    intervals: [0, 5, 7],
  },
  {
    name: 'Add 9',
    symbol: 'add9',
    intervals: [0, 4, 7, 14],
  },
  {
    name: 'Minor 7 Flat 5',
    symbol: 'm7b5',
    intervals: [0, 3, 6, 10],
  },
  {
    name: 'Diminished 7th',
    symbol: 'dim7',
    intervals: [0, 3, 6, 9],
  },
  {
    name: 'Augmented 7th',
    symbol: 'aug7',
    intervals: [0, 4, 8, 10],
  },
  {
    name: 'Major 6th',
    symbol: '6',
    intervals: [0, 4, 7, 9],
  },
  {
    name: 'Minor 6th',
    symbol: 'm6',
    intervals: [0, 3, 7, 9],
  },
  {
    name: 'Dominant 9th',
    symbol: '9',
    intervals: [0, 4, 7, 10, 14],
  },
  {
    name: 'Minor 9th',
    symbol: 'm9',
    intervals: [0, 3, 7, 10, 14],
  },
  {
    name: 'Dominant 13th',
    symbol: '13',
    intervals: [0, 4, 7, 10, 14, 21],
  },
  {
    name: 'Power Chord',
    symbol: '5',
    intervals: [0, 7],
  },
  {
    name: 'Minor Major 7th',
    symbol: 'mMaj7',
    intervals: [0, 3, 7, 11],
  },
]
