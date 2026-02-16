import type { InstrumentType } from './instrument'

export interface Scale {
  id: string
  name: string
  intervals: number[]
  category: string
  description: string
}

export interface Chord {
  id: string
  name: string
  symbol: string
  intervals: number[]
  voicings: Record<string, number[][]> | null
  instrumentType: InstrumentType | null
}

export interface Note {
  name: string
  octave: number
  midi: number
}

export interface Interval {
  name: string
  shortName: string
  semitones: number
}
