import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock the useMusicTheory composable (auto-imported by the component)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

vi.mock('~/composables/useMusicTheory', () => ({
  useMusicTheory: () => ({
    noteToMidi: (note: string, octave: number): number => {
      return NOTE_NAMES.indexOf(note) + (octave + 1) * 12
    },
  }),
}))

import PianoKeyboard from '~/components/instruments/PianoKeyboard.vue'

describe('PianoKeyboard', () => {
  it('renders SVG element', () => {
    const wrapper = mount(PianoKeyboard, {
      props: { startOctave: 4, octaves: 1 },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders correct number of white keys for 1 octave', () => {
    const wrapper = mount(PianoKeyboard, {
      props: { startOctave: 4, octaves: 1 },
    })
    // 7 white keys per octave (C, D, E, F, G, A, B)
    const whiteKeys = wrapper.findAll('rect.white-key')
    expect(whiteKeys).toHaveLength(7)
  })

  it('renders correct number of white keys for 2 octaves', () => {
    const wrapper = mount(PianoKeyboard, {
      props: { startOctave: 3, octaves: 2 },
    })
    const whiteKeys = wrapper.findAll('rect.white-key')
    expect(whiteKeys).toHaveLength(14)
  })

  it('emits noteClick when a key is clicked', async () => {
    const wrapper = mount(PianoKeyboard, {
      props: { startOctave: 4, octaves: 1 },
    })
    // Click the parent <g> element which has the @click handler
    const firstKeyGroup = wrapper.find('g.cursor-pointer')
    await firstKeyGroup.trigger('click')
    expect(wrapper.emitted('noteClick')).toBeTruthy()
  })

  it('highlights notes when highlightedNotes prop is set', () => {
    const wrapper = mount(PianoKeyboard, {
      props: {
        startOctave: 4,
        octaves: 1,
        highlightedNotes: ['C', 'E', 'G'],
        rootNote: 'C',
      },
    })
    // Root note C gets #88C0D0 fill, highlighted E and G get #81A1C1 fill
    const whiteKeys = wrapper.findAll('rect.white-key')
    const highlightedKeys = whiteKeys.filter((key) => {
      const fill = key.attributes('fill')
      return fill === '#88C0D0' || fill === '#81A1C1'
    })
    expect(highlightedKeys.length).toBeGreaterThan(0)
  })

  it('renders correct number of black keys for 1 octave', () => {
    const wrapper = mount(PianoKeyboard, {
      props: { startOctave: 4, octaves: 1 },
    })
    // 5 black keys per octave (C#, D#, F#, G#, A#)
    const blackKeys = wrapper.findAll('rect.black-key')
    expect(blackKeys).toHaveLength(5)
  })
})
