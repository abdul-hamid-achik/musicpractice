<script setup lang="ts">
defineProps<{
  title?: string
  padding?: string
}>()
</script>

<template>
  <div class="bg-card border border-border rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5" :class="padding || 'p-6'">
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
