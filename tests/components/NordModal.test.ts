import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import NordModal from '~/components/ui/NordModal.vue';

describe('NordModal', () => {
  // Teleport to body works only when the component is attached to the DOM.
  // Without attachTo, @vue/test-utils renders Teleport content outside the wrapper.
  it('does not render the dialog when open is false', () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: false, title: 'Test' },
      slots: { default: 'Content' },
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    wrapper.unmount();
  });

  it('renders the dialog when open is true', () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true, title: 'Test' },
      slots: { default: 'Content' },
    });
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('aria-modal')).toBe('true');
    expect(dialog!.getAttribute('aria-label')).toBe('Test');
    wrapper.unmount();
  });

  it('renders the slot content inside the dialog', () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true, title: 'Test' },
      slots: { default: '<p>Hello world</p>' },
    });
    expect(document.body.textContent).toContain('Hello world');
    wrapper.unmount();
  });

  it('renders the title as an h2', () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true, title: 'My Title' },
      slots: { default: 'Body' },
    });
    const h2 = document.querySelector('h2') as HTMLElement | null;
    expect(h2).not.toBeNull();
    expect(h2!.textContent).toBe('My Title');
    wrapper.unmount();
  });

  it('renders a close button with an aria-label', () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true, title: 'T' },
      slots: { default: 'C' },
    });
    const closeButton = document.querySelector('button[aria-label="Close dialog"]');
    expect(closeButton).not.toBeNull();
    wrapper.unmount();
  });

  it('emits close when the close button is clicked (state transition)', async () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true, title: 'T' },
      slots: { default: 'C' },
    });
    const closeButton = document.querySelector('button[aria-label="Close dialog"]') as HTMLElement;
    closeButton.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
    wrapper.unmount();
  });

  it('emits close when Escape key is pressed (state transition)', async () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true, title: 'T' },
      slots: { default: 'C' },
    });
    // The keydown listener is on the backdrop div
    const backdrop = document.querySelector('.bg-\\[var\\(--color-backdrop\\)\\]') as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
    wrapper.unmount();
  });

  it('does not render an h2 when no title is provided', () => {
    const wrapper = mount(NordModal, {
      attachTo: document.body,
      props: { open: true },
      slots: { default: 'C' },
    });
    expect(document.querySelector('h2')).toBeNull();
    wrapper.unmount();
  });
});
