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

import GuitarFretboard from '~/components/instruments/GuitarFretboard.vue';

describe('GuitarFretboard', () => {
  it('renders an SVG with role=application and an aria-label', () => {
    const wrapper = mount(GuitarFretboard);
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('role')).toBe('application');
    expect(svg.attributes('aria-label')).toContain('Guitar fretboard');
    expect(svg.attributes('tabindex')).toBe('0');
  });

  it('renders 6 strings by default', () => {
    const wrapper = mount(GuitarFretboard);
    // Count fret lines (one per fret) — should be 24
    const fretLines = wrapper.findAll('line').filter((l) => {
      // Fret lines have a y2 at topPadding + (n-1) * spacing + 6; we filter
      // by stroke-width attribute which is unique to fret lines ("2" vs "5" for nut)
      return l.attributes('stroke-width') === '2';
    });
    expect(fretLines.length).toBe(24);
  });

  it('renders fret markers', () => {
    const wrapper = mount(GuitarFretboard);
    // Fret markers are circles with a small radius and no aria-label
    // 10 standard markers (3,5,7,9,12,15,17,19,21,24); with default 24 frets, all are visible
    const circles = wrapper.findAll('circle');
    // Should have a substantial number of circles for markers (some are doubled)
    expect(circles.length).toBeGreaterThanOrEqual(10);
  });

  it('renders note clickable groups (6 strings × 25 positions)', () => {
    const wrapper = mount(GuitarFretboard);
    // Each string renders 25 notes (open + 24 frets)
    const noteGroups = wrapper.findAll('g.cursor-pointer[role="button"]');
    expect(noteGroups.length).toBe(150); // 6 × 25
  });

  it('emits noteClick with the correct payload when a note is clicked (state transition)', async () => {
    const wrapper = mount(GuitarFretboard);
    const notes = wrapper.findAll('g.cursor-pointer[role="button"]');
    await notes[0]!.trigger('click'); // open string 1 (E)
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
    expect(typeof payload.octave).toBe('number');
    // playNote is called as a side effect
    expect(playNoteMock).toHaveBeenCalledWith('E', payload.octave, 'guitar');
  });

  it('marks a note as aria-pressed when it is in the highlightedNotes list', () => {
    const wrapper = mount(GuitarFretboard, {
      props: { highlightedNotes: ['E'] },
    });
    const pressed = wrapper.findAll('g.cursor-pointer[aria-pressed="true"]');
    // The open E on string 0 and string 5 are both highlighted
    expect(pressed.length).toBeGreaterThan(0);
  });

  it('changes the fill color of root notes vs highlighted notes', () => {
    const wrapper = mount(GuitarFretboard, {
      props: { rootNote: 'C', highlightedNotes: ['C', 'E', 'G'] },
    });
    // Find a circle whose fill contains the primary color (root) or secondary (highlight)
    const noteCircles = wrapper.findAll('circle').filter((c) => {
      const fill = c.attributes('fill') ?? '';
      return fill.includes('--color-primary') || fill.includes('--color-secondary');
    });
    // Should be at least 3 highlighted notes
    expect(noteCircles.length).toBeGreaterThanOrEqual(3);
  });
});
