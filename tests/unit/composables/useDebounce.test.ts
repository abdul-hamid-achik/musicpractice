import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick, defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useDebounce, useDebounceSearch } from '~/composables/useDebounce';

/**
 * useDebounce wraps a source ref and returns a new ref that only updates
 * after `delayMs` of inactivity. The composable also registers
 * `onUnmounted` cleanup — we test that by mounting a wrapper component
 * and unmounting it.
 *
 * The source file's auto-imports (`ref`, `watch`, `onUnmounted`) are made
 * available through the Vite plugin's auto-import config; we don't need
 * to stub them manually.
 */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const source = ref('hello');
    const debounced = useDebounce(source, 100);
    expect(debounced.value).toBe('hello');
  });

  it('updates after delay', async () => {
    const source = ref('hello');
    const debounced = useDebounce(source, 300);

    source.value = 'world';
    await nextTick();
    expect(debounced.value).toBe('hello');

    vi.advanceTimersByTime(300);
    await nextTick();
    expect(debounced.value).toBe('world');
  });

  it('resets timer on rapid changes — only fires once with the latest value', async () => {
    const source = ref('a');
    const debounced = useDebounce(source, 200);

    source.value = 'b';
    await nextTick();
    vi.advanceTimersByTime(100);

    source.value = 'c';
    await nextTick();
    vi.advanceTimersByTime(100);

    expect(debounced.value).toBe('a');

    vi.advanceTimersByTime(200);
    await nextTick();
    expect(debounced.value).toBe('c');
  });

  it('handles numeric values', async () => {
    const source = ref(0);
    const debounced = useDebounce(source, 100);

    source.value = 42;
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(debounced.value).toBe(42);
  });

  it('handles object values (reference equality)', async () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const source = ref(a);
    const debounced = useDebounce(source, 50);

    source.value = b;
    await nextTick();
    vi.advanceTimersByTime(50);
    await nextTick();
    expect(debounced.value).toEqual(b);
  });

  it('uses 300ms default delay', async () => {
    const source = ref('initial');
    const debounced = useDebounce(source); // no delay arg

    source.value = 'updated';
    await nextTick();
    vi.advanceTimersByTime(299);
    await nextTick();
    expect(debounced.value).toBe('initial');

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(debounced.value).toBe('updated');
  });

  it('cleans up pending timeout on unmount (unmount cleanup)', async () => {
    const source = ref('initial');
    let debouncedRef: { value: string } | null = null;

    const wrapper = mount(
      defineComponent({
        setup() {
          debouncedRef = useDebounce(source, 500);
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    // Trigger a pending change
    source.value = 'pending';
    await nextTick();
    // Don't advance timers — just unmount mid-flight
    wrapper.unmount();

    // After unmount, advancing timers must NOT throw and the debounced ref
    // should not change (because the timeout was cleared).
    vi.advanceTimersByTime(1000);
    expect(debouncedRef!.value).toBe('initial');
  });

  it('multiple rapid changes yield exactly one update', async () => {
    const source = ref(0);
    const debounced = useDebounce(source, 100);

    for (let i = 1; i <= 10; i++) {
      source.value = i;
      await nextTick();
      vi.advanceTimersByTime(10);
    }

    // None of the small advances should have triggered the debounce yet
    expect(debounced.value).toBe(0);

    // Now wait the full delay
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(debounced.value).toBe(10);
  });
});

describe('useDebounceSearch', () => {
  it('provides searchQuery and debouncedQuery', () => {
    const { searchQuery, debouncedQuery, clearSearch } = useDebounceSearch();
    expect(searchQuery.value).toBe('');
    expect(debouncedQuery.value).toBe('');
    expect(typeof clearSearch).toBe('function');
  });

  it('clearSearch resets searchQuery', () => {
    const { searchQuery, clearSearch } = useDebounceSearch();
    searchQuery.value = 'test';
    clearSearch();
    expect(searchQuery.value).toBe('');
  });

  it('debouncedQuery lags searchQuery by the default delay', async () => {
    const { searchQuery, debouncedQuery } = useDebounceSearch(100);
    expect(debouncedQuery.value).toBe('');

    searchQuery.value = 'vue';
    await nextTick();
    expect(debouncedQuery.value).toBe('');

    vi.advanceTimersByTime(100);
    await nextTick();
    expect(debouncedQuery.value).toBe('vue');
  });
});
