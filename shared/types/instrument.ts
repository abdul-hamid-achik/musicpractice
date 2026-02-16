export type InstrumentType = 'guitar' | 'bass' | 'piano' | 'violin'

export interface Instrument {
  id: string
  name: string
  type: InstrumentType
  tuning: string[] | null
  stringCount: number | null
  fretCount: number | null
  isDefault: boolean
}
