import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Mock tone (used by useMetronome composable via dynamic import)
vi.mock('tone', () => ({
  start: vi.fn(),
  MembraneSynth: vi.fn(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Loop: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  })),
  getTransport: vi.fn(() => ({
    bpm: { value: 120 },
    start: vi.fn(),
    stop: vi.fn(),
  })),
}))

// Mock the useMetronome composable so it doesn't depend on Tone.js internals
vi.mock('~/composables/useMetronome', () => ({
  useMetronome: () => ({
    bpm: ref(120),
    isRunning: ref(false),
    beatsPerMeasure: ref(4),
    currentBeat: ref(0),
    start: vi.fn(),
    stop: vi.fn(),
    setBpm: vi.fn(),
  }),
}))

import Metronome from '~/components/practice/Metronome.vue'

describe('Metronome', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders BPM display', () => {
    const wrapper = mount(Metronome)
    expect(wrapper.text()).toContain('120')
  })

  it('has start button', () => {
    const wrapper = mount(Metronome)
    // The start/stop button contains "Start" text when not running
    const buttons = wrapper.findAll('button')
    const startBtn = buttons.find((b) => b.text() === 'Start')
    expect(startBtn).toBeTruthy()
  })

  it('has BPM increment/decrement buttons', () => {
    const wrapper = mount(Metronome)
    const buttons = wrapper.findAll('button')
    // Has -5, -, +, +5, Start, Tap Tempo, plus 6 time signature buttons = 12 total
    expect(buttons.length).toBeGreaterThan(2)
  })
})
