import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('~/composables/useMusicTheory', () => ({
  useMusicTheory: () => ({
    transposeNote: (note: string, semitones: number) => {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const idx = names.indexOf(note);
      return names[(idx + semitones + 12) % 12];
    },
    noteToMidi: (note: string, octave: number) => {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return names.indexOf(note) + (octave + 1) * 12;
    },
    midiToNote: (midi: number) => {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return { note: names[midi % 12], octave: Math.floor(midi / 12) - 1 };
    },
  }),
}));

const playNoteMock = vi.fn();
vi.mock('~/composables/useInstrumentSound', () => ({
  useInstrumentSound: () => ({ playNote: playNoteMock }),
}));

import BassFretboard from '~/components/instruments/BassFretboard.vue';

describe('BassFretboard', () => {
  it('renders an SVG with role=application and aria-label', () => {
    const wrapper = mount(BassFretboard);
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('role')).toBe('application');
    expect(svg.attributes('aria-label')).toContain('Bass fretboard');
  });

  it('renders 4 strings by default', () => {
    const wrapper = mount(BassFretboard);
    const noteGroups = wrapper.findAll('g.cursor-pointer[role="button"]');
    // 4 strings × 25 positions (open + 24 frets) = 100
    expect(noteGroups.length).toBe(100);
  });

  it('renders 5 strings when strings=5', () => {
    const wrapper = mount(BassFretboard, { props: { strings: 5 } });
    const noteGroups = wrapper.findAll('g.cursor-pointer[role="button"]');
    expect(noteGroups.length).toBe(125); // 5 × 25
  });

  it('renders 6 strings when strings=6', () => {
    const wrapper = mount(BassFretboard, { props: { strings: 6 } });
    const noteGroups = wrapper.findAll('g.cursor-pointer[role="button"]');
    expect(noteGroups.length).toBe(150); // 6 × 25
  });

  it('uses the provided tuning when given', () => {
    const wrapper = mount(BassFretboard, {
      props: { tuning: ['A1', 'D2', 'G2', 'C3'] },
    });
    // First clickable group is the open A
    const notes = wrapper.findAll('g.cursor-pointer[role="button"]');
    expect(notes.length).toBe(100);
  });

  it('emits noteClick with the correct payload when a note is clicked (state transition)', async () => {
    const wrapper = mount(BassFretboard);
    const notes = wrapper.findAll('g.cursor-pointer[role="button"]');
    await notes[0]!.trigger('click'); // open E on bass

    expect(wrapper.emitted('noteClick')).toBeTruthy();
    const payload = wrapper.emitted('noteClick')![0]![0] as {
      string: number;
      fret: number;
      note: string;
      octave: number;
    };
    expect(payload.string).toBe(0);
    expect(payload.fret).toBe(0);
    expect(payload.note).toBe('E');
    expect(playNoteMock).toHaveBeenCalledWith('E', payload.octave, 'bass');
  });

  it('marks highlighted notes as aria-pressed', () => {
    const wrapper = mount(BassFretboard, { props: { highlightedNotes: ['E', 'A'] } });
    const pressed = wrapper.findAll('g.cursor-pointer[aria-pressed="true"]');
    expect(pressed.length).toBeGreaterThan(0);
  });
});
