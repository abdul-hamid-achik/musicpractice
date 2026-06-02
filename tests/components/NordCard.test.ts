import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import NordCard from '~/components/ui/NordCard.vue';

describe('NordCard', () => {
  it('renders the default slot content', () => {
    const wrapper = mount(NordCard, { slots: { default: 'Card body' } });
    expect(wrapper.text()).toBe('Card body');
  });

  it('renders the title prop as an h3', () => {
    const wrapper = mount(NordCard, {
      props: { title: 'My Card' },
      slots: { default: 'Content' },
    });
    const h3 = wrapper.find('h3');
    expect(h3.exists()).toBe(true);
    expect(h3.text()).toBe('My Card');
  });

  it('renders the header slot when provided (overrides title)', () => {
    const wrapper = mount(NordCard, {
      props: { title: 'Should be ignored' },
      slots: {
        default: 'Body',
        header: '<h2 class="custom">Custom header</h2>',
      },
    });
    expect(wrapper.find('h2.custom').exists()).toBe(true);
    expect(wrapper.find('h2.custom').text()).toBe('Custom header');
  });

  it('renders the footer slot when provided', () => {
    const wrapper = mount(NordCard, {
      slots: {
        default: 'Body',
        footer: '<button>OK</button>',
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('applies custom padding class', () => {
    const wrapper = mount(NordCard, { props: { padding: 'p-3' } });
    expect(wrapper.classes()).toContain('p-3');
  });

  it('applies default padding when padding is not provided', () => {
    const wrapper = mount(NordCard);
    expect(wrapper.classes()).toContain('p-6');
  });

  it('does not render a footer when no footer slot is provided', () => {
    const wrapper = mount(NordCard, { slots: { default: 'Body' } });
    // The footer div has mt-4 pt-4 border-t classes
    const footerDivs = wrapper.findAll('div.mt-4');
    expect(footerDivs.length).toBe(0);
  });
});
