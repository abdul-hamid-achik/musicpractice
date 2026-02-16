<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
    size?: 'sm' | 'md'
    animated?: boolean
  }>(),
  {
    color: 'primary',
    size: 'md',
    animated: false,
  },
)

const clampedValue = computed(() => Math.max(0, Math.min(100, props.value)))

const colorClasses: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  secondary: 'bg-secondary',
}
</script>

<template>
  <div
    class="w-full bg-surface-alt rounded-full overflow-hidden"
    :class="size === 'sm' ? 'h-1.5' : 'h-2.5'"
  >
    <div
      class="h-full rounded-full transition-all duration-500"
      :class="[colorClasses[color], animated && 'progress-animated']"
      :style="{ width: `${clampedValue}%` }"
    />
  </div>
</template>

<style scoped>
@keyframes progress-shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

.progress-animated {
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: progress-shimmer 2s ease-in-out infinite;
}
</style>
