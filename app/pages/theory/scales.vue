<script setup lang="ts">
import type { Scale } from '#shared/types/music-theory'

const theoryStore = useTheoryStore()

const previewNotes = ref<string[]>([])
const previewRoot = ref('C')

const isTheoryLoading = computed(() => !theoryStore.scales.length)

function handleScaleSelected(payload: { root: string; scale: Scale; notes: string[] }) {
  previewRoot.value = payload.root
  previewNotes.value = payload.notes
}

onMounted(async () => {
  if (!theoryStore.scales.length) await theoryStore.fetchScales()
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-6">Scale Explorer</h1>

    <!-- Loading State -->
    <div v-if="isTheoryLoading" class="grid grid-cols-1 xl:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading scales...">
      <!-- Skeleton for Scale Explorer -->
      <SkeletonCard variant="card" height="400px" class="xl:col-span-2" />

      <!-- Skeleton for Preview Panels -->
      <div class="space-y-4">
        <SkeletonCard variant="card" height="180px" />
        <SkeletonCard variant="card" height="180px" />
      </div>
    </div>

    <!-- Loaded Content -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Main Scale Explorer -->
      <div class="xl:col-span-2">
        <ScaleExplorer @scale-selected="handleScaleSelected" />
      </div>

      <!-- Preview Panel -->
      <div class="space-y-4">
        <NordCard title="Piano Preview">
          <PianoKeyboard
            :octaves="2"
            :start-octave="4"
            :highlighted-notes="previewNotes"
            :root-note="previewRoot"
          />
        </NordCard>

        <NordCard title="Guitar Preview">
          <GuitarFretboard
            :frets="12"
            :highlighted-notes="previewNotes"
            :root-note="previewRoot"
          />
        </NordCard>
      </div>
    </div>
  </div>
</template>
