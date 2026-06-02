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
];
vi.stubGlobal('useInstrumentStore', () => ({
  instruments,
  activeInstrument: ref(null),
  activeInstrumentId: ref(''),
  fetchInstruments: vi.fn().mockResolvedValue(undefined),
  setActiveInstrument: vi.fn(),
}));

import SessionLog from '~/components/practice/SessionLog.vue';

const session = (
  overrides: Partial<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
    tempoBpm: number | null;
    notes: string | null;
    tags: string[];
    instrumentId: string;
    songTitle: string | null;
  }> = {},
) => ({
  id: overrides.id ?? 's1',
  startedAt: overrides.startedAt ?? '2024-01-15T14:30:00Z',
  endedAt: overrides.endedAt ?? null,
  durationSeconds: overrides.durationSeconds ?? 1800,
  tempoBpm: overrides.tempoBpm ?? 120,
  notes: overrides.notes ?? null,
  tags: overrides.tags ?? [],
  instrumentId: overrides.instrumentId ?? 'g-1',
  songTitle: overrides.songTitle ?? null,
});

describe('SessionLog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows an empty state when there are no sessions', () => {
    const wrapper = mount(SessionLog, { props: { sessions: [] } });
    expect(wrapper.text()).toContain('No practice sessions yet');
  });

  it('renders one row per session', () => {
    const wrapper = mount(SessionLog, {
      props: {
        sessions: [session({ id: 'a' }), session({ id: 'b' }), session({ id: 'c' })],
      },
    });
    const rows = wrapper.findAll('tbody tr');
    // Filter out note-expansion rows (those are conditional)
    const dataRows = rows.filter((r) => !r.classes().includes('bg-surface-alt'));
    expect(dataRows.length).toBe(3);
  });

  it('formats duration as M:SS', () => {
    const wrapper = mount(SessionLog, {
      props: { sessions: [session({ durationSeconds: 125 })] },
    });
    expect(wrapper.text()).toContain('2:05');
  });

  it('limits the number of rows when `limit` is set', () => {
    const wrapper = mount(SessionLog, {
      props: {
        sessions: [
          session({ id: '1' }),
          session({ id: '2' }),
          session({ id: '3' }),
          session({ id: '4' }),
        ],
        limit: 2,
      },
    });
    const dataRows = wrapper
      .findAll('tbody tr')
      .filter((r) => !r.classes().includes('bg-surface-alt'));
    expect(dataRows.length).toBe(2);
  });

  it('resolves the instrument name from the store', () => {
    const wrapper = mount(SessionLog, {
      props: { sessions: [session({ instrumentId: 'b-1' })] },
    });
    expect(wrapper.text()).toContain('Electric Bass');
  });

  it('shows "Unknown" for instruments not in the store', () => {
    const wrapper = mount(SessionLog, {
      props: { sessions: [session({ instrumentId: 'nonexistent' })] },
    });
    expect(wrapper.text()).toContain('Unknown');
  });

  it('toggles the sort direction when the date header is clicked (state transition)', async () => {
    const wrapper = mount(SessionLog, {
      props: {
        sessions: [
          session({ id: 'a', startedAt: '2024-01-15T10:00:00Z' }),
          session({ id: 'b', startedAt: '2024-01-14T10:00:00Z' }),
        ],
      },
    });
    // Default sort is date descending
    const rows = wrapper.findAll('tbody tr').filter((r) => !r.classes().includes('bg-surface-alt'));
    expect(rows[0]!.text()).toContain('Jan 15');
    expect(rows[1]!.text()).toContain('Jan 14');

    // Click date header to toggle to ascending
    const dateHeader = wrapper
      .findAll('th.cursor-pointer')
      .find((th) => th.text().includes('Date'))!;
    await dateHeader.trigger('click');

    const rows2 = wrapper
      .findAll('tbody tr')
      .filter((r) => !r.classes().includes('bg-surface-alt'));
    expect(rows2[0]!.text()).toContain('Jan 14');
    expect(rows2[1]!.text()).toContain('Jan 15');
  });

  it('expands a row to show its notes when clicked (state transition)', async () => {
    const wrapper = mount(SessionLog, {
      props: { sessions: [session({ id: 'a', notes: 'These are my practice notes.' })] },
    });
    // Click the row
    const row = wrapper.find('tbody tr.cursor-pointer')!;
    await row.trigger('click');

    // The notes row appears
    expect(wrapper.text()).toContain('These are my practice notes.');
  });

  it('renders tags as badges', () => {
    const wrapper = mount(SessionLog, {
      props: { sessions: [session({ tags: ['technique', 'scales'] })] },
    });
    expect(wrapper.text()).toContain('technique');
    expect(wrapper.text()).toContain('scales');
  });
});
