import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

// Plain array — same issue as InstrumentSelector: a ref is iterated as if
// its 5 properties (__v_isRef, _value, etc.) were items.
const toasts: Array<{ id: string; message: string; type: string; duration?: number }> = [];
const toastStoreMock = {
  toasts,
  showToast: vi.fn(),
  removeToast: vi.fn((id: string) => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) toasts.splice(i, 1);
  }),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
};
vi.stubGlobal('useToastStore', () => toastStoreMock);

import ToastManager from '~/components/ui/ToastManager.vue';

const NordToastStub = {
  template:
    '<div class="nord-toast-stub" :data-type="type" :data-message="message"><slot /><button class="dismiss-stub" @click="$emit(\'dismiss\')">x</button></div>',
  props: ['message', 'type', 'duration'],
  emits: ['dismiss'],
};

describe('ToastManager', () => {
  beforeEach(() => {
    // Ensure a clean body for each test (Teleport targets body)
    document.body.innerHTML = '';
    toasts.length = 0;
    toastStoreMock.removeToast.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders no toasts when the store is empty', () => {
    const wrapper = mount(ToastManager, {
      attachTo: document.body,
      global: { stubs: { NordToast: NordToastStub } },
    });
    expect(document.body.querySelectorAll('.nord-toast-stub').length).toBe(0);
    wrapper.unmount();
  });

  it('renders one toast per entry in the store', () => {
    toasts.push(
      { id: '1', message: 'First toast', type: 'success' },
      { id: '2', message: 'Second toast', type: 'error' },
    );
    const wrapper = mount(ToastManager, {
      attachTo: document.body,
      global: { stubs: { NordToast: NordToastStub } },
    });
    const toastsRendered = document.body.querySelectorAll('.nord-toast-stub');
    expect(toastsRendered.length).toBe(2);
    expect(toastsRendered[0]!.getAttribute('data-message')).toBe('First toast');
    expect(toastsRendered[1]!.getAttribute('data-type')).toBe('error');
    wrapper.unmount();
  });

  it('has an aria-live="polite" status region for screen readers', () => {
    toasts.push({ id: '1', message: 'Announce me', type: 'info' });
    const wrapper = mount(ToastManager, {
      attachTo: document.body,
      global: { stubs: { NordToast: NordToastStub } },
    });
    const status = document.body.querySelector('[role="status"][aria-live="polite"]');
    expect(status).not.toBeNull();
    expect(status!.textContent).toContain('Announce me');
    wrapper.unmount();
  });

  it('calls removeToast when a toast emits dismiss (state transition)', async () => {
    toasts.push({ id: 'a', message: 'A', type: 'info' });
    const wrapper = mount(ToastManager, {
      attachTo: document.body,
      global: { stubs: { NordToast: NordToastStub } },
    });
    const dismissBtn = document.body.querySelector('.dismiss-stub') as HTMLElement;
    expect(dismissBtn).not.toBeNull();
    dismissBtn.click();
    await flushPromises();
    expect(toastStoreMock.removeToast).toHaveBeenCalledWith('a');
    wrapper.unmount();
  });
});
