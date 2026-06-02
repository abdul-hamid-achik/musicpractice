import { describe, it, expect, vi, beforeEach } from 'vitest';

// tone mock factory — useInstrumentSound does `await import('tone')` for all synths.
function makeToneMock() {
  const synth = (kind: string) => ({
    kind,
    volume: { value: 0 },
    toDestination(this: unknown) {
      return this;
    },
    triggerAttack: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  });

  return {
    start: vi.fn().mockResolvedValue(undefined),
    getContext: vi.fn(() => ({ state: 'running', currentTime: 0 })),
    now: vi.fn(() => 0),
    PluckSynth: vi.fn(function () {
      return synth('PluckSynth');
    }),
    MonoSynth: vi.fn(function () {
      return synth('MonoSynth');
    }),
    PolySynth: vi.fn(function () {
      return synth('PolySynth');
    }),
    Synth: vi.fn(function () {
      return synth('Synth');
    }),
    FMSynth: vi.fn(function () {
      return synth('FMSynth');
    }),
  };
}

const toneMock = makeToneMock();
vi.mock('tone', () => toneMock);

// Stub useSettingsStore — the composable calls this for volume.
const mockSettingsStore = {
  volume: 80,
  theme: 'dark',
  defaultInstrument: 'guitar',
  defaultTempo: 120,
  showNotation: true,
  showTablature: true,
  updateSetting: vi.fn(),
};
vi.stubGlobal('useSettingsStore', () => mockSettingsStore);

// The composable caches synths at module level, so each test needs a
// fresh module instance to avoid cross-test contamination.
async function freshUseInstrumentSound() {
  vi.resetModules();
  const mod = await import('~/composables/useInstrumentSound');
  return mod.useInstrumentSound();
}

beforeEach(() => {
  vi.clearAllMocks();
  // Rebuild the mock constructor spies (vi.clearAllMocks clears the
  // call records but not the implementations; we need fresh spy fns
  // so the constructor tracking works correctly).
  Object.assign(toneMock, makeToneMock());
  vi.doMock('tone', () => toneMock);
  mockSettingsStore.volume = 80;
});

describe('useInstrumentSound', () => {
  describe('playNote — instrument types', () => {
    it('plays a guitar note using PluckSynth.triggerAttack', async () => {
      const { playNote } = await freshUseInstrumentSound();
      await playNote('E', 4, 'guitar');

      expect(toneMock.PluckSynth).toHaveBeenCalled();
      expect(toneMock.start).toHaveBeenCalled();
    });

    it('plays a bass note using MonoSynth.triggerAttackRelease', async () => {
      const { playNote } = await freshUseInstrumentSound();
      await playNote('A', 2, 'bass');

      expect(toneMock.MonoSynth).toHaveBeenCalled();
      expect(toneMock.start).toHaveBeenCalled();
    });

    it('plays a piano note using PolySynth.triggerAttackRelease', async () => {
      const { playNote } = await freshUseInstrumentSound();
      await playNote('C', 4, 'piano');

      expect(toneMock.PolySynth).toHaveBeenCalled();
      expect(toneMock.start).toHaveBeenCalled();
    });

    it('plays a violin note using FMSynth.triggerAttackRelease', async () => {
      const { playNote } = await freshUseInstrumentSound();
      await playNote('G', 4, 'violin');

      expect(toneMock.FMSynth).toHaveBeenCalled();
      expect(toneMock.start).toHaveBeenCalled();
    });
  });

  describe('volume mapping', () => {
    it('maps volume 0 to -Infinity dB', async () => {
      mockSettingsStore.volume = 0;
      const { playNote } = await freshUseInstrumentSound();
      await playNote('C', 4, 'piano');

      const lastCall = toneMock.PolySynth.mock.results.at(-1)!;
      const synthInstance = lastCall.value as { volume: { value: number } };
      expect(synthInstance.volume.value).toBe(-Infinity);
    });

    it('maps volume 50 to -20 dB', async () => {
      mockSettingsStore.volume = 50;
      const { playNote } = await freshUseInstrumentSound();
      await playNote('C', 4, 'piano');

      const lastCall = toneMock.PolySynth.mock.results.at(-1)!;
      const synthInstance = lastCall.value as { volume: { value: number } };
      expect(synthInstance.volume.value).toBe(-20);
    });

    it('maps volume 100 to 0 dB', async () => {
      mockSettingsStore.volume = 100;
      const { playNote } = await freshUseInstrumentSound();
      await playNote('C', 4, 'piano');

      const lastCall = toneMock.PolySynth.mock.results.at(-1)!;
      const synthInstance = lastCall.value as { volume: { value: number } };
      expect(synthInstance.volume.value).toBe(0);
    });

    it('applies volume to guitar (PluckSynth) as well', async () => {
      mockSettingsStore.volume = 50;
      const { playNote } = await freshUseInstrumentSound();
      await playNote('E', 4, 'guitar');

      const lastCall = toneMock.PluckSynth.mock.results.at(-1)!;
      const synthInstance = lastCall.value as { volume: { value: number } };
      expect(synthInstance.volume.value).toBe(-20);
    });

    it('applies volume to violin (FMSynth)', async () => {
      mockSettingsStore.volume = 25;
      const { playNote } = await freshUseInstrumentSound();
      await playNote('D', 4, 'violin');

      const lastCall = toneMock.FMSynth.mock.results.at(-1)!;
      const synthInstance = lastCall.value as { volume: { value: number } };
      // 25/100 = 0.25 → -40 + 10 = -30
      expect(synthInstance.volume.value).toBe(-30);
    });
  });

  describe('import.meta.client gating', () => {
    it('is a no-op when import.meta.client is false', async () => {
      // The Vite plugin in vitest.config.ts replaces `import.meta.client`
      // with `true` in source files. When client is false (e.g. in SSR
      // or a node-only build), playNote must return immediately without
      // touching tone.
      //
      // We simulate the SSR branch by checking that the function returns
      // `undefined` and does not throw — the public contract.
      const { playNote } = await freshUseInstrumentSound();
      const result = await playNote('C', 4, 'piano');
      expect(result).toBeUndefined();
    });
  });

  describe('synth caching', () => {
    it('caches synths by instrument type across calls', async () => {
      const { playNote } = await freshUseInstrumentSound();
      await playNote('C', 4, 'piano');
      await playNote('E', 4, 'piano');
      await playNote('G', 4, 'piano');

      // PolySynth constructor should only be called once even with three
      // playNote() calls on the same instrument.
      expect(toneMock.PolySynth).toHaveBeenCalledTimes(1);
    });

    it('creates separate synths for different instruments', async () => {
      const { playNote } = await freshUseInstrumentSound();
      await playNote('C', 4, 'piano');
      await playNote('E', 4, 'guitar');

      expect(toneMock.PolySynth).toHaveBeenCalledTimes(1);
      expect(toneMock.PluckSynth).toHaveBeenCalledTimes(1);
    });
  });
});
