<script setup lang="ts">
import type { PracticeSession } from '#shared/types/practice'

const practiceStore = usePracticeStore()
const instrumentStore = useInstrumentStore()
const { formatTime } = usePracticeSession()

function getInstrumentName(instrumentId: string): string {
  const inst = instrumentStore.instruments.find((i) => i.id === instrumentId)
  return inst?.name || instrumentId
}

const filterInstrument = ref('all')
const filterRange = ref<'week' | 'month' | 'all'>('all')

const totalSessions = computed(() => practiceStore.sessions.length)

const totalTimeFormatted = computed(() => {
  const secs = practiceStore.totalPracticeTime
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
})

const averageDuration = computed(() => {
  if (!practiceStore.sessions.length) return '0:00'
  const avg = Math.floor(practiceStore.totalPracticeTime / practiceStore.sessions.length)
  const m = Math.floor(avg / 60)
  const s = avg % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const mostPracticedInstrument = computed(() => {
  const counts: Record<string, number> = {}
  for (const s of practiceStore.sessions) {
    const inst = s.instrumentId || 'unknown'
    counts[inst] = (counts[inst] || 0) + 1
  }
  let maxId = ''
  let maxCount = 0
  for (const [k, v] of Object.entries(counts)) {
    if (v > maxCount) {
      maxId = k
      maxCount = v
    }
  }
  return maxId ? getInstrumentName(maxId) : '-'
})

const filteredSessions = computed(() => {
  let sessions = [...practiceStore.sessions]

  if (filterInstrument.value !== 'all') {
    sessions = sessions.filter((s: PracticeSession) => s.instrumentId === filterInstrument.value)
  }

  if (filterRange.value === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    sessions = sessions.filter((s: PracticeSession) => new Date(s.startedAt) >= weekAgo)
  } else if (filterRange.value === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    sessions = sessions.filter((s: PracticeSession) => new Date(s.startedAt) >= monthAgo)
  }

  return sessions.toSorted(
    (a: PracticeSession, b: PracticeSession) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
})

const instrumentOptions = computed(() => {
  const ids = new Set(practiceStore.sessions.map((s: PracticeSession) => s.instrumentId).filter(Boolean))
  return Array.from(ids)
})

onMounted(async () => {
  if (instrumentStore.instruments.length === 0) {
    await instrumentStore.fetchInstruments()
  }
  practiceStore.fetchSessions()
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-8">Practice History</h1>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <NordCard title="Total Sessions">
        <div class="text-2xl font-bold text-primary">{{ totalSessions }}</div>
      </NordCard>
      <NordCard title="Total Time">
        <div class="text-2xl font-bold text-primary">{{ totalTimeFormatted }}</div>
      </NordCard>
      <NordCard title="Average Duration">
        <div class="text-2xl font-bold text-primary">{{ averageDuration }}</div>
      </NordCard>
      <NordCard title="Most Practiced">
        <div class="text-2xl font-bold text-primary capitalize">{{ mostPracticedInstrument }}</div>
      </NordCard>
    </div>

    <!-- Filters -->
    <div class="bg-surface-alt rounded-lg p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div>
          <label class="block text-sm text-text-muted mb-1">Instrument</label>
          <select
            v-model="filterInstrument"
            class="bg-surface text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Instruments</option>
            <option v-for="inst in instrumentOptions" :key="inst" :value="inst" class="capitalize">
              {{ getInstrumentName(inst) }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Time Range</label>
          <select
            v-model="filterRange"
            class="bg-surface text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredSessions.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-text-muted/50 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <p class="text-lg text-text-muted mb-2">No practice sessions yet</p>
      <p class="text-sm text-text-muted mb-6">Track your progress by starting your first practice session.</p>
      <NuxtLink to="/practice/session">
        <NordButton variant="primary">Start Your First Session</NordButton>
      </NuxtLink>
    </div>

    <!-- Session List -->
    <SessionLog v-else :sessions="filteredSessions" />
  </div>
</template>
