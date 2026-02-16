import type { InstrumentType } from './instrument'

export type NotationFormat = 'alphatex' | 'musicxml' | 'guitar_pro' | 'vexflow_json'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface Song {
  id: string
  title: string
  artist: string | null
  difficulty: Difficulty
  instrumentType: InstrumentType
  format: NotationFormat
  notationData: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface UserProgress {
  id: string
  userId: string
  songId: string
  completionPercent: number
  maxTempoBpm: number | null
  lastPracticedAt: Date | null
  practiceCount: number
}
