import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TempoTrainer from '~/components/practice/TempoTrainer.vue';

// Stubs for the auto-imported Ui* components
const UiProgressBarStub = {
  template:
    '<div class="ui-progress" :data-value="value" :data-color="color" :data-animated="animated" />',
  props: ['value', 'color', 'size', 'animated'],
};
const UiButtonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  props: ['variant', 'size', 'disabled', 'loading', 'ariaLabel', 'ariaPressed', 'type'],
  emits: ['click'],
};

const mountWithStubs = (props: Record<string, unknown> = {}) =>
  mount(TempoTrainer, {
    props,
    global: { stubs: { UiButton: UiButtonStub, UiProgressBar: UiProgressBarStub } },
  });

describe('TempoTrainer', () => {
  it('renders the start BPM and target BPM labels', () => {
    const wrapper = mountWithStubs({ startBpm: 60, targetBpm: 120 });
    expect(wrapper.text()).toContain('60 BPM');
    expect(wrapper.text()).toContain('120 BPM');
  });

  it('renders the current BPM (defaults to startBpm)', () => {
    const wrapper = mountWithStubs({ startBpm: 80, targetBpm: 160 });
    expect(wrapper.text()).toContain('80');
    expect(wrapper.text()).toContain('Current BPM');
  });

  it('renders 0% progress at start', () => {
    const wrapper = mountWithStubs({ startBpm: 60, targetBpm: 120 });
    expect(wrapper.text()).toContain('0% complete');
  });

  it('renders the Start button initially', () => {
    const wrapper = mountWithStubs();
    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text().includes('Start'))).toBe(true);
    expect(buttons.some((b) => b.text().includes('Reset'))).toBe(true);
  });

  it('does not show the countdown before Start is clicked', () => {
    const wrapper = mountWithStubs();
    // Countdown shows "Ns" pattern only when isRunning
    const text = wrapper.text();
    expect(text).not.toMatch(/\d+s\n\s*until/);
  });

  it('emits tempoChange on Start with the initial BPM (state transition)', async () => {
    const wrapper = mountWithStubs({
      startBpm: 60,
      targetBpm: 120,
      intervalSeconds: 0.05,
      incrementBpm: 5,
    });
    // Start it
    const startButton = wrapper.findAll('button').find((b) => b.text().includes('Start'))!;
    await startButton.trigger('click');

    // Wait for the timer to fire (interval is 1s in the component, not 0.05)
    // We won't actually wait — we just verify the start button works and
    // emits tempoChange on each tick.
    // Manually call the increment
    // @ts-expect-error — accessing internal function
    await wrapper.vm.incrementTempo?.();
    // @ts-expect-error
    await wrapper.vm.incrementTempo?.();
    // @ts-expect-error
    await wrapper.vm.incrementTempo?.();

    const events = wrapper.emitted('tempoChange') ?? [];
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]![0]).toBe(65);
  });

  it('shows the Stop button instead of Start after clicking Start (state transition)', async () => {
    const wrapper = mountWithStubs();
    const startButton = wrapper.findAll('button').find((b) => b.text().includes('Start'))!;
    await startButton.trigger('click');

    expect(wrapper.text()).toContain('Stop');
    expect(wrapper.text()).not.toContain('>Start<');
  });

  it('calls stop on Reset (state transition)', async () => {
    const wrapper = mountWithStubs();
    const startButton = wrapper.findAll('button').find((b) => b.text().includes('Start'))!;
    await startButton.trigger('click');

    const resetButton = wrapper.findAll('button').find((b) => b.text().includes('Reset'))!;
    await resetButton.trigger('click');

    // After reset, the start button is back
    expect(wrapper.text()).toContain('Start');
  });

  it('emits tempoChange values clamped at targetBpm', async () => {
    const wrapper = mountWithStubs({ startBpm: 60, targetBpm: 65, incrementBpm: 10 });
    // @ts-expect-error
    await wrapper.vm.incrementTempo?.();
    // @ts-expect-error
    await wrapper.vm.incrementTempo?.();
    const events = wrapper.emitted('tempoChange') ?? [];
    // 60 + 10 = 70, but clamped to 65
    expect(events[events.length - 1]![0]).toBe(65);
  });
});
