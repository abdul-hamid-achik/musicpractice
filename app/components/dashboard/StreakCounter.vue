<script setup lang="ts">
const { data: streak, status } = useFetch('/api/streaks')

const isLoaded = computed(() => status.value === 'success')
const currentStreak = computed(() => streak.value?.currentStreak ?? 0)
const longestStreak = computed(() => streak.value?.longestStreak ?? 0)
const practicedToday = computed(() => streak.value?.practicedToday ?? false)
</script>

<template>
  <div class="streak-counter" :class="{ 'streak-active': practicedToday && isLoaded }">
    <div class="streak-flame" :class="{ 'flame-lit': currentStreak > 0 && isLoaded }">
      <!-- CSS flame icon -->
      <svg viewBox="0 0 24 32" class="flame-svg" aria-hidden="true">
        <path
          d="M12 0C12 0 4 10 4 18C4 24 7.5 28 12 28C16.5 28 20 24 20 18C20 10 12 0 12 0Z"
          class="flame-outer"
        />
        <path
          d="M12 8C12 8 8 14 8 19C8 23 9.5 25 12 25C14.5 25 16 23 16 19C16 14 12 8 12 8Z"
          class="flame-inner"
        />
      </svg>
    </div>

    <div class="streak-info">
      <div class="streak-number">{{ isLoaded ? currentStreak : '-' }}</div>
      <div class="streak-label">day{{ currentStreak !== 1 ? 's' : '' }} streak</div>
    </div>

    <div class="streak-meta">
      <div class="streak-best">
        <span class="meta-value">{{ isLoaded ? longestStreak : '-' }}</span>
        <span class="meta-label">best</span>
      </div>
      <div class="streak-status">
        <span v-if="practicedToday" class="status-done">Practiced today</span>
        <span v-else class="status-pending">Practice to keep it going!</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streak-counter {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.streak-counter.streak-active {
  border-color: var(--color-nord12);
  box-shadow: 0 0 20px rgba(208, 135, 112, 0.15);
}

.streak-flame {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flame-svg {
  width: 36px;
  height: 48px;
  filter: grayscale(1) opacity(0.3);
  transition: filter 0.5s;
}

.flame-lit .flame-svg {
  filter: none;
  animation: flicker 2s ease-in-out infinite alternate;
}

.flame-outer {
  fill: var(--color-nord12);
}

.flame-inner {
  fill: var(--color-nord13);
}

.streak-info {
  flex: 1;
  min-width: 0;
}

.streak-number {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  color: var(--color-text);
}

.streak-active .streak-number {
  color: var(--color-nord12);
}

.streak-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: 0.125rem;
}

.streak-meta {
  text-align: right;
  flex-shrink: 0;
}

.streak-best {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  justify-content: flex-end;
}

.meta-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.meta-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.streak-status {
  margin-top: 0.25rem;
}

.status-done {
  font-size: 0.75rem;
  color: var(--color-success);
  font-weight: 500;
}

.status-pending {
  font-size: 0.75rem;
  color: var(--color-nord12);
  font-weight: 500;
}

@keyframes flicker {
  0% { transform: scale(1) rotate(-1deg); }
  50% { transform: scale(1.05) rotate(1deg); }
  100% { transform: scale(1) rotate(-0.5deg); }
}
</style>
