<script setup lang="ts">
import { ref } from 'vue'

const mobileOpen = ref(false)

const sections = [
  {
    label: 'Practice',
    links: [
      { label: 'Practice Hub', to: '/practice' },
      { label: 'Active Session', to: '/practice/session' },
      { label: 'History', to: '/practice/history' },
    ],
  },
  {
    label: 'Instruments',
    links: [
      { label: 'Guitar', to: '/instruments/guitar' },
      { label: 'Bass', to: '/instruments/bass' },
      { label: 'Piano', to: '/instruments/piano' },
      { label: 'Violin', to: '/instruments/violin' },
    ],
  },
  {
    label: 'Theory',
    links: [
      { label: 'Scales', to: '/theory/scales' },
      { label: 'Chords', to: '/theory/chords' },
      { label: 'Ear Training', to: '/theory/ear-training' },
    ],
  },
]

const standaloneLinks = [
  { label: 'Songs', to: '/songs' },
  { label: 'Settings', to: '/settings' },
]
</script>

<template>
  <!-- Mobile toggle -->
  <button
    class="lg:hidden fixed top-4 left-4 z-50 text-text-muted hover:text-text"
    @click="mobileOpen = !mobileOpen"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-surface-alt border-r border-border overflow-y-auto transition-transform duration-200 z-30',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <nav class="p-4 space-y-6">
      <div v-for="section in sections" :key="section.label">
        <h4 class="uppercase text-xs text-text-muted tracking-wider mb-2 px-4">
          {{ section.label }}
        </h4>
        <NuxtLink
          v-for="link in section.links"
          :key="link.to"
          :to="link.to"
          class="block py-2 px-4 rounded-md text-text-muted hover:bg-card hover:text-text transition-colors duration-150"
          active-class="!bg-card !text-primary"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <div class="border-t border-border pt-4">
        <NuxtLink
          v-for="link in standaloneLinks"
          :key="link.to"
          :to="link.to"
          class="block py-2 px-4 rounded-md text-text-muted hover:bg-card hover:text-text transition-colors duration-150"
          active-class="!bg-card !text-primary"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>
  </aside>

  <!-- Mobile backdrop -->
  <div
    v-if="mobileOpen"
    class="lg:hidden fixed inset-0 bg-black/30 z-20"
    @click="mobileOpen = false"
  />
</template>
