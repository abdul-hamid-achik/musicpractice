<script setup lang="ts">
const activeTab = ref<'intervals' | 'notes'>('intervals')
const score = ref({ correct: 0, total: 0 })

const accuracy = computed(() => {
  if (!score.value.total) return 0
  return Math.round((score.value.correct / score.value.total) * 100)
})

function handleScoreUpdate(update: { correct: number; total: number }) {
  score.value = update
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-text">Ear Training</h1>
      <div v-if="score.total" class="text-right">
        <span class="text-text-muted text-sm">Score: </span>
        <span class="text-primary font-bold">{{ score.correct }}/{{ score.total }}</span>
        <span class="text-text-muted text-sm ml-2">({{ accuracy }}%)</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-surface-alt rounded-lg p-1 w-fit">
      <button
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === 'intervals' ? 'bg-primary text-nord0' : 'text-text-muted hover:text-text'"
        @click="activeTab = 'intervals'"
      >
        Intervals
      </button>
      <button
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === 'notes' ? 'bg-primary text-nord0' : 'text-text-muted hover:text-text'"
        @click="activeTab = 'notes'"
      >
        Note Identification
      </button>
    </div>

    <!-- Content -->
    <IntervalTrainer v-if="activeTab === 'intervals'" @score-update="handleScoreUpdate" />
    <NoteIdentifier v-else @score-update="handleScoreUpdate" />
  </div>
</template>
