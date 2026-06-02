import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import NordSkeleton from '~/components/ui/NordSkeleton.vue';

describe('NordSkeleton', () => {
  it('renders a div with animate-pulse class', () => {
    const wrapper = mount(NordSkeleton);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('animate-pulse');
  });

  it('applies the default width and height when no props are given', () => {
    const wrapper = mount(NordSkeleton);
    expect(wrapper.attributes('style')).toContain('width: 100%');
    expect(wrapper.attributes('style')).toContain('height: 1rem');
  });

  it('applies the width and height props', () => {
    const wrapper = mount(NordSkeleton, { props: { width: '200px', height: '2rem' } });
    expect(wrapper.attributes('style')).toContain('width: 200px');
    expect(wrapper.attributes('style')).toContain('height: 2rem');
  });

  it('applies the rounded-md class by default', () => {
    const wrapper = mount(NordSkeleton);
    expect(wrapper.classes()).toContain('rounded-md');
  });

  it('applies a custom rounded class', () => {
    const wrapper = mount(NordSkeleton, { props: { rounded: 'rounded-full' } });
    expect(wrapper.classes()).toContain('rounded-full');
  });
});
