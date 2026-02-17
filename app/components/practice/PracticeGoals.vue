<script setup lang="ts">
import type { PracticeGoal } from '#shared/types/practice'

const practiceStore = usePracticeStore()
const instrumentStore = useInstrumentStore()

const goals = ref<PracticeGoal[]>([])
const isLoading = ref(false)
const showForm = ref(false)
const editingGoalId = ref<string | null>(null)

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
    const res = await $fetch<{ data: PracticeGoal[] }>('/api/goals')
    goals.value = res.data
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

function startEdit(goal: PracticeGoal) {
  editingGoalId.value = goal.id
  newGoal.value = {
    title: goal.title,
    targetMinutesPerWeek: goal.targetMinutesPerWeek,
    instrumentId: goal.instrumentId || '',
  }
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingGoalId.value = null
  newGoal.value = { title: '', targetMinutesPerWeek: 60, instrumentId: '' }
}

async function saveGoal() {
  if (!newGoal.value.title.trim()) return
  try {
    if (editingGoalId.value) {
      await $fetch(`/api/goals/${editingGoalId.value}`, {
        method: 'PUT',
        body: {
          title: newGoal.value.title,
          targetMinutesPerWeek: newGoal.value.targetMinutesPerWeek,
          instrumentId: newGoal.value.instrumentId || null,
        },
      })
    } else {
      await $fetch('/api/goals', {
        method: 'POST',
        body: {
          title: newGoal.value.title,
          targetMinutesPerWeek: newGoal.value.targetMinutesPerWeek,
          instrumentId: newGoal.value.instrumentId || null,
        },
      })
    }
    cancelForm()
    await fetchGoals()
  } catch {
    // handle error silently
  }
}

async function deleteGoal(goalId: string) {
  try {
    await $fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    await fetchGoals()
  } catch {
    // handle error silently
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Loading skeletons -->
    <template v-if="isLoading">
      <div v-for="i in 2" :key="i" class="bg-card border border-border rounded-lg p-4 space-y-3">
        <NordSkeleton height="1rem" width="60%" />
        <NordSkeleton height="0.75rem" width="40%" />
        <NordSkeleton height="0.625rem" rounded="rounded-full" />
      </div>
    </template>

    <!-- Empty state -->
    <div
      v-else-if="goals.length === 0"
      class="text-center py-8 text-text-muted"
    >
      <p>No practice goals set yet.</p>
      <p class="text-sm mt-1">Add a goal to track your progress.</p>
    </div>

    <!-- Goal cards -->
    <StaggeredList v-else class="flex flex-col gap-4">
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
          <div class="flex items-center gap-2">
            <span
              class="text-sm font-medium"
              :class="progressPercent(goal) >= 100 ? 'text-success' : 'text-primary'"
            >
              {{ progressPercent(goal) }}%
            </span>
            <button
              class="text-text-muted hover:text-primary transition-colors p-1"
              title="Edit goal"
              @click="startEdit(goal)"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
            <button
              class="text-text-muted hover:text-error transition-colors p-1"
              title="Delete goal"
              @click="deleteGoal(goal.id)"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mt-3">
          <NordProgressBar
            :value="Math.min(100, progressPercent(goal))"
            :color="progressPercent(goal) >= 100 ? 'success' : 'primary'"
            size="md"
          />
        </div>

        <div class="flex justify-between mt-1.5 text-xs text-text-muted">
          <span>{{ getWeeklyMinutes(goal.instrumentId) }} min this week</span>
          <span>Target: {{ goal.targetMinutesPerWeek }} min/week</span>
        </div>
      </div>
    </StaggeredList>

    <!-- Add/Edit goal form -->
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
        <NordButton variant="ghost" size="sm" @click="cancelForm">
          Cancel
        </NordButton>
        <NordButton
          variant="primary"
          size="sm"
          :disabled="!newGoal.title.trim()"
          @click="saveGoal"
        >
          {{ editingGoalId ? 'Update Goal' : 'Save Goal' }}
        </NordButton>
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
