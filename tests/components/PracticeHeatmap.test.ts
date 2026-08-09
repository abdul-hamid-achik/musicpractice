import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

const useFetchMock = vi.fn();
vi.stubGlobal('useFetch', useFetchMock);

import PracticeHeatmap from '~/components/dashboard/PracticeHeatmap.vue';

const UiSkeletonStub = {
  template: '<div class="ui-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

describe('PracticeHeatmap', () => {
  it('renders the loading skeleton when status is pending', async () => {
    useFetchMock.mockReturnValue({ data: ref(null), status: ref('pending') });
    const wrapper = mount(
      { template: '<Suspense><PracticeHeatmap /></Suspense>', components: { PracticeHeatmap } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.html()).toContain('Loading heatmap');
  });

  it('renders exactly 90 cells (3 months of days)', async () => {
    useFetchMock.mockReturnValue({ data: ref([]), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeHeatmap /></Suspense>', components: { PracticeHeatmap } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    // Total cells = 90 data + 5 legend = 95
    const allCells = wrapper.findAll('.heatmap-cell');
    const dataCells = allCells.filter((c) => c.attributes('title') !== undefined);
    expect(dataCells).toHaveLength(90);
  });

  it('applies the correct level class based on minutes', async () => {
    const today = new Date();
    const isoDate = (d: Date) => d.toISOString().split('T')[0]!;
    useFetchMock.mockReturnValue({
      data: ref([
        { date: isoDate(today), totalMinutes: 0, sessionCount: 0 },
        { date: isoDate(new Date(today.getTime() - 86400000)), totalMinutes: 10, sessionCount: 1 },
        {
          date: isoDate(new Date(today.getTime() - 2 * 86400000)),
          totalMinutes: 25,
          sessionCount: 1,
        },
        {
          date: isoDate(new Date(today.getTime() - 3 * 86400000)),
          totalMinutes: 45,
          sessionCount: 2,
        },
        {
          date: isoDate(new Date(today.getTime() - 4 * 86400000)),
          totalMinutes: 90,
          sessionCount: 3,
        },
      ]),
      status: ref('success'),
    });
    const wrapper = mount(
      { template: '<Suspense><PracticeHeatmap /></Suspense>', components: { PracticeHeatmap } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();

    expect(wrapper.findAll('.level-0').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.level-1').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.level-2').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.level-3').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.level-4').length).toBeGreaterThan(0);
  });

  it('renders a legend with all 5 levels', async () => {
    useFetchMock.mockReturnValue({ data: ref([]), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeHeatmap /></Suspense>', components: { PracticeHeatmap } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    const legend = wrapper.find('.heatmap-legend');
    expect(legend.exists()).toBe(true);
    expect(legend.findAll('.heatmap-cell').length).toBe(5);
  });

  it('renders tooltips with date and minutes for each cell', async () => {
    useFetchMock.mockReturnValue({ data: ref([]), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><PracticeHeatmap /></Suspense>', components: { PracticeHeatmap } },
      { global: { stubs: { UiSkeleton: UiSkeletonStub } } },
    );
    await flushPromises();
    // All 90 data cells have a title attribute with "min" in it
    const dataCells = wrapper
      .findAll('.heatmap-cell')
      .filter((c) => c.attributes('title') !== undefined);
    expect(dataCells).toHaveLength(90);
    const titles = dataCells.map((c) => c.attributes('title'));
    expect(titles.every((t) => t?.includes('min'))).toBe(true);
  });
});
