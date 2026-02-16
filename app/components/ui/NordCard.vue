<script setup lang="ts">
defineProps<{
  title?: string
  padding?: string
}>()
</script>

<template>
  <div class="bg-card border border-border rounded-lg" :class="padding || 'p-6'">
    <div v-if="title || $slots.header" class="mb-4">
      <slot name="header">
        <h3 class="text-lg font-semibold text-text">{{ title }}</h3>
      </slot>
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-border">
      <slot name="footer" />
    </div>
  </div>
</template>
