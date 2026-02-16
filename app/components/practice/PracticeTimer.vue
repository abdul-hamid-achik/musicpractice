<script setup lang="ts">
const props = defineProps<{
  isActive: boolean
  elapsed: number
  formatTime: (seconds: number) => string
}>()
</script>

<template>
  <div class="text-center">
    <div class="text-5xl font-mono font-bold text-text tracking-wider">
      {{ formatTime(elapsed) }}
    </div>
    <div v-if="isActive" class="mt-2 text-text-muted text-sm">
      Session in progress
    </div>
  </div>
</template>
