<script setup lang="ts">
interface Session {
  id: string
  startedAt: string | Date
  endedAt: string | Date | null
  durationSeconds: number | null
  tempoBpm: number | null
  notes: string | null
  tags: string[]
  instrumentId: string
}

const props = withDefaults(
  defineProps<{
    sessions: Session[]
    limit?: number
  }>(),
  {
    limit: undefined,
  },
)

const instrumentStore = useInstrumentStore()

onMounted(() => {
  if (instrumentStore.instruments.length === 0) {
    instrumentStore.fetchInstruments()
  }
})

type SortKey = 'date' | 'duration'
const sortBy = ref<SortKey>('date')
const sortAsc = ref(false)
const expandedId = ref<string | null>(null)

const sortedSessions = computed(() => {
  let list = [...props.sessions]

  list.sort((a, b) => {
    if (sortBy.value === 'date') {
      const diff = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      return sortAsc.value ? diff : -diff
    }
    const diff = (a.durationSeconds || 0) - (b.durationSeconds || 0)
    return sortAsc.value ? diff : -diff
  })

  if (props.limit) {
    list = list.slice(0, props.limit)
  }

  return list
})

function toggleSort(key: SortKey) {
  if (sortBy.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortBy.value = key
    sortAsc.value = false
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInstrumentName(instrumentId: string): string {
  const inst = instrumentStore.instruments.find((i) => i.id === instrumentId)
  return inst?.name || 'Unknown'
}

function sortIndicator(key: SortKey): string {
  if (sortBy.value !== key) return ''
  return sortAsc.value ? ' \u2191' : ' \u2193'
}
</script>

<template>
  <div>
    <!-- Empty state -->
    <div
      v-if="sessions.length === 0"
      class="text-center py-12 text-text-muted"
    >
      <p class="text-lg">No practice sessions yet</p>
      <p class="text-sm mt-1">Start a practice session to see your history here.</p>
    </div>

    <!-- Session table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left">
        <caption class="sr-only">Practice session history</caption>
        <thead>
          <tr class="border-b border-border">
            <th
              class="py-2 px-3 text-sm font-medium text-text-muted cursor-pointer hover:text-text transition-colors"
              @click="toggleSort('date')"
            >
              Date{{ sortIndicator('date') }}
            </th>
            <th
              class="py-2 px-3 text-sm font-medium text-text-muted cursor-pointer hover:text-text transition-colors"
              @click="toggleSort('duration')"
            >
              Duration{{ sortIndicator('duration') }}
            </th>
            <th class="py-2 px-3 text-sm font-medium text-text-muted">Tempo</th>
            <th class="py-2 px-3 text-sm font-medium text-text-muted">Instrument</th>
            <th class="py-2 px-3 text-sm font-medium text-text-muted">Tags</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="session in sortedSessions" :key="session.id">
            <tr
              class="border-b border-border/50 hover:bg-surface-alt/50 cursor-pointer transition-colors"
              @click="toggleExpand(session.id)"
            >
              <td class="py-2.5 px-3 text-sm text-text">
                {{ formatDate(session.startedAt) }}
              </td>
              <td class="py-2.5 px-3 text-sm text-text font-mono">
                {{ formatDuration(session.durationSeconds) }}
              </td>
              <td class="py-2.5 px-3 text-sm text-text-muted">
                {{ session.tempoBpm ? `${session.tempoBpm} BPM` : '-' }}
              </td>
              <td class="py-2.5 px-3 text-sm text-text-muted">
                {{ getInstrumentName(session.instrumentId) }}
              </td>
              <td class="py-2.5 px-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in session.tags"
                    :key="tag"
                    class="px-2 py-0.5 text-xs rounded-full bg-surface-alt text-text-muted"
                  >
                    {{ tag }}
                  </span>
                </div>
              </td>
            </tr>
            <!-- Expanded notes row -->
            <tr v-if="expandedId === session.id && session.notes">
              <td colspan="5" class="py-3 px-3 bg-surface-alt/30">
                <p class="text-sm text-text-muted whitespace-pre-wrap">
                  {{ session.notes }}
                </p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
