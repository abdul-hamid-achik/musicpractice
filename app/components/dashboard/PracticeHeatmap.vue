<script setup lang="ts">
interface HeatmapDay {
  date: string
  totalMinutes: number
  sessionCount: number
}

const { data: rawData } = useFetch<HeatmapDay[]>('/api/stats/heatmap')

// Build full 90-day grid
const days = computed(() => {
  const map = new Map<string, HeatmapDay>()
  if (rawData.value) {
    for (const row of rawData.value) {
      map.set(row.date, row)
    }
  }

  const result: { date: string; minutes: number; level: number }[] = []
  const today = new Date()

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]!
    const entry = map.get(dateStr)
    const mins = entry ? Number(entry.totalMinutes) : 0
    result.push({
      date: dateStr,
      minutes: mins,
      level: mins === 0 ? 0 : mins < 15 ? 1 : mins < 30 ? 2 : mins < 60 ? 3 : 4,
    })
  }

  return result
})

// Build weeks for the grid (columns = weeks, rows = day of week)
const weeks = computed(() => {
  const result: typeof days.value[] = []
  let currentWeek: typeof days.value = []

  for (const day of days.value) {
    const dow = new Date(day.date + 'T12:00:00').getDay()
    if (dow === 0 && currentWeek.length > 0) {
      result.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  }
  if (currentWeek.length > 0) {
    result.push(currentWeek)
  }

  return result
})

const monthLabels = computed(() => {
  const labels: { label: string; col: number }[] = []
  let lastMonth = -1

  for (let w = 0; w < weeks.value.length; w++) {
    const firstDay = weeks.value[w]![0]
    if (!firstDay) continue
    const month = new Date(firstDay.date + 'T12:00:00').getMonth()
    if (month !== lastMonth) {
      labels.push({
        label: new Date(firstDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }),
        col: w,
      })
      lastMonth = month
    }
  }

  return labels
})

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="heatmap-container">
    <div class="heatmap-months">
      <span
        v-for="m in monthLabels"
        :key="m.col"
        class="month-label"
        :style="{ gridColumn: m.col + 1 }"
      >
        {{ m.label }}
      </span>
    </div>

    <div class="heatmap-grid">
      <div v-for="(week, wi) in weeks" :key="wi" class="heatmap-col">
        <div
          v-for="day in week"
          :key="day.date"
          class="heatmap-cell"
          :class="`level-${day.level}`"
          :title="`${formatDate(day.date)}: ${Math.round(day.minutes)} min`"
        />
      </div>
    </div>

    <div class="heatmap-legend">
      <span class="legend-label">Less</span>
      <div class="heatmap-cell level-0" />
      <div class="heatmap-cell level-1" />
      <div class="heatmap-cell level-2" />
      <div class="heatmap-cell level-3" />
      <div class="heatmap-cell level-4" />
      <span class="legend-label">More</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  overflow-x: auto;
}

.heatmap-months {
  display: grid;
  grid-auto-columns: 14px;
  gap: 3px;
  margin-bottom: 4px;
  margin-left: 2px;
}

.month-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.heatmap-grid {
  display: flex;
  gap: 3px;
}

.heatmap-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.heatmap-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  cursor: default;
  transition: outline 0.15s;
}

.heatmap-cell:hover {
  outline: 2px solid var(--color-text-muted);
  outline-offset: -1px;
}

.level-0 { background: var(--color-surface-alt); }
.level-1 { background: rgba(163, 190, 140, 0.3); }
.level-2 { background: rgba(163, 190, 140, 0.5); }
.level-3 { background: rgba(163, 190, 140, 0.75); }
.level-4 { background: var(--color-nord14); }

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.75rem;
  justify-content: flex-end;
}

.heatmap-legend .heatmap-cell {
  width: 12px;
  height: 12px;
}

.legend-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
}
</style>
