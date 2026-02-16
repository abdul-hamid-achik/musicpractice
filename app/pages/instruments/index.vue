<script setup lang="ts">
const instruments = [
  {
    name: 'Guitar',
    description: '6-string fretboard with scales, chords, and tablature',
    to: '/instruments/guitar',
  },
  {
    name: 'Bass',
    description: '4/5/6-string fretboard for bass guitar',
    to: '/instruments/bass',
  },
  {
    name: 'Piano',
    description: 'Interactive keyboard with scale and chord overlays',
    to: '/instruments/piano',
  },
  {
    name: 'Violin',
    description: 'Fingerboard with position guides',
    to: '/instruments/violin',
  },
]
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-2">Instruments</h1>
    <p class="text-text-muted mb-8">Explore interactive virtual instruments — visualize scales, chords, and fingering patterns across fretboards and keyboards.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink v-for="inst in instruments" :key="inst.name" :to="inst.to" class="block group">
        <NordCard>
          <div class="flex items-start gap-4">
            <!-- Guitar SVG -->
            <div v-if="inst.name === 'Guitar'" class="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg class="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2l-4 4M16 4l-2.5 2.5M11 9a3 3 0 0 1 0 4.24L8.12 16.12a3 3 0 0 1-4.24-4.24L6.76 9A3 3 0 0 1 11 9z" />
                <line x1="12" y1="12" x2="18" y2="6" />
                <path d="M5 19l-2 2M7 17l-4 4" />
              </svg>
            </div>
            <!-- Bass SVG -->
            <div v-else-if="inst.name === 'Bass'" class="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg class="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2l-4 4M16 4l-2.5 2.5" />
                <path d="M10.5 9.5a3.5 3.5 0 0 1 0 4.95L7.88 17.07a3.5 3.5 0 0 1-4.95-4.95l2.62-2.62a3.5 3.5 0 0 1 4.95 0z" />
                <line x1="12" y1="12" x2="18" y2="6" />
                <circle cx="6" cy="15" r="0.5" fill="currentColor" />
                <circle cx="8" cy="13" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <!-- Piano SVG -->
            <div v-else-if="inst.name === 'Piano'" class="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg class="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <line x1="7" y1="5" x2="7" y2="19" />
                <line x1="11" y1="5" x2="11" y2="19" />
                <line x1="15" y1="5" x2="15" y2="19" />
                <line x1="19" y1="5" x2="19" y2="19" />
                <rect x="5.5" y="5" width="2" height="8" rx="0.5" fill="currentColor" />
                <rect x="9.5" y="5" width="2" height="8" rx="0.5" fill="currentColor" />
                <rect x="14.5" y="5" width="2" height="8" rx="0.5" fill="currentColor" />
              </svg>
            </div>
            <!-- Violin SVG -->
            <div v-else class="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg class="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M8 6c0 2 1 3 4 3s4-1 4-3" />
                <path d="M8 18c0-2 1-3 4-3s4 1 4 3" />
                <path d="M8 6c-2 2-3 4-3 6s1 4 3 6" />
                <path d="M16 6c2 2 3 4 3 6s-1 4-3 6" />
                <circle cx="10" cy="12" r="1" />
                <circle cx="14" cy="12" r="1" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-text mb-1 group-hover:text-primary transition-colors">{{ inst.name }}</h3>
              <p class="text-text-muted text-sm">{{ inst.description }}</p>
            </div>
          </div>
        </NordCard>
      </NuxtLink>
    </div>
  </div>
</template>
