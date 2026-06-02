import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useToast } from '~/composables/useToast';

const mockToastStore = {
  toasts: ref([]),
  showToast: vi.fn().mockReturnValue('test-id'),
  removeToast: vi.fn(),
  showSuccess: vi.fn().mockReturnValue('test-id'),
  showError: vi.fn().mockReturnValue('test-id'),
  showInfo: vi.fn().mockReturnValue('test-id'),
  showWarning: vi.fn().mockReturnValue('test-id'),
  clearAll: vi.fn(),
};
vi.stubGlobal('useToastStore', () => mockToastStore);

describe('useToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('showToast delegates to store', () => {
    const { showToast } = useToast();
    const id = showToast('Test', 'success');
    expect(mockToastStore.showToast).toHaveBeenCalledWith('Test', 'success', undefined);
    expect(id).toBe('test-id');
  });

  it('showSuccess delegates to store', () => {
    const { showSuccess } = useToast();
    showSuccess('Done');
    expect(mockToastStore.showSuccess).toHaveBeenCalledWith('Done', undefined);
  });

  it('showError delegates to store', () => {
    const { showError } = useToast();
    showError('Oops');
    expect(mockToastStore.showError).toHaveBeenCalledWith('Oops', undefined);
  });

  it('showInfo delegates to store', () => {
    const { showInfo } = useToast();
    showInfo('FYI');
    expect(mockToastStore.showInfo).toHaveBeenCalledWith('FYI', undefined);
  });

  it('showWarning delegates to store', () => {
    const { showWarning } = useToast();
    showWarning('Careful');
    expect(mockToastStore.showWarning).toHaveBeenCalledWith('Careful', undefined);
  });

  it('removeToast delegates to store', () => {
    const { removeToast } = useToast();
    removeToast('abc');
    expect(mockToastStore.removeToast).toHaveBeenCalledWith('abc');
  });

  it('clearAll delegates to store', () => {
    const { clearAll } = useToast();
    clearAll();
    expect(mockToastStore.clearAll).toHaveBeenCalled();
  });

  it('passes duration through to store', () => {
    const { showToast } = useToast();
    showToast('Test', 'info', 5000);
    expect(mockToastStore.showToast).toHaveBeenCalledWith('Test', 'info', 5000);
  });
});
