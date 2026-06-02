import { describe, it, expect, vi } from 'vitest';
import { mount, attachTo } from '@vue/test-utils';

import NordToast from '~/components/ui/NordToast.vue';

describe('NordToast', () => {
  it('renders the message text', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Hello' },
    });
    expect(document.body.textContent).toContain('Hello');
    wrapper.unmount();
  });

  it('has role="alert" and aria-live="polite"', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Test' },
    });
    const alert = document.body.querySelector('[role="alert"]') as HTMLElement | null;
    expect(alert).not.toBeNull();
    expect(alert!.getAttribute('aria-live')).toBe('polite');
    wrapper.unmount();
  });

  it('applies the type class for success', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'OK', type: 'success' },
    });
    const alert = document.body.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-success');
    wrapper.unmount();
  });

  it('applies the type class for error', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Bad', type: 'error' },
    });
    const alert = document.body.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-error');
    wrapper.unmount();
  });

  it('applies the type class for warning', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Warn', type: 'warning' },
    });
    const alert = document.body.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-warning');
    wrapper.unmount();
  });

  it('applies the type class for info', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Info', type: 'info' },
    });
    const alert = document.body.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-info');
    wrapper.unmount();
  });

  it('defaults to info class when no type is provided', () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Default' },
    });
    const alert = document.body.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('bg-info');
    wrapper.unmount();
  });

  it('emits dismiss when the dismiss button is clicked (state transition)', async () => {
    const wrapper = mount(NordToast, {
      attachTo: document.body,
      props: { message: 'Test', type: 'info', duration: 60000 }, // long duration to prevent auto-dismiss
    });
    const dismissButton = document.body.querySelector(
      'button[aria-label="Dismiss notification"]',
    ) as HTMLElement;
    expect(dismissButton).not.toBeNull();
    dismissButton.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('dismiss')).toBeTruthy();
    wrapper.unmount();
  });
});
