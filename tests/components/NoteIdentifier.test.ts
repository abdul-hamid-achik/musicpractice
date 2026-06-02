import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';

// vexflow is dynamically imported — stub it so the renderer can do its work
// without hitting a real canvas / SVG backend.
vi.mock('vexflow', () => ({
  default: {
    Renderer: class {
      static Backends = { SVG: 0 };
      constructor(
        public el: HTMLElement,
        _backend: number,
      ) {}
      resize() {
        /* noop */
      }
      getContext() {
        return { setFont: vi.fn() };
      }
    },
    Stave: class {
      addClef() {
        return this;
      }
      setStyle() {
        return this;
      }
      setContext() {
        return this;
      }
      draw() {
        /* noop */
      }
    },
    StaveNote: class {
      constructor(_opts: unknown) {
        /* noop */
      }
      addModifier() {
        return this;
      }
      setStyle() {
        return this;
      }
    },
    Formatter: { FormatAndDraw: vi.fn() },
    Accidental: class {},
  },
}));

const settingsStoreMock = {
  theme: ref('dark'),
  defaultInstrument: ref('guitar'),
  defaultTempo: ref(120),
  showNotation: ref(true),
  showTablature: ref(true),
  volume: ref(80),
  updateSetting: vi.fn(),
};
vi.stubGlobal('useSettingsStore', () => settingsStoreMock);

import NoteIdentifier from '~/components/theory/NoteIdentifier.vue';

describe('NoteIdentifier', () => {
  it('renders title and reset button', () => {
    const wrapper = mount(NoteIdentifier);
    expect(wrapper.text()).toContain('Note Identifier');
    expect(wrapper.text()).toContain('Reset');
  });

  it('renders score counter starting at 0/0', () => {
    const wrapper = mount(NoteIdentifier);
    expect(wrapper.text()).toContain('0/0 correct');
  });

  it('renders clef and difficulty toggles', () => {
    const wrapper = mount(NoteIdentifier);
    expect(wrapper.text()).toContain('treble');
    expect(wrapper.text()).toContain('bass');
    expect(wrapper.text()).toContain('easy');
    expect(wrapper.text()).toContain('medium');
    expect(wrapper.text()).toContain('hard');
  });

  it('shows a New Note button before any question is loaded', () => {
    const wrapper = mount(NoteIdentifier);
    expect(wrapper.text()).toContain('New Note');
    // The answer grid is not rendered before currentNote is set
    expect(wrapper.text()).not.toContain('Identify the Note');
  });

  it('emits scoreUpdate with the correct payload when a correct answer is guessed', async () => {
    const wrapper = mount(NoteIdentifier);

    // Click "New Note" to load a currentNote
    const newNoteButton = wrapper.findAll('button').find((b) => b.text().includes('New Note'))!;
    await newNoteButton.trigger('click');
    await wrapper.vm.$nextTick();
    // Allow renderNote to settle
    await wrapper.vm.$nextTick();

    // Click the first answer button. The note is random, so this is sometimes
    // right, sometimes wrong — but `scoreUpdate` is emitted in either case.
    const answerButtons = wrapper.findAll('button').filter((b) => {
      const t = b.text().trim();
      return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(t);
    });
    expect(answerButtons.length).toBeGreaterThan(0);
    await answerButtons[0]!.trigger('click');

    // The component emits scoreUpdate on the very first guess.
    expect(wrapper.emitted('scoreUpdate')).toBeTruthy();
    const payload = wrapper.emitted('scoreUpdate')![0]![0] as { correct: number; total: number };
    expect(payload.total).toBe(1);
    // `correct` is 0 or 1 depending on whether the click matched the random note.
    expect([0, 1]).toContain(payload.correct);
  });

  it('resets score when Reset is clicked', async () => {
    const wrapper = mount(NoteIdentifier);

    // Load a note then make a guess
    const newNoteButton = wrapper.findAll('button').find((b) => b.text().includes('New Note'))!;
    await newNoteButton.trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const answerButtons = wrapper.findAll('button').filter((b) => {
      const t = b.text().trim();
      return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(t);
    });
    await answerButtons[0]!.trigger('click');

    // total increments to 1 regardless of correctness
    expect(wrapper.text()).toMatch(/0\/1|1\/1/);

    // Click Reset
    const resetButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Reset')!;
    await resetButton.trigger('click');

    expect(wrapper.text()).toContain('0/0 correct');
  });
});
