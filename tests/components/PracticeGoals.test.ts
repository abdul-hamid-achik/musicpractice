import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, computed } from 'vue';
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
    id: 'p-1',
    name: 'Piano',
    type: 'piano' as const,
    tuning: null,
    stringCount: null,
    fretCount: 88,
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

const sessions: Array<{
  id: string;
  startedAt: Date;
  durationSeconds: number | null;
  instrumentId: string;
}> = [];
vi.stubGlobal('usePracticeStore', () => ({
  sessions,
  isLoading: ref(false),
  fetchSessions: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn(),
}));

const mockToastStore = {
  toasts: ref([]),
  showToast: vi.fn(),
  removeToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
};
vi.stubGlobal('useToastStore', () => mockToastStore);

const NordCardStub = {
  template: '<div class="nord-card"><h3 v-if="title">{{ title }}</h3><slot /></div>',
  props: ['title', 'padding'],
};
const NordProgressBarStub = {
  template: '<div class="nord-progress" :style="{ width: value + \'%\' }" :data-color="color" />',
  props: ['value', 'color', 'size', 'animated'],
};
const NordSkeletonStub = {
  template: '<div class="nord-skeleton" :style="{ width, height }" />',
  props: ['width', 'height', 'rounded', 'variant'],
};
const NordButtonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  props: ['variant', 'size', 'disabled', 'loading', 'ariaLabel', 'ariaPressed', 'type'],
  emits: ['click'],
};
const StaggeredListStub = {
  template: '<div class="staggered-list"><slot /></div>',
  props: ['tag', 'delay'],
};

import PracticeGoals from '~/components/practice/PracticeGoals.vue';

describe('PracticeGoals', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessions.length = 0;
    mockToastStore.showSuccess.mockClear();
    mockToastStore.showError.mockClear();
    // Reset $fetch mock state
    (globalThis as { $fetch?: ReturnType<typeof vi.fn> }).$fetch = vi.fn();
  });

  it('renders the Week Progress card', async () => {
    const wrapper = mount(PracticeGoals, {
      global: {
        stubs: {
          NordCard: NordCardStub,
          NordProgressBar: NordProgressBarStub,
          NordSkeleton: NordSkeletonStub,
          NordButton: NordButtonStub,
          StaggeredList: StaggeredListStub,
        },
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Week Progress');
  });

  it('shows an empty state when no goals exist', async () => {
    const wrapper = mount(PracticeGoals, {
      global: {
        stubs: {
          NordCard: NordCardStub,
          NordProgressBar: NordProgressBarStub,
          NordSkeleton: NordSkeletonStub,
          NordButton: NordButtonStub,
          StaggeredList: StaggeredListStub,
        },
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('No practice goals set yet');
  });

  it('shows the add goal form when "+ Add Goal" is clicked (state transition)', async () => {
    const wrapper = mount(PracticeGoals, {
      global: {
        stubs: {
          NordCard: NordCardStub,
          NordProgressBar: NordProgressBarStub,
          NordSkeleton: NordSkeletonStub,
          NordButton: NordButtonStub,
          StaggeredList: StaggeredListStub,
        },
      },
    });
    await flushPromises();

    const addButton = wrapper.findAll('button').find((b) => b.text().includes('+ Add Goal'))!;
    await addButton.trigger('click');

    expect(wrapper.text()).toContain('Goal title');
    expect(wrapper.text()).toContain('Target minutes/week');
  });

  it('calls $fetch POST /api/goals when saveGoal is triggered (state transition)', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/goals' && !fetchMock.mock.calls.length) {
        // Return an array so goals.value.reduce works after assignment
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/goals') {
        // POST returns a new goal; refetch returns the full list
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    (globalThis as { $fetch: ReturnType<typeof vi.fn> }).$fetch = fetchMock;

    const wrapper = mount(PracticeGoals, {
      global: {
        stubs: {
          NordCard: NordCardStub,
          NordProgressBar: NordProgressBarStub,
          NordSkeleton: NordSkeletonStub,
          NordButton: NordButtonStub,
          StaggeredList: StaggeredListStub,
        },
      },
    });
    await flushPromises();

    // Open the form
    const addButton = wrapper.findAll('button').find((b) => b.text().includes('+ Add Goal'))!;
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Fill in the title and click Save Goal
    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('Practice guitar daily');
    await wrapper.vm.$nextTick();

    // The Save Goal button is rendered via NordButton stub — find by text
    const saveButton = wrapper.findAll('button').find((b) => b.text().includes('Save Goal'))!;
    await saveButton.trigger('click');
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/goals',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not POST /api/goals when saving without a title', async () => {
    const fetchMock = vi.fn();
    (globalThis as { $fetch: ReturnType<typeof vi.fn> }).$fetch = fetchMock;

    const wrapper = mount(PracticeGoals, {
      global: {
        stubs: {
          NordCard: NordCardStub,
          NordProgressBar: NordProgressBarStub,
          NordSkeleton: NordSkeletonStub,
          NordButton: NordButtonStub,
          StaggeredList: StaggeredListStub,
        },
      },
    });
    await flushPromises();

    // Open the form
    const addButton = wrapper.findAll('button').find((b) => b.text().includes('+ Add Goal'))!;
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Click Save without filling the title
    const saveButton = wrapper.findAll('button').find((b) => b.text().includes('Save Goal'))!;
    await saveButton.trigger('click');
    await flushPromises();

    // fetchMock is allowed to be called by onMounted (loading sessions/goals),
    // but the save handler must NOT have POSTed /api/goals
    const saveCalls = fetchMock.mock.calls.filter(
      (c) => c[0] === '/api/goals' && (c[1] as { method?: string } | undefined)?.method === 'POST',
    );
    expect(saveCalls).toHaveLength(0);
  });
});
