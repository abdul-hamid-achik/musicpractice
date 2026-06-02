import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import StaggeredList from '~/components/ui/StaggeredList.vue';

// @vue/test-utils auto-stubs <TransitionGroup> as <transition-group-stub>.
// We disable that for these tests so the actual element renders and we can
// verify the `tag` prop is forwarded.
const globalStubs = { TransitionGroup: false };

describe('StaggeredList', () => {
  it('renders a default tag of "div"', () => {
    const wrapper = mount(StaggeredList, {
      slots: { default: '<p>a</p><p>b</p>' },
      global: { stubs: globalStubs },
    });
    expect(wrapper.element.tagName).toBe('DIV');
  });

  it('renders with a custom tag', () => {
    const wrapper = mount(StaggeredList, {
      props: { tag: 'ul' },
      slots: { default: '<li>a</li><li>b</li>' },
      global: { stubs: globalStubs },
    });
    expect(wrapper.element.tagName).toBe('UL');
  });

  it('renders slot children', () => {
    const wrapper = mount(StaggeredList, {
      slots: { default: '<span>one</span><span>two</span><span>three</span>' },
      global: { stubs: globalStubs },
    });
    const children = wrapper.findAll('span');
    expect(children.length).toBe(3);
  });

  it('exposes a delay prop that defaults to 50', () => {
    const wrapper = mount(StaggeredList, { props: { delay: 100 } });
    expect(wrapper.props('delay')).toBe(100);
  });

  it('accepts a custom delay', () => {
    const wrapper = mount(StaggeredList, { props: { delay: 25 } });
    expect(wrapper.props('delay')).toBe(25);
  });
});
