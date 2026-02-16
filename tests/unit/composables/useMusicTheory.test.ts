import { describe, it, expect } from 'vitest'
import { useMusicTheory } from '~/composables/useMusicTheory'

describe('useMusicTheory', () => {
  const { getNoteNames, getScaleNotes, getChordNotes, getInterval, transposeNote, noteToMidi, midiToNote } = useMusicTheory()

  describe('getNoteNames', () => {
    it('returns 12 note names', () => {
      const notes = getNoteNames()
      expect(notes).toHaveLength(12)
      expect(notes[0]).toBe('C')
      expect(notes[11]).toBe('B')
    })
  })

  describe('getScaleNotes', () => {
    it('returns C Major scale notes', () => {
      const notes = getScaleNotes('C', [0, 2, 4, 5, 7, 9, 11])
      expect(notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    })

    it('returns G Major scale notes', () => {
      const notes = getScaleNotes('G', [0, 2, 4, 5, 7, 9, 11])
      expect(notes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#'])
    })

    it('returns A Minor pentatonic', () => {
      const notes = getScaleNotes('A', [0, 3, 5, 7, 10])
      expect(notes).toEqual(['A', 'C', 'D', 'E', 'G'])
    })

    it('returns D Blues scale', () => {
      const notes = getScaleNotes('D', [0, 3, 5, 6, 7, 10])
      expect(notes).toEqual(['D', 'F', 'G', 'G#', 'A', 'C'])
    })
  })

  describe('getChordNotes', () => {
    it('returns C Major chord', () => {
      const notes = getChordNotes('C', [0, 4, 7])
      expect(notes).toEqual(['C', 'E', 'G'])
    })

    it('returns A Minor chord', () => {
      const notes = getChordNotes('A', [0, 3, 7])
      expect(notes).toEqual(['A', 'C', 'E'])
    })

    it('returns G7 chord', () => {
      const notes = getChordNotes('G', [0, 4, 7, 10])
      expect(notes).toEqual(['G', 'B', 'D', 'F'])
    })
  })

  describe('getInterval', () => {
    it('returns 0 for same note', () => {
      expect(getInterval('C', 'C')).toBe(0)
    })

    it('returns 7 for perfect fifth (C to G)', () => {
      expect(getInterval('C', 'G')).toBe(7)
    })

    it('returns 4 for major third (C to E)', () => {
      expect(getInterval('C', 'E')).toBe(4)
    })

    it('returns 5 for perfect fourth (G to C)', () => {
      expect(getInterval('G', 'C')).toBe(5)
    })
  })

  describe('transposeNote', () => {
    it('transposes C up 7 semitones to G', () => {
      expect(transposeNote('C', 7)).toBe('G')
    })

    it('transposes G up 5 semitones to C', () => {
      expect(transposeNote('G', 5)).toBe('C')
    })

    it('transposes E up 1 semitone to F', () => {
      expect(transposeNote('E', 1)).toBe('F')
    })

    it('handles wrapping around', () => {
      expect(transposeNote('A', 4)).toBe('C#')
    })
  })

  describe('noteToMidi', () => {
    it('C4 is MIDI 60', () => {
      expect(noteToMidi('C', 4)).toBe(60)
    })

    it('A4 is MIDI 69', () => {
      expect(noteToMidi('A', 4)).toBe(69)
    })

    it('C0 is MIDI 12', () => {
      expect(noteToMidi('C', 0)).toBe(12)
    })
  })

  describe('midiToNote', () => {
    it('MIDI 60 is C4', () => {
      const result = midiToNote(60)
      expect(result.note).toBe('C')
      expect(result.octave).toBe(4)
    })

    it('MIDI 69 is A4', () => {
      const result = midiToNote(69)
      expect(result.note).toBe('A')
      expect(result.octave).toBe(4)
    })
  })
})
