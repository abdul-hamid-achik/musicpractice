<script setup lang="ts">
interface DayData {
  date: string
  totalMinutes: number
  sessionCount: number
}

const { data: chartData } = useFetch<DayData[]>('/api/stats/weekly')

const maxMinutes = computed(() => {
  if (!chartData.value?.length) return 60
  return Math.max(60, ...chartData.value.map((d) => Number(d.totalMinutes)))
})

const bars = computed(() => {
  if (!chartData.value) return []
  return chartData.value.map((d) => {
    const mins = Number(d.totalMinutes)
    return {
      date: d.date,
      minutes: mins,
      height: maxMinutes.value > 0 ? (mins / maxMinutes.value) * 100 : 0,
      dayLabel: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })
})
</script>

<template>
  <div class="chart-container">
    <div class="chart-bars">
      <div v-for="bar in bars" :key="bar.date" class="bar-group">
        <div class="bar-value" :class="{ 'bar-zero': bar.minutes === 0 }">
          {{ bar.minutes > 0 ? Math.round(bar.minutes) + 'm' : '' }}
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ height: bar.height + '%' }"
            :title="`${bar.dateLabel}: ${Math.round(bar.minutes)} min`"
          />
        </div>
        <div class="bar-label">{{ bar.dayLabel }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-value {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  margin-bottom: 4px;
  height: 1rem;
  display: flex;
  align-items: flex-end;
}

.bar-zero {
  visibility: hidden;
}

.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  max-width: 24px;
}

.bar-fill {
  width: 100%;
  background: var(--color-primary);
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  margin-top: 6px;
  white-space: nowrap;
}

/* Only show every other label on small screens */
@media (max-width: 640px) {
  .bar-group:nth-child(odd) .bar-label {
    visibility: hidden;
  }
}
</style>
