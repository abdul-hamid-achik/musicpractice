<script setup lang="ts">
const cards = [
  {
    title: 'Scale Explorer',
    description: 'Explore major, minor, pentatonic, modal, and exotic scales across all keys.',
    to: '/theory/scales',
  },
  {
    title: 'Chord Library',
    description: 'Browse triads, seventh chords, extended chords, and voicings.',
    to: '/theory/chords',
  },
  {
    title: 'Ear Training',
    description: 'Train your ear with interval recognition and note identification exercises.',
    to: '/theory/ear-training',
  },
]
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-2">Music Theory</h1>
    <p class="text-text-muted mb-8">Build your understanding of scales, chords, intervals, and harmonic relationships.</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <NordCard v-for="card in cards" :key="card.title" :title="card.title">
        <p class="text-text-muted text-sm mb-4">{{ card.description }}</p>
        <template #footer>
          <NuxtLink :to="card.to">
            <NordButton variant="primary" size="sm">Open</NordButton>
          </NuxtLink>
        </template>
      </NordCard>
    </div>

    <!-- Circle of Fifths full-width -->
    <NordCard title="Circle of Fifths">
      <CircleOfFifths />
    </NordCard>
  </div>
</template>
