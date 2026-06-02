import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

const useFetchMock = vi.fn();
vi.stubGlobal('useFetch', useFetchMock);

import SkillProgress from '~/components/dashboard/SkillProgress.vue';

const NordSkeletonStub = {
  template: '<div class="nord-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

const skills = [
  {
    id: '1',
    songTitle: 'Wonderwall',
    completionPercent: 85,
    maxTempoBpm: 92,
    lastPracticedAt: '2024-01-15T10:00:00Z',
    practiceCount: 12,
  },
  {
    id: '2',
    songTitle: 'Blackbird',
    completionPercent: 50,
    maxTempoBpm: 78,
    lastPracticedAt: '2024-01-14T10:00:00Z',
    practiceCount: 5,
  },
  {
    id: '3',
    songTitle: null,
    completionPercent: 25,
    maxTempoBpm: null,
    lastPracticedAt: null,
    practiceCount: 1,
  },
];

describe('SkillProgress', () => {
  it('renders the loading skeleton when status is pending', async () => {
    useFetchMock.mockReturnValue({ data: ref(null), status: ref('pending') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.html()).toContain('Loading progress');
  });

  it('shows an empty state when no skills are tracked', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: [] }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('No song progress tracked yet');
  });

  it('renders one skill item per progress entry', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: skills }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    const items = wrapper.findAll('.skill-item');
    expect(items).toHaveLength(3);
  });

  it('shows the song title and completion percentage', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: skills }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('Wonderwall');
    expect(wrapper.text()).toContain('85%');
    expect(wrapper.text()).toContain('Blackbird');
    expect(wrapper.text()).toContain('50%');
  });

  it('shows "Unknown Song" when songTitle is null', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: skills }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('Unknown Song');
  });

  it('shows the max BPM when set', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: skills }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('92 BPM max');
  });

  it('pluralizes the session count', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: skills }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    expect(wrapper.text()).toContain('12 sessions');
    expect(wrapper.text()).toContain('1 session');
  });

  it('sets the progress-fill width to the completion percentage', async () => {
    useFetchMock.mockReturnValue({ data: ref({ data: skills }), status: ref('success') });
    const wrapper = mount(
      { template: '<Suspense><SkillProgress /></Suspense>', components: { SkillProgress } },
      { global: { stubs: { NordSkeleton: NordSkeletonStub } } },
    );
    await flushPromises();
    const fills = wrapper.findAll('.progress-fill');
    const widths = fills.map((f) => f.attributes('style'));
    expect(widths.some((w) => w?.includes('width: 85%'))).toBe(true);
    expect(widths.some((w) => w?.includes('width: 50%'))).toBe(true);
  });
});
