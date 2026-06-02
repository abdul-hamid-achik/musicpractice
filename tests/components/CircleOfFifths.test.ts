import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import CircleOfFifths from '~/components/theory/CircleOfFifths.vue';

describe('CircleOfFifths', () => {
  it('renders the title', () => {
    const wrapper = mount(CircleOfFifths);
    expect(wrapper.text()).toContain('Circle of Fifths');
  });

  it('renders 12 outer (major) key segments', () => {
    const wrapper = mount(CircleOfFifths);
    // 12 outer ring <path> elements
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    // Outer segments are paths inside the first <g> loop (no class, but
    // bound to fill of #88C0D0 / var(--color-card) / var(--color-border))
    const outerPaths = svg.findAll('path').filter((p) => {
      const fill = p.attributes('fill') ?? '';
      // outer ring uses these specific colors
      return (
        fill.includes('88C0D0') || fill.includes('--color-card') || fill.includes('--color-border')
      );
    });
    expect(outerPaths.length).toBe(12);
  });

  it('renders 12 inner (minor) key segments', () => {
    const wrapper = mount(CircleOfFifths);
    const svg = wrapper.find('svg');
    const innerPaths = svg.findAll('path').filter((p) => {
      const fill = p.attributes('fill') ?? '';
      // inner ring uses 5E81AC / --color-surface / --color-surface-alt
      return fill.includes('5E81AC') || fill.includes('--color-surface');
    });
    expect(innerPaths.length).toBe(12);
  });

  it('renders the Select a key placeholder in the center', () => {
    const wrapper = mount(CircleOfFifths);
    expect(wrapper.text()).toContain('Select a key');
  });

  it('renders labels for outer major keys', () => {
    const wrapper = mount(CircleOfFifths);
    const text = wrapper.text();
    for (const key of ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb']) {
      expect(text).toContain(key);
    }
  });

  it('does not show key signature or diatonic chords before selection', () => {
    const wrapper = mount(CircleOfFifths);
    expect(wrapper.text()).not.toContain('Key Signature:');
    expect(wrapper.text()).not.toContain('Diatonic Chords');
  });

  it('emits keySelected with type major when an outer segment is clicked (state transition)', async () => {
    const wrapper = mount(CircleOfFifths);
    // First outer path corresponds to the C major segment
    const svg = wrapper.find('svg');
    const outerPaths = svg.findAll('path').filter((p) => {
      const fill = p.attributes('fill') ?? '';
      return (
        fill.includes('88C0D0') || fill.includes('--color-card') || fill.includes('--color-border')
      );
    });
    expect(outerPaths.length).toBe(12);

    await outerPaths[0]!.trigger('click');
    expect(wrapper.emitted('keySelected')).toBeTruthy();
    const payload = wrapper.emitted('keySelected')![0]![0] as { key: string; type: string };
    expect(payload.key).toBe('C');
    expect(payload.type).toBe('major');
  });

  it('emits keySelected with type minor when an inner segment is clicked (state transition)', async () => {
    const wrapper = mount(CircleOfFifths);
    const svg = wrapper.find('svg');
    const innerPaths = svg.findAll('path').filter((p) => {
      const fill = p.attributes('fill') ?? '';
      return fill.includes('5E81AC') || fill.includes('--color-surface');
    });
    expect(innerPaths.length).toBe(12);

    await innerPaths[0]!.trigger('click');
    expect(wrapper.emitted('keySelected')).toBeTruthy();
    const payload = wrapper.emitted('keySelected')![0]![0] as { key: string; type: string };
    expect(payload.key).toBe('Am');
    expect(payload.type).toBe('minor');
  });

  it('displays key signature and diatonic chords after selecting a major key', async () => {
    const wrapper = mount(CircleOfFifths);
    const svg = wrapper.find('svg');
    const outerPaths = svg.findAll('path').filter((p) => {
      const fill = p.attributes('fill') ?? '';
      return (
        fill.includes('88C0D0') || fill.includes('--color-card') || fill.includes('--color-border')
      );
    });
    // Click the C major segment (first outer)
    await outerPaths[0]!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('C Major');
    expect(wrapper.text()).toContain('Key Signature:');
    expect(wrapper.text()).toContain('Diatonic Chords');
    // C major diatonic chords: C Dm Em F G Am B°
    for (const chord of ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B']) {
      expect(wrapper.text()).toContain(chord);
    }
  });
});
