import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock tone module (useMetronome uses dynamic import('tone'))
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

// Mock Vue lifecycle hook since we call composable outside component setup
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onBeforeUnmount: vi.fn(),
  }
})

import { useMetronome } from '~/composables/useMetronome'

describe('useMetronome', () => {
  let metronome: ReturnType<typeof useMetronome>

  beforeEach(() => {
    metronome = useMetronome()
  })

  it('has correct initial state', () => {
    expect(metronome.bpm.value).toBe(120)
    expect(metronome.isRunning.value).toBe(false)
    expect(metronome.beatsPerMeasure.value).toBe(4)
    expect(metronome.currentBeat.value).toBe(0)
  })

  it('setBpm updates bpm value', async () => {
    await metronome.setBpm(140)
    expect(metronome.bpm.value).toBe(140)
  })

  it('can change beats per measure', () => {
    metronome.beatsPerMeasure.value = 3
    expect(metronome.beatsPerMeasure.value).toBe(3)
  })

  it('can change bpm to boundary values', async () => {
    await metronome.setBpm(30)
    expect(metronome.bpm.value).toBe(30)

    await metronome.setBpm(300)
    expect(metronome.bpm.value).toBe(300)
  })
})
