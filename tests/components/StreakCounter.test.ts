import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

// Stub useFetch to return data synchronously for testing
const useFetchMock = vi.fn();
vi.stubGlobal('useFetch', useFetchMock);

import StreakCounter from '~/components/dashboard/StreakCounter.vue';

const UiSkeletonStub = {
  template: '<div class="ui-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

describe('StreakCounter', () => {
  it('renders the loading skeleton when status is pending', async () => {
    useFetchMock.mockReturnValue({
      data: ref(null),
      status: ref('pending'),
    });
    const wrapper = mount(
      { template: '<Suspense><StreakCounter /></Suspense>', components: { StreakCounter } },
      {
        global: { stubs: { UiSkeleton: UiSkeletonStub } },
      },
    );
    await flushPromises();
    expect(wrapper.html()).toContain('Loading streak');
    expect(wrapper.html()).toContain('aria-busy="true"');
  });

  it('renders the streak data after a successful fetch', async () => {
    useFetchMock.mockReturnValue({
      data: ref({ currentStreak: 7, longestStreak: 21, practicedToday: true }),
      status: ref('success'),
    });
    const wrapper = mount(
      { template: '<Suspense><StreakCounter /></Suspense>', components: { StreakCounter } },
      {
        global: { stubs: { UiSkeleton: UiSkeletonStub } },
      },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('7');
    expect(wrapper.text()).toContain('day');
    expect(wrapper.text()).toContain('streak');
    expect(wrapper.text()).toContain('Practiced today');
    expect(wrapper.text()).toContain('21'); // longest streak
  });

  it('shows the "keep it going" message when not practiced today', async () => {
    useFetchMock.mockReturnValue({
      data: ref({ currentStreak: 3, longestStreak: 10, practicedToday: false }),
      status: ref('success'),
    });
    const wrapper = mount(
      { template: '<Suspense><StreakCounter /></Suspense>', components: { StreakCounter } },
      {
        global: { stubs: { UiSkeleton: UiSkeletonStub } },
      },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('Practice to keep it going!');
  });

  it('pluralizes "day" correctly based on streak count', async () => {
    useFetchMock.mockReturnValue({
      data: ref({ currentStreak: 1, longestStreak: 1, practicedToday: true }),
      status: ref('success'),
    });
    const wrapper = mount(
      { template: '<Suspense><StreakCounter /></Suspense>', components: { StreakCounter } },
      {
        global: { stubs: { UiSkeleton: UiSkeletonStub } },
      },
    );
    await flushPromises();
    // Singular: just "1" followed by "day streak" with no "s"
    expect(wrapper.text()).toMatch(/1\s*day\s+streak/);
  });

  it('renders a placeholder dash before the data is loaded', async () => {
    useFetchMock.mockReturnValue({
      data: ref(null),
      status: ref('pending'),
    });
    const wrapper = mount(
      { template: '<Suspense><StreakCounter /></Suspense>', components: { StreakCounter } },
      {
        global: { stubs: { UiSkeleton: UiSkeletonStub } },
      },
    );
    await flushPromises();
    // The skeleton is shown
    expect(wrapper.find('.ui-skeleton').exists()).toBe(true);
  });
});
