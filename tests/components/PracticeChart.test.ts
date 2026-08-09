import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

const useFetchMock = vi.fn();
vi.stubGlobal('useFetch', useFetchMock);

import PracticeChart from '~/components/dashboard/PracticeChart.vue';

const UiSkeletonStub = {
  template: '<div class="ui-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

const sampleData = [
  { date: '2024-01-15', totalMinutes: 30, sessionCount: 1 },
  { date: '2024-01-16', totalMinutes: 45, sessionCount: 2 },
  { date: '2024-01-17', totalMinutes: 0, sessionCount: 0 },
  { date: '2024-01-18', totalMinutes: 60, sessionCount: 3 },
  { date: '2024-01-19', totalMinutes: 15, sessionCount: 1 },
  { date: '2024-01-20', totalMinutes: 90, sessionCount: 4 },
  { date: '2024-01-21', totalMinutes: 0, sessionCount: 0 },
];

describe('PracticeChart', () => {
  it('renders the loading skeleton when status is pending', async () => {
    useFetchMock.mockReturnValue({ data: ref(null), status: ref('pending') });
    const wrapper = mount(
      { template: '<Suspense><PracticeChart /></Suspense>', components: { PracticeChart } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.html()).toContain('Loading chart');
  });

  it('renders one bar per day in the data', async () => {
    useFetchMock.mockReturnValue({ data: ref(sampleData), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeChart /></Suspense>', components: { PracticeChart } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    const barGroups = wrapper.findAll('.bar-group');
    expect(barGroups).toHaveLength(7);
  });

  it('renders bar values showing minutes when > 0', async () => {
    useFetchMock.mockReturnValue({ data: ref(sampleData), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeChart /></Suspense>', components: { PracticeChart } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    // Round 30, 45, 60, 15, 90
    expect(wrapper.text()).toContain('30m');
    expect(wrapper.text()).toContain('45m');
    expect(wrapper.text()).toContain('60m');
    expect(wrapper.text()).toContain('15m');
    expect(wrapper.text()).toContain('90m');
  });

  it('hides bar values for zero-minute days', async () => {
    useFetchMock.mockReturnValue({ data: ref(sampleData), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeChart /></Suspense>', components: { PracticeChart } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    // The two zero-minute days have empty bar-value divs
    const zeroBars = wrapper.findAll('.bar-value.bar-zero');
    expect(zeroBars).toHaveLength(2);
  });

  it('renders day-of-week labels for each bar', async () => {
    useFetchMock.mockReturnValue({ data: ref(sampleData), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeChart /></Suspense>', components: { PracticeChart } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    const labels = wrapper.findAll('.bar-label');
    expect(labels).toHaveLength(7);
  });

  it('sets a tooltip on each bar with the date and minutes', async () => {
    useFetchMock.mockReturnValue({ data: ref(sampleData), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeChart /></Suspense>', components: { PracticeChart } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    const fills = wrapper.findAll('.bar-fill');
    const titles = fills.map((f) => f.attributes('title'));
    expect(titles.some((t) => t?.includes('30 min'))).toBe(true);
    expect(titles.some((t) => t?.includes('90 min'))).toBe(true);
  });
});
