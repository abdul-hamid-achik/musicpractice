<script setup lang="ts">
const theoryStore = useTheoryStore()
const { getNoteNames, getScaleNotes } = useMusicTheory()

const noteNames = getNoteNames()
const selectedRoot = ref('C')
const position = ref(1)
const selectedScaleId = ref('')
const lastClickedNote = ref('')

const highlightedNotes = computed(() => {
  if (selectedScaleId.value) {
    const scale = theoryStore.scales.find((s) => s.id === selectedScaleId.value)
    if (scale) return getScaleNotes(selectedRoot.value, scale.intervals)
  }
  return []
})

function handleNoteClick(payload: { note: string; string: number; finger: number; octave: number }) {
  lastClickedNote.value = `${payload.note}${payload.octave}`
}

onMounted(async () => {
  if (!theoryStore.scales.length) await theoryStore.fetchScales()
  if (theoryStore.scales.length) selectedScaleId.value = theoryStore.scales[0]!.id
})
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm text-text-muted mb-4">
      <NuxtLink to="/instruments" class="hover:text-primary transition-colors">Instruments</NuxtLink>
      <span>/</span>
      <span class="text-text">Violin</span>
    </nav>

    <div class="flex items-center justify-between mb-2">
      <h1 class="text-3xl font-bold text-text">Violin</h1>
      <NuxtLink to="/practice/session?instrument=violin">
        <NordButton variant="primary" size="sm">Practice Violin</NordButton>
      </NuxtLink>
    </div>
    <p class="text-text-muted mb-6">Fingerboard with position guides — visualize scales and finger placements.</p>

    <!-- Controls -->
    <NordCard class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Root Note -->
        <div>
          <label class="block text-sm text-text-muted mb-1">Root Note</label>
          <select
            v-model="selectedRoot"
            class="bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="note in noteNames" :key="note" :value="note">{{ note }}</option>
          </select>
        </div>

        <!-- Position Selector -->
        <div>
          <label class="block text-sm text-text-muted mb-1">Position</label>
          <select
            v-model.number="position"
            class="bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="p in 7" :key="p" :value="p">{{ p }}{{ p === 1 ? 'st' : p === 2 ? 'nd' : p === 3 ? 'rd' : 'th' }} Position</option>
          </select>
        </div>

        <!-- Scale Selector -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm text-text-muted mb-1">Scale Overlay</label>
          <select
            v-model="selectedScaleId"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None</option>
            <option v-for="scale in theoryStore.scales" :key="scale.id" :value="scale.id">
              {{ scale.name }}
            </option>
          </select>
        </div>
      </div>
    </NordCard>

    <!-- Fingerboard -->
    <NordCard>
      <ViolinFingerboard
        :position="position"
        :highlighted-notes="highlightedNotes"
        :root-note="selectedRoot"
        @note-click="handleNoteClick"
      />
    </NordCard>

    <!-- Note Display -->
    <NordCard v-if="lastClickedNote" title="Last Played" class="mt-6">
      <div class="text-center">
        <span class="text-2xl font-bold text-primary">{{ lastClickedNote }}</span>
      </div>
    </NordCard>
  </div>
</template>
