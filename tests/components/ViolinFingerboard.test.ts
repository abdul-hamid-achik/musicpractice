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

import ViolinFingerboard from '~/components/instruments/ViolinFingerboard.vue';

describe('ViolinFingerboard', () => {
  it('renders an SVG with role=application and aria-label', () => {
    const wrapper = mount(ViolinFingerboard);
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('role')).toBe('application');
    expect(svg.attributes('aria-label')).toContain('Violin fingerboard');
  });

  it('shows the current position label', () => {
    const wrapper = mount(ViolinFingerboard);
    expect(wrapper.text()).toContain('Position 1');
  });

  it('updates the position label when position prop changes', () => {
    const wrapper = mount(ViolinFingerboard, { props: { position: 3 } });
    expect(wrapper.text()).toContain('Position 3');
  });

  it('renders 4 strings × 5 finger positions = 20 clickable notes', () => {
    const wrapper = mount(ViolinFingerboard);
    const noteGroups = wrapper.findAll('g.cursor-pointer[role="button"]');
    expect(noteGroups.length).toBe(20);
  });

  it('renders string labels (G, D, A, E)', () => {
    const wrapper = mount(ViolinFingerboard);
    for (const label of ['G', 'D', 'A', 'E']) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it('emits noteClick with the correct payload when a note is clicked (state transition)', async () => {
    const wrapper = mount(ViolinFingerboard);
    const notes = wrapper.findAll('g.cursor-pointer[role="button"]');
    await notes[0]!.trigger('click'); // open G on string 0

    expect(wrapper.emitted('noteClick')).toBeTruthy();
    const payload = wrapper.emitted('noteClick')![0]![0] as {
      note: string;
      string: number;
      finger: number;
      octave: number;
    };
    expect(payload.note).toBe('G');
    expect(payload.string).toBe(0);
    expect(payload.finger).toBe(0);
    expect(playNoteMock).toHaveBeenCalledWith('G', payload.octave, 'violin');
  });

  it('marks highlighted notes as aria-pressed', () => {
    const wrapper = mount(ViolinFingerboard, {
      props: { highlightedNotes: ['A', 'D'] },
    });
    const pressed = wrapper.findAll('g.cursor-pointer[aria-pressed="true"]');
    expect(pressed.length).toBeGreaterThan(0);
  });

  it('computes notes for higher positions differently from position 1', () => {
    const w1 = mount(ViolinFingerboard, { props: { position: 1 } });
    const w2 = mount(ViolinFingerboard, { props: { position: 3 } });
    // Different position = different note labels per finger
    const n1 = w1.findAll('g.cursor-pointer[role="button"]')[1]!.text();
    const n2 = w2.findAll('g.cursor-pointer[role="button"]')[1]!.text();
    expect(n1).not.toBe(n2);
  });
});
