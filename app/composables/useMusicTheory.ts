const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

const FLAT_MAP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
}

export function useMusicTheory() {
  const getNoteNames = () => [...NOTE_NAMES]

  const getNoteIndex = (note: string): number => {
    const normalized = note.replace('\u266F', '#').replace('\u266D', 'b')
    const n = FLAT_MAP[normalized] || normalized
    return NOTE_NAMES.indexOf(n as (typeof NOTE_NAMES)[number])
  }

  const getScaleNotes = (root: string, intervals: number[]): string[] => {
    const rootIdx = getNoteIndex(root)
    return intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]!)
  }

  const getChordNotes = (root: string, intervals: number[]): string[] => {
    const rootIdx = getNoteIndex(root)
    return intervals.map((i) => NOTE_NAMES[(rootIdx + i) % 12]!)
  }

  const getInterval = (note1: string, note2: string): number => {
    const i1 = getNoteIndex(note1)
    const i2 = getNoteIndex(note2)
    return (i2 - i1 + 12) % 12
  }

  const transposeNote = (note: string, semitones: number): string => {
    const idx = getNoteIndex(note)
    return NOTE_NAMES[(idx + semitones + 12) % 12]!
  }

  const noteToMidi = (note: string, octave: number): number => {
    return getNoteIndex(note) + (octave + 1) * 12
  }

  const midiToNote = (midi: number): { note: string; octave: number } => {
    return {
      note: NOTE_NAMES[midi % 12]!,
      octave: Math.floor(midi / 12) - 1,
    }
  }

  return {
    getNoteNames,
    getNoteIndex,
    getScaleNotes,
    getChordNotes,
    getInterval,
    transposeNote,
    noteToMidi,
    midiToNote,
  }
}
