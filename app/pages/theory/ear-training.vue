<script setup lang="ts">
interface EarTrainingScore {
  id: string
  exerciseType: string
  correct: number
  total: number
  settings: Record<string, unknown> | null
  createdAt: string
}

const activeTab = ref<'intervals' | 'notes'>('intervals')
const score = ref({ correct: 0, total: 0 })
const recentScores = ref<EarTrainingScore[]>([])
const isSaving = ref(false)

const accuracy = computed(() => {
  if (!score.value.total) return 0
  return Math.round((score.value.correct / score.value.total) * 100)
})

const tabScores = computed(() =>
  recentScores.value.filter((s) => s.exerciseType === activeTab.value),
)

function handleScoreUpdate(update: { correct: number; total: number }) {
  score.value = update
}

async function saveScore() {
  if (!score.value.total || isSaving.value) return
  isSaving.value = true
  try {
    await $fetch('/api/ear-training', {
      method: 'POST',
      body: {
        exerciseType: activeTab.value,
        correct: score.value.correct,
        total: score.value.total,
      },
    })
    await fetchScores()
  } catch {
    // silently handle
  } finally {
    isSaving.value = false
  }
}

async function fetchScores() {
  try {
    const res = await $fetch<{ data: EarTrainingScore[] }>('/api/ear-training')
    recentScores.value = res.data
  } catch {
    recentScores.value = []
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchScores()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-text">Ear Training</h1>
      <div v-if="score.total" class="flex items-center gap-3">
        <div class="text-right">
          <span class="text-text-muted text-sm">Score: </span>
          <span class="text-primary font-bold">{{ score.correct }}/{{ score.total }}</span>
          <span class="text-text-muted text-sm ml-2">({{ accuracy }}%)</span>
        </div>
        <NordButton variant="primary" size="sm" :loading="isSaving" @click="saveScore">
          Save Score
        </NordButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-surface-alt rounded-lg p-1 w-fit">
      <button
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === 'intervals' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'"
        @click="activeTab = 'intervals'"
      >
        Intervals
      </button>
      <button
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === 'notes' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text'"
        @click="activeTab = 'notes'"
      >
        Note Identification
      </button>
    </div>

    <!-- Content -->
    <IntervalTrainer v-if="activeTab === 'intervals'" @score-update="handleScoreUpdate" />
    <NoteIdentifier v-else @score-update="handleScoreUpdate" />

    <!-- Recent Scores -->
    <NordCard v-if="tabScores.length > 0" title="Recent Scores" class="mt-6">
      <div class="space-y-2">
        <div
          v-for="entry in tabScores.slice(0, 10)"
          :key="entry.id"
          class="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
        >
          <span class="text-sm text-text-muted">{{ formatDate(entry.createdAt) }}</span>
          <div class="flex items-center gap-3">
            <span class="text-sm text-text font-mono">{{ entry.correct }}/{{ entry.total }}</span>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="Math.round((entry.correct / entry.total) * 100) >= 80 ? 'bg-success/20 text-success' : Math.round((entry.correct / entry.total) * 100) >= 50 ? 'bg-nord13/20 text-nord13' : 'bg-error/20 text-error'"
            >
              {{ Math.round((entry.correct / entry.total) * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </NordCard>
  </div>
</template>
