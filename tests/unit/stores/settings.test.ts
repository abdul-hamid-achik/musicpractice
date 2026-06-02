import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useSettingsStore } from '~/stores/settings';

const mockToast = {
  toasts: ref([]),
  showToast: vi.fn(),
  removeToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
};
vi.stubGlobal('useToastStore', () => mockToast);

// Stub document so the theme watcher can toggle the 'light' class on
// document.documentElement.
const toggleClass = vi.fn();
Object.defineProperty(globalThis, 'document', {
  value: {
    documentElement: {
      classList: {
        toggle: toggleClass,
      },
    },
  },
});

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('default state', () => {
    it('has correct defaults', () => {
      const store = useSettingsStore();
      expect(store.theme).toBe('dark');
      expect(store.defaultInstrument).toBe('guitar');
      expect(store.defaultTempo).toBe(120);
      expect(store.showNotation).toBe(true);
      expect(store.showTablature).toBe(true);
      expect(store.volume).toBe(80);
    });
  });

  describe('updateSetting', () => {
    it('changes a setting value (string)', () => {
      const store = useSettingsStore();
      store.updateSetting('theme', 'light');
      expect(store.theme).toBe('light');
    });

    it('changes a setting value (number)', () => {
      const store = useSettingsStore();
      store.updateSetting('volume', 50);
      expect(store.volume).toBe(50);
    });

    it('changes a setting value (boolean)', () => {
      const store = useSettingsStore();
      store.updateSetting('showNotation', false);
      expect(store.showNotation).toBe(false);
    });

    it('changes instrument setting', () => {
      const store = useSettingsStore();
      store.updateSetting('defaultInstrument', 'piano');
      expect(store.defaultInstrument).toBe('piano');
    });
  });

  describe('persistence', () => {
    it('persists to localStorage on updateSetting', async () => {
      const store = useSettingsStore();
      store.updateSetting('volume', 42);

      // The store also has a `watch` that auto-persists on any change, so
      // we need to wait for the watcher microtask to settle.
      await Promise.resolve();

      const raw = localStorage.getItem('musicpractice-settings');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.volume).toBe(42);
    });

    it('persists the full settings object, not just the changed key', async () => {
      const store = useSettingsStore();
      store.updateSetting('theme', 'light');
      store.updateSetting('volume', 50);
      await Promise.resolve();

      const parsed = JSON.parse(localStorage.getItem('musicpractice-settings')!);
      expect(parsed.theme).toBe('light');
      expect(parsed.volume).toBe(50);
      expect(parsed.defaultInstrument).toBe('guitar'); // unchanged default
      expect(parsed.showNotation).toBe(true); // unchanged default
    });

    it('auto-persists on direct ref mutation (via the watcher)', async () => {
      const store = useSettingsStore();
      store.volume = 99;
      await Promise.resolve();
      const parsed = JSON.parse(localStorage.getItem('musicpractice-settings')!);
      expect(parsed.volume).toBe(99);
    });
  });

  describe('localStorage init', () => {
    it('hydrates from localStorage on store creation', () => {
      localStorage.setItem(
        'musicpractice-settings',
        JSON.stringify({
          theme: 'light',
          defaultInstrument: 'violin',
          defaultTempo: 180,
          showNotation: false,
          showTablature: false,
          volume: 25,
        }),
      );

      const store = useSettingsStore();
      expect(store.theme).toBe('light');
      expect(store.defaultInstrument).toBe('violin');
      expect(store.defaultTempo).toBe(180);
      expect(store.showNotation).toBe(false);
      expect(store.showTablature).toBe(false);
      expect(store.volume).toBe(25);
    });

    it('uses defaults when nothing is stored', () => {
      const store = useSettingsStore();
      expect(store.theme).toBe('dark');
    });

    it('ignores malformed JSON in localStorage and uses defaults', () => {
      localStorage.setItem('musicpractice-settings', '{ broken json :: not valid');

      // The store should still construct successfully with defaults
      const store = useSettingsStore();
      expect(store.theme).toBe('dark');
      expect(store.defaultInstrument).toBe('guitar');
      expect(store.defaultTempo).toBe(120);
    });

    it('ignores empty localStorage entry', () => {
      localStorage.setItem('musicpractice-settings', '');
      const store = useSettingsStore();
      expect(store.theme).toBe('dark');
    });

    it('hydrates only the fields that are present', () => {
      localStorage.setItem(
        'musicpractice-settings',
        JSON.stringify({
          theme: 'light',
          // other fields missing — should keep defaults
        }),
      );
      const store = useSettingsStore();
      expect(store.theme).toBe('light');
      expect(store.defaultInstrument).toBe('guitar'); // default
      expect(store.volume).toBe(80); // default
    });
  });

  describe('theme watcher', () => {
    it('toggles the "light" class on documentElement when theme changes to light', async () => {
      const store = useSettingsStore();
      toggleClass.mockClear();

      store.theme = 'light';
      await Promise.resolve();
      await Promise.resolve();

      expect(toggleClass).toHaveBeenCalledWith('light', true);
    });

    it('toggles the "light" class off when theme changes back to dark', async () => {
      const store = useSettingsStore();
      store.theme = 'light';
      await Promise.resolve();
      toggleClass.mockClear();

      store.theme = 'dark';
      await Promise.resolve();
      await Promise.resolve();

      expect(toggleClass).toHaveBeenCalledWith('light', false);
    });
  });
});
