<script setup lang="ts">
import type { PracticeSession } from '#shared/types/practice'

definePageMeta({ middleware: 'auth' })

const practiceStore = usePracticeStore()
const { formatTime } = usePracticeSession()

const weeklyMinutes = computed(() => {
  const totalSeconds = practiceStore.sessionsThisWeek.reduce(
    (sum: number, s: PracticeSession) => sum + (s.durationSeconds || 0),
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
  { label: 'Guitar', emoji: '🎸', to: '/instruments/guitar' },
  { label: 'Bass', emoji: '🎸', to: '/instruments/bass' },
  { label: 'Piano', emoji: '🎹', to: '/instruments/piano' },
  { label: 'Violin', emoji: '🎻', to: '/instruments/violin' },
]

onMounted(() => {
  practiceStore.fetchSessions()
})
</script>

<template>
  <div aria-live="polite">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text">Dashboard</h1>
      <p class="text-text-muted mt-1">Welcome back. Here's your practice overview.</p>
    </div>

    <!-- Streak Counter — full width, prominent -->
    <div class="mb-6">
      <StreakCounter />
    </div>

    <StaggeredList v-if="!practiceStore.isLoading" tag="div" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <!-- Daily Activity (last 2 weeks bar chart) -->
      <NordCard title="Daily Activity" class="md:col-span-2">
        <PracticeChart />
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
    </StaggeredList>

    <!-- Loading Skeletons -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Skeleton for "This Week's Practice" -->
      <SkeletonCard variant="card" height="140px" />

      <!-- Skeleton for Goals -->
      <SkeletonCard variant="card" height="200px" />

      <!-- Skeleton for Recent Sessions -->
      <SkeletonCard variant="card" height="180px" />

      <!-- Skeleton for Daily Activity chart (spans 2 columns) -->
      <SkeletonCard variant="card" height="200px" class="md:col-span-2" />

      <!-- Skeleton for Quick Start -->
      <SkeletonCard variant="card" height="180px" />
    </div>

    <!-- Practice Heatmap — full width -->
    <div class="mt-6">
      <NordCard title="Practice Heatmap">
        <p class="text-text-muted text-xs mb-3">Last 90 days of practice activity</p>
        <PracticeHeatmap />
      </NordCard>
    </div>

    <!-- Skill Progress -->
    <div class="mt-6">
      <NordCard title="Song Progress">
        <SkillProgress />
      </NordCard>
    </div>
  </div>
</template>
