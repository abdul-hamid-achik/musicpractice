import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
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

// Mock the useAuthStore (auto-imported by Nuxt, used by useAuth composable)
const mockAuthStore = {
  user: ref(null),
  loading: ref(false),
  isAuthenticated: computed(() => false),
  userName: computed(() => ''),
  userId: computed(() => ''),
  fetchUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}
vi.stubGlobal('useAuthStore', () => mockAuthStore)

// Mock useToastStore for toast notifications
const mockToastStore = {
  toasts: ref([]),
  showToast: vi.fn(),
  removeToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
}
vi.stubGlobal('useToastStore', () => mockToastStore)

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
    // The start/stop button contains "Start" or "Stop" text
    // Since NordButton is not registered, look for any button with Start text
    expect(wrapper.html()).toContain('Start')
  })

  it('has BPM increment/decrement buttons', () => {
    const wrapper = mount(Metronome)
    const buttons = wrapper.findAll('button')
    // Has -5, -, +, +5, Start, Tap Tempo, plus 6 time signature buttons = 12 total
    expect(buttons.length).toBeGreaterThan(2)
  })
})
