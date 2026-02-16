export interface TuningPreset {
  name: string
  notes: string[]
  category: 'standard' | 'drop' | 'open' | 'alternate' | 'special'
}

export const GUITAR_TUNINGS: TuningPreset[] = [
  // Standard
  { name: 'E Standard', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'standard' },

  // Alternate Standard
  { name: 'Eb Standard', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'], category: 'alternate' },
  { name: 'D Standard', notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'alternate' },
  { name: 'C# Standard', notes: ['Db2', 'Gb2', 'B2', 'E3', 'Ab3', 'Db4'], category: 'alternate' },
  { name: 'C Standard', notes: ['C2', 'F2', 'Bb2', 'Eb3', 'G3', 'C4'], category: 'alternate' },
  { name: 'B Standard', notes: ['B1', 'E2', 'A2', 'D3', 'F#3', 'B3'], category: 'alternate' },
  { name: 'A Standard', notes: ['A1', 'D2', 'G2', 'C3', 'E3', 'A3'], category: 'alternate' },

  // Drop Tunings
  { name: 'Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'drop' },
  { name: 'Drop C#', notes: ['Db2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'], category: 'drop' },
  { name: 'Drop C', notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'drop' },
  { name: 'Drop B', notes: ['B1', 'F#2', 'B2', 'E3', 'G#3', 'C#4'], category: 'drop' },
  { name: 'Drop Bb', notes: ['Bb1', 'F2', 'Bb2', 'Eb3', 'G3', 'C4'], category: 'drop' },
  { name: 'Drop A', notes: ['A1', 'E2', 'A2', 'D3', 'F#3', 'B3'], category: 'drop' },
  { name: 'Double Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], category: 'drop' },

  // Open Tunings
  { name: 'Open D', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], category: 'open' },
  { name: 'Open E', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], category: 'open' },
  { name: 'Open G', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], category: 'open' },
  { name: 'Open A', notes: ['E2', 'A2', 'C#3', 'E3', 'A3', 'E4'], category: 'open' },
  { name: 'Open C', notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], category: 'open' },
  { name: 'Open D Minor', notes: ['D2', 'A2', 'D3', 'F3', 'A3', 'D4'], category: 'open' },
  { name: 'Open E Minor', notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], category: 'open' },
  { name: 'Open G Minor', notes: ['D2', 'G2', 'D3', 'G3', 'Bb3', 'D4'], category: 'open' },

  // Special / Modal
  { name: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], category: 'special' },
  { name: 'FACGCE', notes: ['F2', 'A2', 'C3', 'G3', 'C4', 'E4'], category: 'special' },
  { name: 'All Fourths', notes: ['E2', 'A2', 'D3', 'G3', 'C4', 'F4'], category: 'special' },
  { name: 'New Standard (Fripp)', notes: ['C2', 'G2', 'D3', 'A3', 'E4', 'G4'], category: 'special' },
  { name: 'CGCGCE', notes: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], category: 'special' },
  { name: 'CGDGBD', notes: ['C2', 'G2', 'D3', 'G3', 'B3', 'D4'], category: 'special' },
  { name: 'CGDGBE', notes: ['C2', 'G2', 'D3', 'G3', 'B3', 'E4'], category: 'special' },
  { name: 'G6 (DGDGBE)', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'E4'], category: 'special' },
  { name: 'DADEAE', notes: ['D2', 'A2', 'D3', 'E3', 'A3', 'E4'], category: 'special' },
  { name: 'DADEAD', notes: ['D2', 'A2', 'D3', 'E3', 'A3', 'D4'], category: 'special' },
]

export const SEVEN_STRING_TUNINGS: TuningPreset[] = [
  { name: '7-String Standard', notes: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'standard' },
  { name: '7-String Drop A', notes: ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], category: 'drop' },
  { name: '7-String A Standard', notes: ['A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4'], category: 'alternate' },
]

export const BASS_TUNINGS: Record<number, TuningPreset[]> = {
  4: [
    { name: '4-String Standard', notes: ['E1', 'A1', 'D2', 'G2'], category: 'standard' },
    { name: '4-String Drop D', notes: ['D1', 'A1', 'D2', 'G2'], category: 'drop' },
    { name: '4-String Eb Standard', notes: ['Eb1', 'Ab1', 'Db2', 'Gb2'], category: 'alternate' },
    { name: '4-String D Standard', notes: ['D1', 'G1', 'C2', 'F2'], category: 'alternate' },
    { name: '4-String C Standard', notes: ['C1', 'F1', 'Bb1', 'Eb2'], category: 'alternate' },
    { name: '4-String Drop C', notes: ['C1', 'A1', 'D2', 'G2'], category: 'drop' },
    { name: '4-String Drop B', notes: ['B0', 'F#1', 'B1', 'E2'], category: 'drop' },
  ],
  5: [
    { name: '5-String Standard', notes: ['B0', 'E1', 'A1', 'D2', 'G2'], category: 'standard' },
    { name: '5-String High C', notes: ['E1', 'A1', 'D2', 'G2', 'C3'], category: 'standard' },
    { name: '5-String Drop A', notes: ['A0', 'E1', 'A1', 'D2', 'G2'], category: 'drop' },
    { name: '5-String Eb Standard', notes: ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2'], category: 'alternate' },
  ],
  6: [
    { name: '6-String Standard', notes: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'], category: 'standard' },
  ],
}

// Keep legacy export for backwards compatibility
export const TUNINGS = {
  guitar: {
    standard: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    dropD: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    dadgad: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
    openG: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    openD: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
    halfStepDown: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
  },
  bass: {
    standard4: ['E1', 'A1', 'D2', 'G2'],
    standard5: ['B0', 'E1', 'A1', 'D2', 'G2'],
    dropD: ['D1', 'A1', 'D2', 'G2'],
  },
  violin: {
    standard: ['G3', 'D4', 'A4', 'E5'],
  },
  piano: null,
} as const
