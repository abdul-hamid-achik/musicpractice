import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useInstrumentStore } from '~/stores/instrument';

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

describe('instrument store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockFetch.mockReset();
    mockToast.showError.mockReset();
  });

  it('has correct initial state', () => {
    const store = useInstrumentStore();
    expect(store.instruments).toEqual([]);
    expect(store.activeInstrument).toBeNull();
    expect(store.activeInstrumentId).toBe('');
  });

  it('fetchInstruments populates instruments', async () => {
    const instruments = [
      {
        id: '1',
        name: 'Acoustic Guitar',
        type: 'guitar',
        tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
        stringCount: 6,
        fretCount: 20,
      },
      {
        id: '2',
        name: 'Electric Bass',
        type: 'bass',
        tuning: ['E', 'A', 'D', 'G'],
        stringCount: 4,
        fretCount: 24,
      },
    ];
    mockFetch.mockResolvedValueOnce({ data: instruments });

    const store = useInstrumentStore();
    await store.fetchInstruments();

    expect(store.instruments).toEqual(instruments);
  });

  it('fetchInstruments shows error toast on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const store = useInstrumentStore();
    await store.fetchInstruments();

    expect(mockToast.showError).toHaveBeenCalledWith('Failed to load instruments', undefined);
    expect(store.instruments).toEqual([]);
  });

  it('setActiveInstrument sets active instrument by id', async () => {
    const instruments = [
      { id: '1', name: 'Guitar', type: 'guitar', tuning: ['E'], stringCount: 6, fretCount: 20 },
      { id: '2', name: 'Bass', type: 'bass', tuning: ['E'], stringCount: 4, fretCount: 24 },
    ];
    mockFetch.mockResolvedValueOnce({ data: instruments });

    const store = useInstrumentStore();
    await store.fetchInstruments();
    store.setActiveInstrument('2');

    expect(store.activeInstrumentId).toBe('2');
    expect(store.activeInstrument?.name).toBe('Bass');
  });

  it('setActiveInstrument sets null for unknown id', async () => {
    mockFetch.mockResolvedValueOnce({ data: [] });

    const store = useInstrumentStore();
    store.setActiveInstrument('unknown');

    expect(store.activeInstrument).toBeNull();
  });

  it('instrumentsByType groups instruments correctly', async () => {
    const instruments = [
      { id: '1', name: 'Guitar A', type: 'guitar', tuning: ['E'], stringCount: 6, fretCount: 20 },
      { id: '2', name: 'Guitar B', type: 'guitar', tuning: ['E'], stringCount: 6, fretCount: 22 },
      { id: '3', name: 'Bass A', type: 'bass', tuning: ['E'], stringCount: 4, fretCount: 24 },
    ];
    mockFetch.mockResolvedValueOnce({ data: instruments });

    const store = useInstrumentStore();
    await store.fetchInstruments();

    expect(store.instrumentsByType.guitar).toHaveLength(2);
    expect(store.instrumentsByType.bass).toHaveLength(1);
  });
});
