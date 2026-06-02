import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn(() => 0),
  Synth: vi.fn(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('~/composables/useMusicTheory', () => ({
  useMusicTheory: () => ({
    getNoteNames: () => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    getScaleNotes: (root: string, intervals: number[]) => {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const idx = names.indexOf(root);
      return intervals.map((i) => names[(idx + i) % 12]);
    },
  }),
}));

const majorScale = {
  id: 'major',
  name: 'Major',
  intervals: [0, 2, 4, 5, 7, 9, 11],
  category: 'diatonic',
  description: 'The standard major scale.',
};
const pentatonicMinor = {
  id: 'pent-min',
  name: 'Minor Pentatonic',
  intervals: [0, 3, 5, 7, 10],
  category: 'pentatonic',
  description: 'Five-note minor scale.',
};
const theoryStoreMock = {
  chords: [] as Array<unknown>,
  scales: [majorScale, pentatonicMinor] as Array<typeof majorScale>,
  selectedRoot: ref('C'),
  selectedChord: ref(null),
  selectedScale: ref(majorScale),
  fetchChords: vi.fn().mockResolvedValue(undefined),
  fetchScales: vi.fn().mockResolvedValue(undefined),
  setRoot: vi.fn(),
  setChord: vi.fn(),
  setScale: vi.fn(),
};
vi.mock('~/stores/theory', () => ({ useTheoryStore: () => theoryStoreMock }));

const NordSkeletonStub = {
  template: '<div class="nord-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

import ScaleExplorer from '~/components/theory/ScaleExplorer.vue';

describe('ScaleExplorer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    theoryStoreMock.setScale.mockClear();
    theoryStoreMock.setRoot.mockClear();
  });

  it('renders the title and scale name', async () => {
    const wrapper = mount(ScaleExplorer, {
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Scale Explorer');
    expect(wrapper.text()).toContain('C Major');
  });

  it('renders a Play Scale control', async () => {
    const wrapper = mount(ScaleExplorer, {
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Play Scale');
  });

  it('renders 12 root note buttons (C through B)', async () => {
    const wrapper = mount(ScaleExplorer, {
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    const noteButtons = wrapper.findAll('button').filter((b) => {
      const t = b.text().trim();
      return /^[A-G]#?$/.test(t);
    });
    expect(noteButtons).toHaveLength(12);
  });

  it('emits scaleSelected on initial load with the first scale', async () => {
    const wrapper = mount(ScaleExplorer, {
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('scaleSelected')).toBeTruthy();
    const payload = wrapper.emitted('scaleSelected')![0]![0] as {
      root: string;
      scale: { name: string };
      notes: string[];
    };
    expect(payload.root).toBe('C');
    expect(payload.scale.name).toBe('Major');
    expect(payload.notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('calls setRoot and emits scaleSelected when a different root is picked (state transition)', async () => {
    const wrapper = mount(ScaleExplorer, {
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    wrapper.emitted('scaleSelected')!.length = 0;

    const dButton = wrapper.findAll('button').find((b) => b.text().trim() === 'D')!;
    await dButton.trigger('click');

    expect(theoryStoreMock.setRoot).toHaveBeenCalledWith('D');
    expect(wrapper.emitted('scaleSelected')).toBeTruthy();
    const payload = wrapper.emitted('scaleSelected')!.pop()![0] as {
      root: string;
      notes: string[];
    };
    expect(payload.root).toBe('D');
    expect(payload.notes).toEqual(['D', 'E', 'F#', 'G', 'A', 'B', 'C#']);
  });

  it('renders the scale description', async () => {
    const wrapper = mount(ScaleExplorer, {
      global: { stubs: { NordSkeleton: NordSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('The standard major scale.');
  });
});
