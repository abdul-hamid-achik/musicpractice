import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToastStore } from '~/stores/toast';

describe('toast store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  it('has correct initial state', () => {
    const store = useToastStore();
    expect(store.toasts).toEqual([]);
  });

  it('showToast adds a toast with correct properties', () => {
    const store = useToastStore();
    store.showToast('Test message', 'success');

    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0]!.message).toBe('Test message');
    expect(store.toasts[0]!.type).toBe('success');
    expect(store.toasts[0]!.id).toBeDefined();
  });

  it('showSuccess creates a success toast', () => {
    const store = useToastStore();
    store.showSuccess('Success!');
    expect(store.toasts[0]!.type).toBe('success');
    expect(store.toasts[0]!.message).toBe('Success!');
  });

  it('showError creates an error toast', () => {
    const store = useToastStore();
    store.showError('Error!');
    expect(store.toasts[0]!.type).toBe('error');
  });

  it('showInfo creates an info toast', () => {
    const store = useToastStore();
    store.showInfo('Info!');
    expect(store.toasts[0]!.type).toBe('info');
  });

  it('showWarning creates a warning toast', () => {
    const store = useToastStore();
    store.showWarning('Warning!');
    expect(store.toasts[0]!.type).toBe('warning');
  });

  it('removeToast removes a toast by id', () => {
    const store = useToastStore();
    const id = store.showToast('Test', 'info');
    expect(store.toasts).toHaveLength(1);
    store.removeToast(id);
    expect(store.toasts).toHaveLength(0);
  });

  it('removeToast does nothing for unknown id', () => {
    const store = useToastStore();
    store.showToast('Test', 'info');
    store.removeToast('nonexistent');
    expect(store.toasts).toHaveLength(1);
  });

  it('clearAll removes all toasts', () => {
    const store = useToastStore();
    store.showToast('A', 'info');
    store.showToast('B', 'info');
    expect(store.toasts).toHaveLength(2);
    store.clearAll();
    expect(store.toasts).toHaveLength(0);
  });

  it('auto-dismisses toast after duration', () => {
    const store = useToastStore();
    store.showToast('Auto dismiss', 'info', 1000);
    expect(store.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(store.toasts).toHaveLength(0);
  });

  it('returns toast id from showToast', () => {
    const store = useToastStore();
    const id = store.showToast('Test', 'info');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
