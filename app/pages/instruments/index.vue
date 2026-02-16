<script setup lang="ts">
const instruments = [
  {
    name: 'Guitar',
    emoji: '\uD83C\uDFB8',
    description: '6-string fretboard with scales, chords, and tablature',
    to: '/instruments/guitar',
  },
  {
    name: 'Bass',
    emoji: '\uD83C\uDFB8',
    description: '4/5/6-string fretboard for bass guitar',
    to: '/instruments/bass',
  },
  {
    name: 'Piano',
    emoji: '\uD83C\uDFB9',
    description: 'Interactive keyboard with scale and chord overlays',
    to: '/instruments/piano',
  },
  {
    name: 'Violin',
    emoji: '\uD83C\uDFBB',
    description: 'Fingerboard with position guides',
    to: '/instruments/violin',
  },
]
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-8">Instruments</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NordCard v-for="inst in instruments" :key="inst.name">
        <div class="flex flex-col items-center text-center py-4">
          <span class="text-5xl mb-4">{{ inst.emoji }}</span>
          <h3 class="text-xl font-semibold text-text mb-2">{{ inst.name }}</h3>
          <p class="text-text-muted text-sm mb-6">{{ inst.description }}</p>
          <NuxtLink :to="inst.to">
            <NordButton variant="primary">Explore</NordButton>
          </NuxtLink>
        </div>
      </NordCard>
    </div>
  </div>
</template>
