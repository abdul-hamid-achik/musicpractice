import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import AppFooter from '~/components/ui/AppFooter.vue';

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to', 'ariaCurrent'],
};

describe('AppFooter', () => {
  it('renders the brand name and year', () => {
    const wrapper = mount(AppFooter, {
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain('MusicPractice');
    expect(wrapper.text()).toMatch(/©\s*\d{4}\s*MusicPractice/);
  });

  it('has role="contentinfo" on the footer element', () => {
    const wrapper = mount(AppFooter, {
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.find('footer[role="contentinfo"]').exists()).toBe(true);
  });

  it('renders the footer navigation with 4 links', () => {
    const wrapper = mount(AppFooter, {
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    const nav = wrapper.find('nav[role="navigation"][aria-label="Footer navigation"]');
    expect(nav.exists()).toBe(true);
    const links = nav.findAll('a');
    expect(links.length).toBe(4);
  });

  it('renders the expected link labels', () => {
    const wrapper = mount(AppFooter, {
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    for (const label of ['Practice', 'Instruments', 'Theory', 'Songs']) {
      expect(wrapper.text()).toContain(label);
    }
  });
});
