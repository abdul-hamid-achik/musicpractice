<script setup lang="ts">
const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Practice', to: '/practice' },
  { label: 'Instruments', to: '/instruments' },
  { label: 'Theory', to: '/theory' },
  { label: 'Songs', to: '/songs' },
]
</script>

<template>
  <header class="fixed top-0 w-full bg-surface-alt border-b border-border z-40 h-16 flex items-center justify-between px-6">
    <NuxtLink to="/" class="flex items-center gap-2">
      <span class="text-primary text-2xl">&#9834;</span>
      <span class="font-bold text-xl text-primary">MusicPractice</span>
    </NuxtLink>
    <nav aria-label="Primary navigation" class="flex items-center gap-6">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="text-text-muted hover:text-text transition-colors duration-200"
        active-class="!text-primary"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
