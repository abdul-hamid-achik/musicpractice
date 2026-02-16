<script setup lang="ts">
const practiceStore = usePracticeStore()
const { formatTime } = usePracticeSession()

const weeklyMinutes = computed(() => {
  const totalSeconds = practiceStore.sessionsThisWeek.reduce(
    (sum: number, s: any) => sum + (s.durationSeconds || 0),
    0,
  )
  return Math.floor(totalSeconds / 60)
})

const weeklyFormatted = computed(() => {
  const h = Math.floor(weeklyMinutes.value / 60)
  const m = weeklyMinutes.value % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
})

const quickStartItems = [
  { label: 'Guitar', emoji: '\uD83C\uDFB8', to: '/instruments/guitar' },
  { label: 'Bass', emoji: '\uD83C\uDFB8', to: '/instruments/bass' },
  { label: 'Piano', emoji: '\uD83C\uDFB9', to: '/instruments/piano' },
  { label: 'Violin', emoji: '\uD83C\uDFBB', to: '/instruments/violin' },
]

onMounted(() => {
  practiceStore.fetchSessions()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text">Dashboard</h1>
      <p class="text-text-muted mt-1">Welcome back. Here's your practice overview.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- This Week's Practice -->
      <NordCard title="This Week's Practice">
        <div class="text-center py-4">
          <div class="text-4xl font-bold text-primary">{{ weeklyFormatted }}</div>
          <p class="text-text-muted mt-2">
            {{ practiceStore.sessionsThisWeek.length }} session{{ practiceStore.sessionsThisWeek.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </NordCard>

      <!-- Goals -->
      <NordCard title="Goals">
        <PracticeGoals />
      </NordCard>

      <!-- Recent Sessions -->
      <NordCard title="Recent Sessions">
        <SessionLog :sessions="practiceStore.recentSessions" :limit="5" />
        <template #footer>
          <NuxtLink to="/practice/history" class="text-primary text-sm hover:underline">
            View full history
          </NuxtLink>
        </template>
      </NordCard>

      <!-- Quick Start -->
      <NordCard title="Quick Start">
        <div class="grid grid-cols-2 gap-3">
          <NuxtLink
            v-for="item in quickStartItems"
            :key="item.label"
            :to="item.to"
            class="flex flex-col items-center gap-2 p-4 rounded-lg bg-surface-alt hover:bg-border transition-colors"
          >
            <span class="text-4xl">{{ item.emoji }}</span>
            <span class="text-sm font-medium text-text">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </NordCard>
    </div>
  </div>
</template>
