export interface PracticeSession {
  id: string
  userId: string
  instrumentId: string
  startedAt: Date
  endedAt: Date | null
  durationSeconds: number | null
  tempoBpm: number | null
  notes: string | null
  tags: string[]
  createdAt: Date
}

export interface PracticeGoal {
  id: string
  userId: string
  instrumentId: string | null
  title: string
  description: string | null
  targetMinutesPerWeek: number
  isActive: boolean
  createdAt: Date
}

export interface MetronomePreset {
  id: string
  userId: string
  name: string
  tempoBpm: number
  beatsPerMeasure: number
  beatUnit: number
  accentPattern: boolean[] | null
  subdivision: number
}
