import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

// Mock the heavy alphatab import — the composable only types against it.
vi.mock('@coderline/alphatab', () => ({}));

// Stub the useAlphaTab composable so it doesn't try to construct a real API
vi.mock('~/composables/useAlphaTab', () => ({
  useAlphaTab: () => ({
    api: ref({}),
    isLoaded: ref(true),
    isPlaying: ref(false),
    currentTick: ref(0),
    loadAlphaTex: vi.fn(),
    loadFile: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    setTempo: vi.fn(),
  }),
}));

import AlphaTabViewer from '~/components/instruments/AlphaTabViewer.vue';

describe('AlphaTabViewer', () => {
  it('renders the control bar with a play button', () => {
    const wrapper = mount(AlphaTabViewer);
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // play + stop
  });

  it('renders a tempo slider', () => {
    const wrapper = mount(AlphaTabViewer);
    const slider = wrapper.find('input[type="range"]');
    expect(slider.exists()).toBe(true);
    expect(slider.attributes('min')).toBe('25');
    expect(slider.attributes('max')).toBe('200');
  });

  it('renders the alphaTab container', () => {
    const wrapper = mount(AlphaTabViewer);
    expect(wrapper.find('.alphatab-container').exists()).toBe(true);
  });

  it('formats the tempo multiplier as a string (e.g. 1.00x)', () => {
    const wrapper = mount(AlphaTabViewer, { props: { alphaTex: '\\title "Test"' } });
    // default is 100
    expect(wrapper.text()).toContain('1.00x');
  });

  it('disables the play and stop buttons when isLoaded is false', async () => {
    // Re-mount with a module-level mock that has isLoaded=false
    vi.resetModules();
    vi.doMock('~/composables/useAlphaTab', () => ({
      useAlphaTab: () => ({
        api: ref(null),
        isLoaded: ref(false),
        isPlaying: ref(false),
        currentTick: ref(0),
        loadAlphaTex: vi.fn(),
        loadFile: vi.fn(),
        play: vi.fn(),
        stop: vi.fn(),
        setTempo: vi.fn(),
      }),
    }));
    const { default: AlphaTabViewerFresh } =
      await import('~/components/instruments/AlphaTabViewer.vue');
    const wrapper = mount(AlphaTabViewerFresh);
    await flushPromises();
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b.attributes('disabled')).toBeDefined();
    }
  });
});
