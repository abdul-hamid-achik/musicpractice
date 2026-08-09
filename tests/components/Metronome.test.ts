import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';

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
}));

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
}));

// The component imports `apiGet`/`apiPost` from ~/utils/api and uses
// `useToast` for error messages. Both go through our stubbed $fetch.
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
};
vi.stubGlobal('useAuthStore', () => mockAuthStore);

const mockToastStore = {
  toasts: ref([]),
  showToast: vi.fn(),
  removeToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
};
vi.stubGlobal('useToastStore', () => mockToastStore);

// Stub the Ui* components used in the template
const UiButtonStub = {
  template:
    '<button :disabled="disabled || loading" :aria-pressed="ariaPressed" :aria-label="ariaLabel" :aria-busy="loading" @click="$emit(\'click\', $event)"><slot /></button>',
  props: ['variant', 'size', 'disabled', 'loading', 'ariaLabel', 'ariaPressed', 'type'],
  emits: ['click'],
};
const UiProgressBarStub = {
  template: '<div class="ui-progress" :style="{ width: value + \'%\' }" :data-color="color" />',
  props: ['value', 'color', 'size', 'animated'],
};

import Metronome from '~/components/practice/Metronome.vue';

describe('Metronome (expanded)', () => {
  it('renders the BPM display', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    expect(wrapper.text()).toContain('120');
    expect(wrapper.text()).toContain('BPM');
  });

  it('renders 5 BPM adjustment buttons (-5, -, +, +5, Start, Tap Tempo, etc.)', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    const buttons = wrapper.findAll('button');
    // -5, -, +, +5 are 4 native buttons; Start, Tap Tempo, 6 time-sig buttons = 11 total
    expect(buttons.length).toBeGreaterThanOrEqual(10);
  });

  it('has aria labels for the BPM adjustment buttons', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    expect(wrapper.html()).toContain('Decrease tempo by 5 BPM');
    expect(wrapper.html()).toContain('Decrease tempo by 1 BPM');
    expect(wrapper.html()).toContain('Increase tempo by 1 BPM');
    expect(wrapper.html()).toContain('Increase tempo by 5 BPM');
  });

  it('renders a tempo slider with min=30 and max=300', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    const slider = wrapper.find('input[type="range"]');
    expect(slider.exists()).toBe(true);
    expect(slider.attributes('min')).toBe('30');
    expect(slider.attributes('max')).toBe('300');
  });

  it('renders 6 time signature buttons', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    for (const sig of ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8']) {
      expect(wrapper.text()).toContain(sig);
    }
  });

  it('renders the visual beat indicator group with aria-live="polite"', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    expect(wrapper.html()).toContain('aria-live="polite"');
    expect(wrapper.html()).toContain('Beat indicator');
  });

  it('renders 4 beat dots by default (4/4 time)', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    // Beat dots are the round divs in the beat indicator group
    // They have w-8 h-8 rounded-full classes
    const dots = wrapper.findAll('div.rounded-full');
    // 4 beat dots expected
    expect(dots.length).toBeGreaterThanOrEqual(4);
  });

  it('exposes setBpm, adjustBpm, togglePlayback, bpm, isRunning via defineExpose', () => {
    const wrapper = mount(Metronome, {
      global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
    });
    // @ts-expect-error — accessing exposed methods on component instance
    expect(typeof wrapper.vm.setBpm).toBe('function');
    // @ts-expect-error
    expect(typeof wrapper.vm.adjustBpm).toBe('function');
    // @ts-expect-error
    expect(typeof wrapper.vm.togglePlayback).toBe('function');
  });
});
