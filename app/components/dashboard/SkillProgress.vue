<script setup lang="ts">
interface ProgressEntry {
  id: string
  songTitle: string | null
  completionPercent: number
  maxTempoBpm: number | null
  lastPracticedAt: string | null
  practiceCount: number
}

const { data: progressData, status } = useFetch<{ data: ProgressEntry[] }>('/api/progress?limit=100')

const isLoading = computed(() => status.value === 'pending')
const skills = computed(() => progressData.value?.data ?? [])
const hasSkills = computed(() => skills.value.length > 0)
</script>

<template>
  <div class="skill-progress">
    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Loading progress...">
      <div v-for="i in 3" :key="i" class="space-y-2">
        <NordSkeleton height="0.875rem" width="60%" />
        <NordSkeleton height="6px" rounded="rounded-full" />
        <div class="flex gap-4">
          <NordSkeleton height="0.625rem" width="50px" />
          <NordSkeleton height="0.625rem" width="60px" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasSkills" class="empty-state">
      <p class="text-text-muted text-sm">No song progress tracked yet. Start practicing a song to see your progress here.</p>
    </div>

    <div v-else class="skill-list">
      <div v-for="skill in skills" :key="skill.id" class="skill-item">
        <div class="skill-header">
          <span class="skill-name">{{ skill.songTitle || 'Unknown Song' }}</span>
          <span class="skill-percent">{{ Math.round(skill.completionPercent) }}%</span>
        </div>

        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: skill.completionPercent + '%' }"
          />
        </div>

        <div class="skill-meta">
          <span v-if="skill.maxTempoBpm" class="meta-item">
            {{ skill.maxTempoBpm }} BPM max
          </span>
          <span class="meta-item">
            {{ skill.practiceCount }} session{{ skill.practiceCount !== 1 ? 's' : '' }}
          </span>
          <span v-if="skill.lastPracticedAt" class="meta-item">
            {{ new Date(skill.lastPracticedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skill-item {
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.skill-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.skill-percent {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.skill-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.meta-item {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.empty-state {
  padding: 1.5rem;
  text-align: center;
}
</style>
