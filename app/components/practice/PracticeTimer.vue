<script setup lang="ts">
defineProps<{
  isActive: boolean
  isPaused?: boolean
  elapsed: number
  formatTime: (seconds: number) => string
}>()
</script>

<template>
  <div class="text-center">
    <div
      class="text-5xl font-mono font-bold tracking-wider"
      :class="isPaused ? 'text-warning animate-pulse' : 'text-text'"
    >
      {{ formatTime(elapsed) }}
    </div>
    <div v-if="isActive" class="mt-2 text-sm" :class="isPaused ? 'text-warning' : 'text-text-muted'">
      {{ isPaused ? 'Session paused' : 'Session in progress' }}
    </div>
  </div>
</template>
