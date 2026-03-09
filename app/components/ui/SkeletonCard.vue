<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'card' | 'text' | 'circle' | 'image'
    width?: string
    height?: string
    lines?: number
  }>(),
  {
    variant: 'card',
    width: '100%',
    height: 'auto',
    lines: 3,
  },
)
</script>

<template>
  <div
    v-if="variant === 'card'"
    class="bg-surface-alt animate-pulse rounded-lg p-4"
    :style="{ width, height: height !== 'auto' ? height : undefined }"
    aria-busy="true"
    aria-label="Loading content..."
  >
    <div class="space-y-3">
      <NordSkeleton height="1.25rem" width="60%" />
      <NordSkeleton height="0.75rem" width="80%" />
      <NordSkeleton height="0.75rem" width="70%" />
    </div>
  </div>

  <div
    v-else-if="variant === 'text'"
    class="space-y-2"
    :style="{ width }"
    aria-busy="true"
    aria-label="Loading text..."
  >
    <NordSkeleton
      v-for="i in lines"
      :key="i"
      height="0.75rem"
      :width="i === lines ? '40%' : '100%'"
      :rounded="i === lines ? 'rounded-full' : 'rounded'"
    />
  </div>

  <div
    v-else-if="variant === 'circle'"
    class="bg-surface-alt animate-pulse rounded-full"
    :style="{ width, height }"
    aria-busy="true"
    aria-label="Loading..."
  />

  <div
    v-else-if="variant === 'image'"
    class="bg-surface-alt animate-pulse rounded-lg"
    :style="{ width, height }"
    aria-busy="true"
    aria-label="Loading image..."
  />
</template>
