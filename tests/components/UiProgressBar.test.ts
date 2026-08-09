import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import UiProgressBar from '~/components/ui/UiProgressBar.vue';

// Helper: the inner fill div has the .h-full class, the outer has .w-full.
const findFill = (wrapper: ReturnType<typeof mount>) => wrapper.find('.h-full');
const findTrack = (wrapper: ReturnType<typeof mount>) => wrapper.find('.w-full');

describe('UiProgressBar', () => {
  it('renders a bar with width set to the value', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 42 } });
    const fill = findFill(wrapper);
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('style')).toContain('width: 42%');
  });

  it('clamps value to 0–100', () => {
    const wNeg = mount(UiProgressBar, { props: { value: -10 } });
    expect(findFill(wNeg).attributes('style')).toContain('width: 0%');

    const wOver = mount(UiProgressBar, { props: { value: 150 } });
    expect(findFill(wOver).attributes('style')).toContain('width: 100%');
  });

  it('applies the primary color class by default', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50 } });
    const fill = findFill(wrapper);
    expect(fill.classes()).toContain('bg-primary');
  });

  it('applies the success color class when color=success', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50, color: 'success' } });
    const fill = findFill(wrapper);
    expect(fill.classes()).toContain('bg-success');
  });

  it('applies the warning color class when color=warning', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50, color: 'warning' } });
    const fill = findFill(wrapper);
    expect(fill.classes()).toContain('bg-warning');
  });

  it('applies the error color class when color=error', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50, color: 'error' } });
    const fill = findFill(wrapper);
    expect(fill.classes()).toContain('bg-error');
  });

  it('applies the smaller height class when size=sm', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50, size: 'sm' } });
    expect(findTrack(wrapper).classes()).toContain('h-1.5');
  });

  it('applies the larger height class when size=md', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50, size: 'md' } });
    expect(findTrack(wrapper).classes()).toContain('h-2.5');
  });

  it('applies the animated class when animated=true', () => {
    const wrapper = mount(UiProgressBar, { props: { value: 50, animated: true } });
    const fill = findFill(wrapper);
    expect(fill.classes()).toContain('progress-animated');
  });
});
