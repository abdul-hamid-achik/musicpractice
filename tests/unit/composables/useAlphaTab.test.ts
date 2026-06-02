import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref, nextTick, type ComponentPublicInstance } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

/**
 * useAlphaTab
 *  - onMounted: dynamically imports @coderline/alphatab, builds Settings,
 *    constructs AlphaTabApi, wires up renderFinished / playerStateChanged /
 *    playerPositionChanged events.
 *  - onBeforeUnmount: calls api.destroy()
 *  - exposes: loadAlphaTex (api.tex), loadFile (api.load), play (api.playPause),
 *    stop (api.stop + isPlaying=false), setTempo (api.playbackSpeed = tempo/100)
 *
 * The composable's `onMounted` callback is async (awaits a dynamic import of
 * `@coderline/alphatab`). To keep tests isolated we track mounted wrappers in
 * a module-level array and unmount them in afterEach, then drain pending
 * microtasks so no in-flight async callback from a previous test can pollute
 * the next test's mock state.
 */

// -- Event emitter mock -----------------------------------------------------
class FakeEventEmitter {
  private listeners: Array<(e: unknown) => void> = [];
  on(fn: (e: unknown) => void) {
    this.listeners.push(fn);
  }
  off(fn: (e: unknown) => void) {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }
  fire(payload: unknown) {
    for (const l of this.listeners) l(payload);
  }
  listenerCount() {
    return this.listeners.length;
  }
}

// -- Per-test API mock ------------------------------------------------------
function makeApiMock() {
  return {
    tex: vi.fn(),
    load: vi.fn(),
    playPause: vi.fn(),
    stop: vi.fn(),
    playbackSpeed: 1,
    destroy: vi.fn(),
    updateSettings: vi.fn(),
    render: vi.fn(),
    settings: {
      core: { engine: 'html5', logLevel: 0, fontDirectory: '' },
      player: {
        enablePlayer: false,
        enableCursor: false,
        enableUserInteraction: false,
        soundFont: '',
      },
      display: { resources: {} as Record<string, unknown> },
    },
    renderFinished: new FakeEventEmitter(),
    playerStateChanged: new FakeEventEmitter(),
    playerPositionChanged: new FakeEventEmitter(),
  };
}

let apiMock = makeApiMock();

// -- @coderline/alphatab module mock ---------------------------------------
const alphaTabMock = {
  model: {
    Color: vi.fn(function (this: unknown, r: number, g: number, b: number) {
      return { r, g, b };
    }),
  },
  LogLevel: { None: 0 },
  Settings: vi.fn(function () {
    return apiMock.settings;
  }),
  AlphaTabApi: vi.fn(function () {
    return apiMock;
  }),
};

vi.mock('@coderline/alphatab', () => alphaTabMock);

// Stub useSettingsStore — useAlphaTab reads theme to choose colors.
// The composable's `watch(() => settingsStore.theme, ...)` requires the store
// to be a reactive object, so we back the mock with `ref`s.
import { ref as _ref } from 'vue';
const _theme = _ref('dark');
const mockSettingsStore = {
  get theme() {
    return _theme.value;
  },
  set theme(v: string) {
    _theme.value = v;
  },
  volume: 80,
  defaultInstrument: 'guitar',
  defaultTempo: 120,
  showNotation: true,
  showTablature: true,
  updateSetting: vi.fn(),
};
vi.stubGlobal('useSettingsStore', () => mockSettingsStore);

// -- Test isolation helpers -------------------------------------------------
let wrappers: VueWrapper<ComponentPublicInstance>[] = [];

async function waitForInit(predicate: () => boolean, maxIterations = 50) {
  for (let i = 0; i < maxIterations; i++) {
    await nextTick();
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 0));
    if (predicate()) return;
  }
}

async function mountWith(container: HTMLElement | null) {
  // The composable uses `await import('@coderline/alphatab')` inside its
  // onMounted hook. We re-import the composable per test so the module-level
  // state (`api`, `playerStateListener`, `tickListener`, `ColorClass`) starts
  // fresh. The `vi.mock` factory still returns the same `alphaTabMock`
  // instance, so all tests share the constructor spy.
  const mod = await import('~/composables/useAlphaTab');
  const useAlphaTab = mod.useAlphaTab;

  const wrapper = mount(
    defineComponent({
      setup() {
        const containerRef = ref<HTMLElement | null>(container);
        const composable = useAlphaTab(containerRef);
        return { ...composable, containerRef };
      },
      render() {
        return h('div');
      },
    }),
    { attachTo: document.body },
  );
  wrappers.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  apiMock = makeApiMock();
  (alphaTabMock.Settings as any).mockClear();
  (alphaTabMock.Settings as any).mockImplementation(() => apiMock.settings);
  (alphaTabMock.AlphaTabApi as any).mockClear();
  (alphaTabMock.AlphaTabApi as any).mockImplementation(() => apiMock);
  (alphaTabMock.model.Color as any).mockClear();
  _theme.value = 'dark';
  wrappers = [];
});

afterEach(async () => {
  for (const w of wrappers) w.unmount();
  wrappers = [];
  document.body.innerHTML = '';
  // Drain any pending microtasks from the just-unmounted component so its
  // async onMounted callback can't fire after the test ends.
  await new Promise((r) => setTimeout(r, 30));
  (alphaTabMock.AlphaTabApi as any).mockClear();
});

describe('useAlphaTab', () => {
  it('does not initialize if containerRef is null', async () => {
    await mountWith(null);
    // Wait long enough for any in-flight init to either succeed or be skipped.
    await new Promise((r) => setTimeout(r, 20));
    expect(alphaTabMock.AlphaTabApi).not.toHaveBeenCalled();
  });

  it('initializes AlphaTabApi with the container on mount', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    await mountWith(container);
    await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

    expect(alphaTabMock.AlphaTabApi).toHaveBeenCalledTimes(1);
    expect((alphaTabMock.AlphaTabApi as any).mock.calls[0]![0]).toBe(container);
  });

  it('configures player flags and soundFont', async () => {
    const container = document.createElement('div');
    await mountWith(container);
    await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

    expect(apiMock.settings.player.enablePlayer).toBe(true);
    expect(apiMock.settings.player.enableCursor).toBe(true);
    expect(apiMock.settings.player.enableUserInteraction).toBe(true);
    expect(apiMock.settings.player.soundFont).toBe('/soundfonts/sonivox.sf2');
    expect(apiMock.settings.core.engine).toBe('html5');
    expect(apiMock.settings.core.fontDirectory).toBe('/font/');
  });

  it('flips isLoaded to true when renderFinished fires', async () => {
    const container = document.createElement('div');
    const wrapper = await mountWith(container);
    await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

    expect((wrapper.vm as any).isLoaded).toBe(false);
    apiMock.renderFinished.fire({});
    expect((wrapper.vm as any).isLoaded).toBe(true);
  });

  it('updates isPlaying from playerStateChanged events (state === 1)', async () => {
    const container = document.createElement('div');
    const wrapper = await mountWith(container);
    await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

    apiMock.playerStateChanged.fire({ state: 1 });
    expect((wrapper.vm as any).isPlaying).toBe(true);

    apiMock.playerStateChanged.fire({ state: 0 });
    expect((wrapper.vm as any).isPlaying).toBe(false);
  });

  it('updates currentTick from playerPositionChanged events', async () => {
    const container = document.createElement('div');
    const wrapper = await mountWith(container);
    await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

    apiMock.playerPositionChanged.fire({ currentTick: 42 });
    expect((wrapper.vm as any).currentTick).toBe(42);

    apiMock.playerPositionChanged.fire({ currentTick: 100 });
    expect((wrapper.vm as any).currentTick).toBe(100);
  });

  describe('loadAlphaTex', () => {
    it('calls api.tex with the tex string', async () => {
      const container = document.createElement('div');
      const wrapper = await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      (wrapper.vm as any).loadAlphaTex('\\title "Hello"');
      expect(apiMock.tex).toHaveBeenCalledWith('\\title "Hello"');
    });

    it('is a no-op when api is not yet initialized', async () => {
      const wrapper = await mountWith(null);
      await nextTick();
      (wrapper.vm as any).loadAlphaTex('\\title "x"');
      expect(apiMock.tex).not.toHaveBeenCalled();
    });
  });

  describe('loadFile', () => {
    it('calls api.load with the data', async () => {
      const container = document.createElement('div');
      const wrapper = await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      const data = new ArrayBuffer(8);
      (wrapper.vm as any).loadFile(data);
      expect(apiMock.load).toHaveBeenCalledWith(data);
    });
  });

  describe('play', () => {
    it('calls api.playPause', async () => {
      const container = document.createElement('div');
      const wrapper = await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      (wrapper.vm as any).play();
      expect(apiMock.playPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('calls api.stop and sets isPlaying to false', async () => {
      const container = document.createElement('div');
      const wrapper = await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      // Simulate playing state first
      apiMock.playerStateChanged.fire({ state: 1 });
      expect((wrapper.vm as any).isPlaying).toBe(true);

      (wrapper.vm as any).stop();
      expect(apiMock.stop).toHaveBeenCalledTimes(1);
      expect((wrapper.vm as any).isPlaying).toBe(false);
    });
  });

  describe('setTempo', () => {
    it('sets api.playbackSpeed to tempo / 100', async () => {
      const container = document.createElement('div');
      const wrapper = await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      (wrapper.vm as any).setTempo(150);
      expect(apiMock.playbackSpeed).toBe(1.5);

      (wrapper.vm as any).setTempo(50);
      expect(apiMock.playbackSpeed).toBe(0.5);
    });
  });

  describe('theme watcher', () => {
    it('re-applies theme colors when the settings theme changes', async () => {
      const container = document.createElement('div');
      await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      // Switch theme → expect updateSettings + render called
      _theme.value = 'light';
      await nextTick();
      await new Promise((r) => setTimeout(r, 0));
      await nextTick();
      await new Promise((r) => setTimeout(r, 0));

      expect(apiMock.updateSettings).toHaveBeenCalled();
      expect(apiMock.render).toHaveBeenCalled();
    });
  });

  describe('destroy on unmount', () => {
    it('calls api.destroy when the component unmounts', async () => {
      const container = document.createElement('div');
      const wrapper = await mountWith(container);
      await waitForInit(() => (alphaTabMock.AlphaTabApi as any).mock.calls.length > 0);

      expect(apiMock.destroy).not.toHaveBeenCalled();

      wrapper.unmount();
      expect(apiMock.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
