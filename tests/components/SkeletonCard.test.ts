import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SkeletonCard from '~/components/ui/SkeletonCard.vue';

const NordSkeletonStub = {
  template: '<div class="nord-skeleton-stub" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

describe('SkeletonCard', () => {
  it('renders the card variant by default with 3 inner skeletons', () => {
    const wrapper = mount(SkeletonCard, { global: { stubs: { NordSkeleton: NordSkeletonStub } } });
    expect(wrapper.find('.nord-skeleton-stub').exists()).toBe(true);
    expect(wrapper.findAll('.nord-skeleton-stub')).toHaveLength(3);
  });

  it('has aria-busy and aria-label on the card variant', () => {
    const wrapper = mount(SkeletonCard, { global: { stubs: { NordSkeleton: NordSkeletonStub } } });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.attributes('aria-label')).toBe('Loading content...');
  });

  it('renders the text variant with N lines (default 3)', () => {
    const wrapper = mount(SkeletonCard, {
      props: { variant: 'text' },
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    expect(wrapper.findAll('.nord-skeleton-stub')).toHaveLength(3);
  });

  it('renders the text variant with a custom number of lines', () => {
    const wrapper = mount(SkeletonCard, {
      props: { variant: 'text', lines: 5 },
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    expect(wrapper.findAll('.nord-skeleton-stub')).toHaveLength(5);
  });

  it('renders the circle variant', () => {
    const wrapper = mount(SkeletonCard, {
      props: { variant: 'circle', width: '40px', height: '40px' },
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    expect(wrapper.find('.rounded-full').exists()).toBe(true);
    expect(wrapper.attributes('aria-label')).toBe('Loading...');
  });

  it('renders the image variant', () => {
    const wrapper = mount(SkeletonCard, {
      props: { variant: 'image', width: '200px', height: '100px' },
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    expect(wrapper.find('.rounded-lg').exists()).toBe(true);
    expect(wrapper.attributes('aria-label')).toBe('Loading image...');
  });

  it('all variants have aria-busy="true"', () => {
    for (const variant of ['card', 'text', 'circle', 'image'] as const) {
      const wrapper = mount(SkeletonCard, {
        props: { variant },
        global: { stubs: { NordSkeleton: NordSkeletonStub } },
      });
      expect(wrapper.attributes('aria-busy')).toBe('true');
    }
  });
});
