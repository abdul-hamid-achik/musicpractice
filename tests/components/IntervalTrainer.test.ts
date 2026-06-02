import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn(() => 0),
  Synth: vi.fn(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
}));

const midiToNote = (midi: number) => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return { note: names[midi % 12], octave: Math.floor(midi / 12) - 1 };
};

vi.mock('~/composables/useMusicTheory', () => ({
  useMusicTheory: () => ({ midiToNote }),
}));

// Stub the Nord* UI components (auto-registered by Nuxt, missing in vitest)
const NordButtonStub = {
  template:
    '<button :disabled="disabled" :aria-pressed="ariaPressed" :aria-label="ariaLabel" @click="$emit(\'click\', $event)"><slot /></button>',
  props: ['variant', 'size', 'disabled', 'loading', 'ariaLabel', 'ariaPressed', 'type'],
  emits: ['click'],
};
const NordProgressBarStub = {
  template: '<div class="nord-progress" :style="{ width: value + \'%\' }" :data-color="color" />',
  props: ['value', 'color', 'size', 'animated'],
};

import IntervalTrainer from '~/components/theory/IntervalTrainer.vue';

describe('IntervalTrainer', () => {
  it('renders title and reset control', () => {
    const wrapper = mount(IntervalTrainer, {
      global: { stubs: { NordButton: NordButtonStub, NordProgressBar: NordProgressBarStub } },
    });
    expect(wrapper.text()).toContain('Interval Trainer');
    expect(wrapper.text()).toContain('Reset');
  });

  it('starts with score 0/0', () => {
    const wrapper = mount(IntervalTrainer, {
      global: { stubs: { NordButton: NordButtonStub, NordProgressBar: NordProgressBarStub } },
    });
    expect(wrapper.text()).toContain('0/0 correct');
  });

  it('renders direction toggle buttons', () => {
    const wrapper = mount(IntervalTrainer, {
      global: { stubs: { NordButton: NordButtonStub, NordProgressBar: NordProgressBarStub } },
    });
    expect(wrapper.text()).toContain('ascending');
    expect(wrapper.text()).toContain('descending');
    expect(wrapper.text()).toContain('both');
  });

  it('renders the Start button before any question is loaded', () => {
    const wrapper = mount(IntervalTrainer, {
      global: { stubs: { NordButton: NordButtonStub, NordProgressBar: NordProgressBarStub } },
    });
    expect(wrapper.text()).toContain('Start');
    // No answer grid yet
    expect(wrapper.text()).not.toContain('Your Answer');
  });

  it('emits scoreUpdate when an answer is guessed (state transition)', async () => {
    const wrapper = mount(IntervalTrainer, {
      global: { stubs: { NordButton: NordButtonStub, NordProgressBar: NordProgressBarStub } },
    });

    // Click Start to load a question. playInterval will be called but it's mocked.
    const buttons = wrapper.findAll('button');
    const startButton = buttons.find((b) => b.text().trim() === 'Start')!;
    await startButton.trigger('click');
    await wrapper.vm.$nextTick();

    // After start, an answer grid is rendered. Click any answer.
    const answerButtons = wrapper.findAll('button').filter((b) => {
      const t = b.text();
      return /m2|M2|m3|M3|P4|TT|P5|m6|M6|m7|M7|P8/.test(t);
    });
    expect(answerButtons.length).toBeGreaterThan(0);
    await answerButtons[0]!.trigger('click');

    expect(wrapper.emitted('scoreUpdate')).toBeTruthy();
    const payload = wrapper.emitted('scoreUpdate')![0]![0] as { correct: number; total: number };
    expect(payload.total).toBe(1);
  });
});
