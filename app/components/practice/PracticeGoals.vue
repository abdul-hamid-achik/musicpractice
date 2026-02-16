<script setup lang="ts">
import type { PracticeGoal } from '#shared/types/practice'

const practiceStore = usePracticeStore()
const instrumentStore = useInstrumentStore()

const goals = ref<PracticeGoal[]>([])
const isLoading = ref(false)
const showForm = ref(false)

const newGoal = ref({
  title: '',
  targetMinutesPerWeek: 60,
  instrumentId: '',
})

onMounted(async () => {
  if (instrumentStore.instruments.length === 0) {
    await instrumentStore.fetchInstruments()
  }
  await fetchGoals()
})

async function fetchGoals() {
  isLoading.value = true
  try {
    goals.value = await $fetch('/api/goals')
  } catch {
    goals.value = []
  } finally {
    isLoading.value = false
  }
}

function getWeeklyMinutes(instrumentId: string | null): number {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return practiceStore.sessions
    .filter((s) => {
      const matchesInstrument = !instrumentId || s.instrumentId === instrumentId
      const inRange = new Date(s.startedAt) >= weekAgo
      return matchesInstrument && inRange
    })
    .reduce((sum, s) => sum + Math.floor((s.durationSeconds || 0) / 60), 0)
}

function progressPercent(goal: PracticeGoal): number {
  const actual = getWeeklyMinutes(goal.instrumentId)
  if (goal.targetMinutesPerWeek <= 0) return 0
  return Math.round((actual / goal.targetMinutesPerWeek) * 100)
}

function getInstrumentName(instrumentId: string | null): string {
  if (!instrumentId) return 'All instruments'
  const inst = instrumentStore.instruments.find((i) => i.id === instrumentId)
  return inst?.name || 'Unknown'
}

async function saveGoal() {
  if (!newGoal.value.title.trim()) return
  try {
    await $fetch('/api/goals', {
      method: 'POST',
      body: {
        userId: 'demo-user-id', // TODO: get from auth
        title: newGoal.value.title,
        targetMinutesPerWeek: newGoal.value.targetMinutesPerWeek,
        instrumentId: newGoal.value.instrumentId || null,
      },
    })
    newGoal.value = { title: '', targetMinutesPerWeek: 60, instrumentId: '' }
    showForm.value = false
    await fetchGoals()
  } catch {
    // handle error silently
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Goal cards -->
    <div
      v-if="goals.length === 0 && !isLoading"
      class="text-center py-8 text-text-muted"
    >
      <p>No practice goals set yet.</p>
      <p class="text-sm mt-1">Add a goal to track your progress.</p>
    </div>

    <div
      v-for="goal in goals"
      :key="goal.id"
      class="bg-card border border-border rounded-lg p-4"
    >
      <div class="flex justify-between items-start mb-2">
        <div>
          <h4 class="font-medium text-text">{{ goal.title }}</h4>
          <p class="text-xs text-text-muted">{{ getInstrumentName(goal.instrumentId) }}</p>
        </div>
        <span
          class="text-sm font-medium"
          :class="progressPercent(goal) >= 100 ? 'text-success' : 'text-primary'"
        >
          {{ progressPercent(goal) }}%
        </span>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-surface-alt rounded-full h-2.5 overflow-hidden mt-3">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressPercent(goal) >= 100 ? 'bg-success' : 'bg-primary'"
          :style="{ width: `${Math.min(100, progressPercent(goal))}%` }"
        />
      </div>

      <div class="flex justify-between mt-1.5 text-xs text-text-muted">
        <span>{{ getWeeklyMinutes(goal.instrumentId) }} min this week</span>
        <span>Target: {{ goal.targetMinutesPerWeek }} min/week</span>
      </div>
    </div>

    <!-- Add goal form -->
    <div v-if="showForm" class="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
      <input
        v-model="newGoal.title"
        type="text"
        placeholder="Goal title"
        class="bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm"
      />
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="text-xs text-text-muted block mb-1">Target minutes/week</label>
          <input
            v-model.number="newGoal.targetMinutesPerWeek"
            type="number"
            min="1"
            class="w-full bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm"
          />
        </div>
        <div class="flex-1">
          <label class="text-xs text-text-muted block mb-1">Instrument</label>
          <select
            v-model="newGoal.instrumentId"
            class="w-full bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm"
          >
            <option value="">All instruments</option>
            <option
              v-for="inst in instrumentStore.instruments"
              :key="inst.id"
              :value="inst.id"
            >
              {{ inst.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <button
          class="px-4 py-2 rounded-md text-sm bg-surface-alt text-text-muted hover:bg-border transition-colors"
          @click="showForm = false"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 rounded-md text-sm bg-primary text-nord0 hover:brightness-110 transition-colors font-medium"
          :disabled="!newGoal.title.trim()"
          @click="saveGoal"
        >
          Save Goal
        </button>
      </div>
    </div>

    <!-- Add goal button -->
    <button
      v-if="!showForm"
      class="px-4 py-2.5 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors text-sm"
      @click="showForm = true"
    >
      + Add Goal
    </button>
  </div>
</template>
