import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

const instruments = [
  {
    id: 'g-1',
    name: 'Acoustic Guitar',
    type: 'guitar' as const,
    tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    stringCount: 6,
    fretCount: 24,
    isDefault: true,
  },
  {
    id: 'b-1',
    name: 'Electric Bass',
    type: 'bass' as const,
    tuning: ['E1', 'A1', 'D2', 'G2'],
    stringCount: 4,
    fretCount: 24,
    isDefault: false,
  },
  {
    id: 'p-1',
    name: 'Piano',
    type: 'piano' as const,
    tuning: null,
    stringCount: null,
    fretCount: 88,
    isDefault: false,
  },
  {
    id: 'v-1',
    name: 'Violin',
    type: 'violin' as const,
    tuning: ['G3', 'D4', 'A4', 'E5'],
    stringCount: 4,
    fretCount: null,
    isDefault: false,
  },
];
const instrumentStoreMock = {
  // Plain array — the component reads .length and uses v-for directly.
  // Using ref([...]) here would make Vue iterate over the ref's own
  // properties (__v_isRef, _rawValue, etc.) instead of the array.
  instruments,
  activeInstrument: ref(null),
  activeInstrumentId: ref(''),
  fetchInstruments: vi.fn().mockResolvedValue(undefined),
  setActiveInstrument: vi.fn(),
};
// Component uses useInstrumentStore() as a free variable (Nuxt auto-imports stores).
// vitest's AutoImport only covers composables, so stub the global instead.
vi.stubGlobal('useInstrumentStore', () => instrumentStoreMock);

import InstrumentSelector from '~/components/instruments/InstrumentSelector.vue';

describe('InstrumentSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    instrumentStoreMock.activeInstrument.value = null;
    instrumentStoreMock.activeInstrumentId.value = '';
  });

  it('renders a button for each instrument in the store', () => {
    const wrapper = mount(InstrumentSelector, { props: { modelValue: '' } });
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(4);
    expect(wrapper.text()).toContain('Acoustic Guitar');
    expect(wrapper.text()).toContain('Electric Bass');
    expect(wrapper.text()).toContain('Piano');
    expect(wrapper.text()).toContain('Violin');
  });

  it('marks the active instrument with a primary border class', () => {
    const wrapper = mount(InstrumentSelector, { props: { modelValue: 'p-1' } });
    const buttons = wrapper.findAll('button');
    // The piano button should have border-primary class
    const pianoButton = buttons.find((b) => b.text().includes('Piano'))!;
    expect(pianoButton.classes().join(' ')).toContain('border-primary');
  });

  it('emits update:modelValue when an instrument is clicked (state transition)', async () => {
    const wrapper = mount(InstrumentSelector, { props: { modelValue: '' } });
    const buttons = wrapper.findAll('button');
    const bassButton = buttons.find((b) => b.text().includes('Electric Bass'))!;
    await bassButton.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['b-1']);
  });

  it('renders the instrument type as a label', () => {
    const wrapper = mount(InstrumentSelector, { props: { modelValue: '' } });
    expect(wrapper.text()).toContain('guitar');
    expect(wrapper.text()).toContain('bass');
    expect(wrapper.text()).toContain('piano');
    expect(wrapper.text()).toContain('violin');
  });

  it('renders an emoji for each instrument type', () => {
    const wrapper = mount(InstrumentSelector, { props: { modelValue: '' } });
    // The emojis used in the component: 🎸 (guitar/bass), 🎹 (piano), 🎻 (violin)
    expect(wrapper.text()).toContain('🎸');
    expect(wrapper.text()).toContain('🎹');
    expect(wrapper.text()).toContain('🎻');
  });
});
