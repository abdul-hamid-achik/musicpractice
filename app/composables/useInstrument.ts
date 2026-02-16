import { computed, type Ref } from 'vue'
import { TUNINGS } from '#shared/constants/tunings'
import { useMusicTheory } from './useMusicTheory'

export function useInstrument(instrumentType: Ref<string>, tuningKey?: Ref<string>) {
  const { transposeNote } = useMusicTheory()

  const getCurrentTuning = computed(() => {
    const type = instrumentType.value as keyof typeof TUNINGS
    const tunings = TUNINGS[type]
    if (!tunings) return null
    const key = tuningKey?.value || 'standard'
    if (type === 'bass') return (tunings as any)[key] || tunings.standard4
    return (tunings as any)[key] || (tunings as any).standard
  })

  const parseNote = (noteStr: string) => {
    const match = noteStr.match(/^([A-G][#b]?)(\d)$/)
    return match ? { note: match[1], octave: parseInt(match[2]) } : null
  }

  const getFretNote = (stringNote: string, fret: number): string => {
    const parsed = parseNote(stringNote)
    if (!parsed) return ''
    return transposeNote(parsed.note, fret)
  }

  const getStringNotes = (stringNote: string, fretCount: number): string[] => {
    return Array.from({ length: fretCount + 1 }, (_, fret) => getFretNote(stringNote, fret))
  }

  const getAllFretboardNotes = (fretCount: number = 24) => {
    const tuning = getCurrentTuning.value
    if (!tuning) return []
    return tuning.map((stringNote: string) => getStringNotes(stringNote, fretCount))
  }

  return { getCurrentTuning, parseNote, getFretNote, getStringNotes, getAllFretboardNotes }
}
