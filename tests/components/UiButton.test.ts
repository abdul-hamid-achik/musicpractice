import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import UiButton from '~/components/ui/UiButton.vue';

describe('UiButton', () => {
  it('renders a <button> element', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Click me' } });
    expect(wrapper.element.tagName).toBe('BUTTON');
  });

  it('renders slot content as label', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Submit' } });
    expect(wrapper.text()).toBe('Submit');
  });

  it('emits click event when clicked (state transition)', async () => {
    const wrapper = mount(UiButton, { slots: { default: 'Go' } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')!.length).toBe(1);
  });

  it('disables the button when disabled prop is true', () => {
    const wrapper = mount(UiButton, { props: { disabled: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('disables the button when loading prop is true', () => {
    const wrapper = mount(UiButton, { props: { loading: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('applies variant classes to the button', () => {
    const wrapper = mount(UiButton, { props: { variant: 'danger' } });
    const classes = wrapper.classes().join(' ');
    expect(classes).toContain('bg-error');
  });

  it('applies size classes', () => {
    const wrapper = mount(UiButton, { props: { size: 'lg' } });
    const classes = wrapper.classes().join(' ');
    expect(classes).toContain('text-lg');
  });

  it('renders a loading spinner when loading is true', () => {
    const wrapper = mount(UiButton, { props: { loading: true } });
    expect(wrapper.find('svg.animate-spin').exists()).toBe(true);
  });

  it('passes aria-label through', () => {
    const wrapper = mount(UiButton, { props: { ariaLabel: 'Save changes' } });
    expect(wrapper.attributes('aria-label')).toBe('Save changes');
  });

  it('passes aria-pressed through', () => {
    const wrapper = mount(UiButton, { props: { ariaPressed: true } });
    expect(wrapper.attributes('aria-pressed')).toBe('true');
  });

  it('passes aria-busy when loading', () => {
    const wrapper = mount(UiButton, { props: { loading: true } });
    expect(wrapper.attributes('aria-busy')).toBe('true');
  });

  it('uses button type by default', () => {
    const wrapper = mount(UiButton);
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('allows overriding the type attribute', () => {
    const wrapper = mount(UiButton, { props: { type: 'submit' } });
    expect(wrapper.attributes('type')).toBe('submit');
  });
});
