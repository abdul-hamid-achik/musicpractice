import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PracticeTimer from '~/components/practice/PracticeTimer.vue';

describe('PracticeTimer', () => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  it('renders the formatted elapsed time', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: false, elapsed: 125, formatTime },
    });
    expect(wrapper.text()).toContain('2:05');
  });

  it('renders zero time when elapsed is 0', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: false, elapsed: 0, formatTime },
    });
    expect(wrapper.text()).toContain('0:00');
  });

  it('uses the formatTime function passed in via props', () => {
    const customFormat = (s: number) => `${s}s`;
    const wrapper = mount(PracticeTimer, {
      props: { isActive: true, elapsed: 42, formatTime: customFormat },
    });
    expect(wrapper.text()).toContain('42s');
  });

  it('shows "Session in progress" when isActive is true and not paused', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: true, isPaused: false, elapsed: 60, formatTime },
    });
    expect(wrapper.text()).toContain('Session in progress');
  });

  it('shows "Session paused" when isPaused is true', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: true, isPaused: true, elapsed: 60, formatTime },
    });
    expect(wrapper.text()).toContain('Session paused');
  });

  it('does not show a session status when isActive is false', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: false, elapsed: 0, formatTime },
    });
    expect(wrapper.text()).not.toContain('Session in progress');
    expect(wrapper.text()).not.toContain('Session paused');
  });

  it('applies warning color class when paused', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: true, isPaused: true, elapsed: 60, formatTime },
    });
    expect(wrapper.html()).toContain('text-warning');
  });

  it('applies normal text class when not paused', () => {
    const wrapper = mount(PracticeTimer, {
      props: { isActive: true, isPaused: false, elapsed: 60, formatTime },
    });
    expect(wrapper.html()).toContain('text-text');
  });
});
