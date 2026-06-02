import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useTheoryStore } from '~/stores/theory';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

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

describe('theory store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockFetch.mockReset();
    mockToast.showError.mockReset();
  });

  it('has correct initial state', () => {
    const store = useTheoryStore();
    expect(store.selectedRoot).toBe('C');
    expect(store.selectedScale).toBeNull();
    expect(store.selectedChord).toBeNull();
    expect(store.scales).toEqual([]);
    expect(store.chords).toEqual([]);
  });

  it('fetchScales populates scales', async () => {
    const scales = [
      { id: '1', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11], category: 'heptatonic' },
    ];
    mockFetch.mockResolvedValueOnce({ data: scales });

    const store = useTheoryStore();
    await store.fetchScales();

    expect(store.scales).toEqual(scales);
  });

  it('fetchScales shows error on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const store = useTheoryStore();
    await store.fetchScales();

    expect(mockToast.showError).toHaveBeenCalledWith('Failed to load scales', undefined);
  });

  it('fetchChords populates chords', async () => {
    const chords = [{ id: '1', name: 'Major', symbol: 'M', intervals: [0, 4, 7] }];
    mockFetch.mockResolvedValueOnce({ data: chords });

    const store = useTheoryStore();
    await store.fetchChords();

    expect(store.chords).toEqual(chords);
  });

  it('fetchChords shows error on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const store = useTheoryStore();
    await store.fetchChords();

    expect(mockToast.showError).toHaveBeenCalledWith('Failed to load chords', undefined);
  });

  it('setRoot changes selected root', () => {
    const store = useTheoryStore();
    store.setRoot('G');
    expect(store.selectedRoot).toBe('G');
  });

  it('setScale changes selected scale', () => {
    const store = useTheoryStore();
    const scale = {
      id: '1',
      name: 'Minor',
      intervals: [0, 2, 3, 5, 7, 8, 10],
      category: 'heptatonic',
    };
    store.setScale(scale);
    expect(store.selectedScale).toEqual(scale);
  });

  it('setChord changes selected chord', () => {
    const store = useTheoryStore();
    const chord = { id: '1', name: 'Minor', symbol: 'm', intervals: [0, 3, 7] };
    store.setChord(chord);
    expect(store.selectedChord).toEqual(chord);
  });
});
