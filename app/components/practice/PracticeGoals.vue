<script setup lang="ts">
import type { PracticeGoal } from '#shared/types/practice'

const practiceStore = usePracticeStore()
const instrumentStore = useInstrumentStore()
const { showSuccess, showError, showInfo } = useToast()

const goals = ref<PracticeGoal[]>([])
const isLoading = ref(false)
const showForm = ref(false)
const editingGoalId = ref<string | null>(null)

const newGoal = ref({
  title: '',
  targetMinutesPerWeek: 60,
  instrumentId: '',
})

// Weekly progress data
const weeklyProgress = ref({
  totalMinutes: 0,
  previousWeekMinutes: 0,
  breakdownByInstrument: [] as { instrumentId: string | null; instrumentName: string; minutes: number; color: string }[],
})

const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

onMounted(async () => {
  if (instrumentStore.instruments.length === 0) {
    await instrumentStore.fetchInstruments()
  }
  await practiceStore.fetchSessions()
  await fetchGoals()
  calculateWeeklyProgress()
})

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return end
}

function getWeeklyMinutes(instrumentId: string | null, startDate?: Date, endDate?: Date): number {
  const start = startDate || getStartOfWeek(new Date())
  const end = endDate || getEndOfWeek(new Date())
  
  return practiceStore.sessions
    .filter((s) => {
      const sessionDate = new Date(s.startedAt)
      const matchesInstrument = !instrumentId || s.instrumentId === instrumentId
      const inRange = sessionDate >= start && sessionDate < end
      return matchesInstrument && inRange
    })
    .reduce((sum, s) => sum + Math.floor((s.durationSeconds || 0) / 60), 0)
}

function getPreviousWeekMinutes(instrumentId: string | null): number {
  const now = new Date()
  const prevWeekStart = new Date(now)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevWeekEnd = new Date()
  
  return getWeeklyMinutes(instrumentId, getStartOfWeek(prevWeekStart), getEndOfWeek(prevWeekStart))
}

function progressPercent(goal: PracticeGoal): number {
  const actual = getWeeklyMinutes(goal.instrumentId)
  if (goal.targetMinutesPerWeek <= 0) return 0
  return Math.min(100, Math.round((actual / goal.targetMinutesPerWeek) * 100))
}

function getProgressStatus(goal: PracticeGoal): 'on-track' | 'behind' | 'far-behind' | 'completed' {
  const percent = progressPercent(goal)
  const daysRemaining = getDaysRemainingInWeek()
  const daysInWeek = 7
  const expectedPercent = ((daysInWeek - daysRemaining) / daysInWeek) * 100
  
  if (percent >= 100) return 'completed'
  if (percent >= expectedPercent) return 'on-track'
  if (percent >= expectedPercent * 0.5) return 'behind'
  return 'far-behind'
}

function getProgressColor(goal: PracticeGoal): 'success' | 'primary' | 'warning' | 'error' {
  const status = getProgressStatus(goal)
  switch (status) {
    case 'completed':
      return 'success'
    case 'on-track':
      return 'primary'
    case 'behind':
      return 'warning'
    case 'far-behind':
      return 'error'
    default:
      return 'primary'
  }
}

function getDaysRemainingInWeek(): number {
  const now = new Date()
  const endOfWeek = getEndOfWeek(now)
  const diffTime = endOfWeek.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

function getInstrumentName(instrumentId: string | null): string {
  if (!instrumentId) return 'All instruments'
  const inst = instrumentStore.instruments.find((i) => i.id === instrumentId)
  return inst?.name || 'Unknown'
}

function calculateWeeklyProgress() {
  const now = new Date()
  const startOfWeek = getStartOfWeek(now)
  const prevWeekStart = new Date(startOfWeek)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  
  // Total minutes this week
  weeklyProgress.value.totalMinutes = getWeeklyMinutes(null, startOfWeek, getEndOfWeek(now))
  
  // Previous week total (7 days before this week's start)
  const prevWeekEnd = new Date(startOfWeek)
  weeklyProgress.value.previousWeekMinutes = getWeeklyMinutes(null, prevWeekStart, prevWeekEnd)
  
  // Breakdown by instrument
  const instrumentMap = new Map<string | null, number>()
  
  practiceStore.sessions
    .filter((s) => {
      const sessionDate = new Date(s.startedAt)
      return sessionDate >= startOfWeek && sessionDate < getEndOfWeek(now)
    })
    .forEach((s) => {
      const minutes = Math.floor((s.durationSeconds || 0) / 60)
      const key = s.instrumentId || 'all'
      instrumentMap.set(key, (instrumentMap.get(key) || 0) + minutes)
    })
  
  weeklyProgress.value.breakdownByInstrument = Array.from(instrumentMap.entries())
    .map(([instrumentId, minutes], index) => ({
      instrumentId: instrumentId === 'all' ? null : instrumentId,
      instrumentName: instrumentId === 'all' ? 'All instruments' : getInstrumentName(instrumentId),
      minutes,
      color: colors[index % colors.length]!,
    }))
    .sort((a, b) => b.minutes - a.minutes)
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
  if (!newGoal.value.title.trim()) {
    showError('Please enter a goal title')
    return
  }
  
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
      showSuccess('Goal updated successfully')
    } else {
      await $fetch('/api/goals', {
        method: 'POST',
        body: {
          title: newGoal.value.title,
          targetMinutesPerWeek: newGoal.value.targetMinutesPerWeek,
          instrumentId: newGoal.value.instrumentId || null,
        },
      })
      showSuccess('Goal created successfully')
    }
    cancelForm()
    await fetchGoals()
  } catch (error) {
    console.error('Error saving goal:', error)
    showError('Failed to save goal')
  }
}

async function deleteGoal(goalId: string) {
  try {
    await $fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    showSuccess('Goal deleted successfully')
    await fetchGoals()
  } catch (error) {
    console.error('Error deleting goal:', error)
    showError('Failed to delete goal')
  }
}

async function fetchGoals() {
  isLoading.value = true
  try {
    const res = await $fetch<{ data: PracticeGoal[] }>('/api/goals')
    goals.value = res.data
  } catch (error) {
    console.error('Error fetching goals:', error)
    goals.value = []
    showError('Failed to load goals')
  } finally {
    isLoading.value = false
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'on-track':
      return 'M13 10V3L4 14h7v7l9-11h-7z'
    case 'behind':
      return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'far-behind':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Goal completed!'
    case 'on-track':
      return 'On track'
    case 'behind':
      return 'Behind schedule'
    case 'far-behind':
      return 'Far behind'
    default:
      return ''
  }
}

function getStatusColorClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-success'
    case 'on-track':
      return 'text-primary'
    case 'behind':
      return 'text-warning'
    case 'far-behind':
      return 'text-error'
    default:
      return 'text-text'
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Week Progress Overview -->
    <NordCard title="Week Progress">
      <div class="space-y-4">
        <!-- Total minutes and comparison -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-muted">Total practiced this week</p>
            <p class="text-2xl font-bold text-text">{{ weeklyProgress.totalMinutes }} min</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-text-muted">vs last week</p>
            <p 
              class="text-lg font-semibold"
              :class="weeklyProgress.totalMinutes >= weeklyProgress.previousWeekMinutes ? 'text-success' : 'text-error'"
            >
              {{ weeklyProgress.totalMinutes >= weeklyProgress.previousWeekMinutes ? '+' : '' }}
              {{ weeklyProgress.totalMinutes - weeklyProgress.previousWeekMinutes }} min
            </p>
          </div>
        </div>

        <!-- Progress bar for overall weekly goal (assuming 300 min default) -->
        <div>
          <div class="flex justify-between text-xs text-text-muted mb-1">
            <span>Weekly progress</span>
            <span>{{ Math.round((weeklyProgress.totalMinutes / 300) * 100) }}% of 300 min</span>
          </div>
          <NordProgressBar 
            :value="Math.min(100, Math.round((weeklyProgress.totalMinutes / 300) * 100))"
            color="primary"
            size="md"
          />
        </div>

        <!-- Breakdown by instrument -->
        <div v-if="weeklyProgress.breakdownByInstrument.length > 0">
          <p class="text-sm font-medium text-text mb-2">Breakdown by instrument</p>
          <div class="space-y-2">
            <div
              v-for="item in weeklyProgress.breakdownByInstrument"
              :key="item.instrumentId || 'all'"
              class="flex items-center gap-2"
            >
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-xs text-text-muted flex-1">{{ item.instrumentName }}</span>
              <span class="text-xs font-medium text-text">{{ item.minutes }} min</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-sm text-text-muted">
          No practice sessions this week
        </div>
      </div>
    </NordCard>

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
          <div class="flex-1">
            <h4 class="font-medium text-text">{{ goal.title }}</h4>
            <p class="text-xs text-text-muted">{{ getInstrumentName(goal.instrumentId) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <!-- Status indicator -->
            <div
              class="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-alt"
              :class="getStatusColorClass(getProgressStatus(goal))"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="getStatusIcon(getProgressStatus(goal))" />
              </svg>
              <span class="text-xs font-medium">{{ getStatusText(getProgressStatus(goal)) }}</span>
            </div>
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

        <!-- Progress details -->
        <div class="mt-3">
          <div class="flex justify-between items-end mb-1">
            <span class="text-sm font-medium text-text">
              {{ getWeeklyMinutes(goal.instrumentId) }} / {{ goal.targetMinutesPerWeek }} min
            </span>
            <span class="text-sm font-bold" :class="getStatusColorClass(getProgressStatus(goal))">
              {{ progressPercent(goal) }}%
            </span>
          </div>
          
          <NordProgressBar
            :value="progressPercent(goal)"
            :color="getProgressColor(goal)"
            size="md"
          />
          
          <div class="flex justify-between mt-2 text-xs text-text-muted">
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {{ getDaysRemainingInWeek() }} days remaining
            </span>
            <span>Target: {{ goal.targetMinutesPerWeek }} min/week</span>
          </div>
        </div>
      </div>
    </StaggeredList>

    <!-- Add/Edit goal form -->
    <div v-if="showForm" class="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
      <div>
        <label class="text-xs text-text-muted block mb-1">Goal title</label>
        <input
          v-model="newGoal.title"
          type="text"
          placeholder="e.g., Daily Guitar Practice"
          class="w-full bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="text-xs text-text-muted block mb-1">Target minutes/week</label>
          <input
            v-model.number="newGoal.targetMinutesPerWeek"
            type="number"
            min="1"
            class="w-full bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div class="flex-1">
          <label class="text-xs text-text-muted block mb-1">Instrument</label>
          <select
            v-model="newGoal.instrumentId"
            class="w-full bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
      class="px-4 py-2.5 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors text-sm font-medium"
      @click="showForm = true"
    >
      + Add Goal
    </button>
  </div>
</template>
