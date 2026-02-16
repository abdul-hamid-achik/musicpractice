<script setup lang="ts">
const theoryStore = useTheoryStore()

const previewNotes = ref<string[]>([])
const previewRoot = ref('C')

function handleScaleSelected(payload: { root: string; scale: any; notes: string[] }) {
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

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
