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
