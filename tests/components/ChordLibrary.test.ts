import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn(() => 0),
  PolySynth: vi.fn(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Synth: vi.fn(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('~/composables/useMusicTheory', () => ({
  useMusicTheory: () => ({
    getNoteNames: () => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    getChordNotes: (root: string, intervals: number[]) => {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const idx = names.indexOf(root);
      return intervals.map((i) => names[(idx + i) % 12]);
    },
  }),
}));

// Pre-populated theory store — no need to hit the API in unit tests.
// We mock the module directly because ChordLibrary imports useTheoryStore
// as a named import (vi.stubGlobal can't intercept that).
const chord = {
  id: 'maj',
  name: 'Major',
  symbol: '',
  intervals: [0, 4, 7],
  voicings: null,
  instrumentType: null,
};
const theoryStoreMock = {
  // Plain array — the component reads .length and uses .find() / [0] directly
  chords: [chord] as Array<typeof chord>,
  scales: [] as Array<unknown>,
  selectedRoot: ref('C'),
  selectedChord: ref(chord),
  selectedScale: ref(null),
  fetchChords: vi.fn().mockResolvedValue(undefined),
  fetchScales: vi.fn().mockResolvedValue(undefined),
  setRoot: vi.fn(),
  setChord: vi.fn(),
  setScale: vi.fn(),
};
vi.mock('~/stores/theory', () => ({ useTheoryStore: () => theoryStoreMock }));

const UiSkeletonStub = {
  template: '<div class="ui-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};

import ChordLibrary from '~/components/theory/ChordLibrary.vue';

describe('ChordLibrary', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    theoryStoreMock.chords = [chord];
    theoryStoreMock.setChord.mockClear();
    theoryStoreMock.setRoot.mockClear();
    theoryStoreMock.fetchChords.mockClear();
  });

  it('renders the title and chord name', async () => {
    const wrapper = mount(ChordLibrary, {
      global: { stubs: { UiSkeleton: UiSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Chord Library');
    expect(wrapper.text()).toContain('C Major');
  });

  it('renders a Play Chord control', async () => {
    const wrapper = mount(ChordLibrary, {
      global: { stubs: { UiSkeleton: UiSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Play Chord');
  });

  it('renders 12 root note buttons (C through B)', async () => {
    const wrapper = mount(ChordLibrary, {
      global: { stubs: { UiSkeleton: UiSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    // Find buttons whose text is exactly a note name
    const noteButtons = wrapper.findAll('button').filter((b) => {
      const t = b.text().trim();
      return /^[A-G]#?$/.test(t);
    });
    expect(noteButtons).toHaveLength(12);
  });

  it('emits chordSelected when the component first loads with a default chord', async () => {
    const wrapper = mount(ChordLibrary, {
      global: { stubs: { UiSkeleton: UiSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('chordSelected')).toBeTruthy();
    const payload = wrapper.emitted('chordSelected')![0]![0] as { root: string; notes: string[] };
    expect(payload.root).toBe('C');
    expect(payload.notes).toEqual(['C', 'E', 'G']);
  });

  it('calls setRoot and emits chordSelected when a different root is picked (state transition)', async () => {
    const wrapper = mount(ChordLibrary, {
      global: { stubs: { UiSkeleton: UiSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    wrapper.emitted('chordSelected')!.length = 0; // reset

    const gButton = wrapper.findAll('button').find((b) => b.text().trim() === 'G')!;
    await gButton.trigger('click');

    expect(theoryStoreMock.setRoot).toHaveBeenCalledWith('G');
    expect(wrapper.emitted('chordSelected')).toBeTruthy();
    const payload = wrapper.emitted('chordSelected')!.pop()![0] as {
      root: string;
      notes: string[];
    };
    expect(payload.root).toBe('G');
    expect(payload.notes).toEqual(['G', 'B', 'D']);
  });

  it('renders the notes of the current chord', async () => {
    const wrapper = mount(ChordLibrary, {
      global: { stubs: { UiSkeleton: UiSkeletonStub } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('C E G');
  });
});
