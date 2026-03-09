<script setup lang="ts">
import { useMusicTheory } from '~/composables/useMusicTheory'
import { useTheoryStore } from '~/stores/theory'
import type { Scale } from '#shared/types/music-theory'

const emit = defineEmits<{
  scaleSelected: [payload: { root: string; scale: Scale; notes: string[] }]
}>()

const { getNoteNames, getScaleNotes } = useMusicTheory()
const theoryStore = useTheoryStore()

const noteNames = getNoteNames()
const selectedRoot = ref('C')
const selectedScale = ref<Scale | null>(null)
const isPlaying = ref(false)

const INTERVAL_NAMES: Record<number, string> = {
  0: 'P1', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
  6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7',
}

const scaleNotes = computed(() => {
  if (!selectedScale.value) return []
  return getScaleNotes(selectedRoot.value, selectedScale.value.intervals)
})

const scaleFormula = computed(() => {
  if (!selectedScale.value) return ''
  return scaleNotes.value.join(' ')
})

const scaleDegrees = computed(() => {
  if (!selectedScale.value) return []
  return selectedScale.value.intervals.map((interval, i) => ({
    degree: i + 1,
    note: scaleNotes.value[i],
    interval,
    name: INTERVAL_NAMES[interval] || `${interval}st`,
  }))
})

const groupedScales = computed(() => {
  const groups: Record<string, Scale[]> = {}
  for (const scale of theoryStore.scales) {
    if (!groups[scale.category]) groups[scale.category] = []
    groups[scale.category]!.push(scale)
  }
  return groups
})

const isLoaded = computed(() => theoryStore.scales.length > 0)

const categoryOrder = ['diatonic', 'pentatonic', 'minor', 'blues', 'jazz', 'symmetric', 'exotic', 'chromatic']

const sortedCategories = computed(() => {
  const cats = Object.keys(groupedScales.value)
  return cats.toSorted((a, b) => {
    const ai = categoryOrder.indexOf(a)
    const bi = categoryOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
})

function selectRoot(note: string) {
  selectedRoot.value = note
  theoryStore.setRoot(note)
  emitSelection()
}

function selectScale(scale: Scale) {
  selectedScale.value = scale
  theoryStore.setScale(scale)
  emitSelection()
}

function emitSelection() {
  if (selectedScale.value) {
    emit('scaleSelected', {
      root: selectedRoot.value,
      scale: selectedScale.value,
      notes: scaleNotes.value,
    })
  }
}

async function playScale() {
  if (isPlaying.value || !selectedScale.value) return
  isPlaying.value = true
  try {
    const Tone = await import('tone')
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3 },
    }).toDestination()

    const notes = scaleNotes.value
    const chromaticOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const rootIdx = chromaticOrder.indexOf(notes[0] ?? 'C')
    const now = Tone.now()
    for (let i = 0; i < notes.length; i++) {
      const noteIdx = chromaticOrder.indexOf(notes[i] ?? 'C')
      const octave = i > 0 && noteIdx <= rootIdx ? 5 : 4
      const noteStr = `${notes[i]!}${octave}`
      synth.triggerAttackRelease(noteStr, '8n', now + i * 0.3)
    }
    // Play root an octave up at the end
    synth.triggerAttackRelease(`${notes[0]}5`, '4n', now + notes.length * 0.3)

    await new Promise((resolve) => setTimeout(resolve, (notes.length + 1) * 300 + 200))
    synth.dispose()
  } catch {
    // Tone.js may not be available in SSR
  } finally {
    isPlaying.value = false
  }
}

onMounted(async () => {
  if (theoryStore.scales.length === 0) {
    await theoryStore.fetchScales()
  }
  if (theoryStore.scales.length > 0) {
    selectScale(theoryStore.scales[0]!)
  }
})
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-6 space-y-6">
    <!-- Loading Skeleton -->
    <div v-if="!isLoaded" class="space-y-4" aria-busy="true" aria-label="Loading scales...">
      <div class="flex justify-between">
        <NordSkeleton height="1.5rem" width="150px" />
        <NordSkeleton height="2.5rem" width="100px" />
      </div>
      <div class="space-y-2">
        <NordSkeleton height="0.875rem" width="100px" />
        <div class="flex flex-wrap gap-1">
          <NordSkeleton v-for="i in 12" :key="i" variant="circle" width="40px" height="40px" />
        </div>
      </div>
      <div class="space-y-2">
        <NordSkeleton height="0.875rem" width="100px" />
        <NordSkeleton height="2.5rem" width="100%" />
      </div>
    </div>

    <!-- Loaded Content -->
    <template v-else>
      <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-text">Scale Explorer</h2>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200"
        :class="isPlaying
          ? 'bg-surface-alt text-text-muted cursor-not-allowed'
          : 'bg-primary text-on-primary hover:brightness-110'"
        :disabled="isPlaying || !selectedScale"
        @click="playScale"
      >
        <svg v-if="isPlaying" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        {{ isPlaying ? 'Playing...' : 'Play Scale' }}
      </button>
    </div>

    <!-- Root Note Selector -->
    <div>
      <label class="block text-sm font-medium text-text-muted mb-2">Root Note</label>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="note in noteNames"
          :key="note"
          class="w-10 h-10 rounded-md text-sm font-medium transition-all duration-150"
          :class="selectedRoot === note
            ? 'bg-primary text-on-primary'
            : 'bg-surface-alt text-text hover:bg-border'"
          @click="selectRoot(note)"
        >
          {{ note }}
        </button>
      </div>
    </div>

    <!-- Scale Type Selector -->
    <div>
      <label class="block text-sm font-medium text-text-muted mb-2">Scale Type</label>
      <select
        class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        :value="selectedScale?.id"
        @change="(e) => {
          const target = e.target as HTMLSelectElement
          const scale = theoryStore.scales.find((s) => s.id === target.value)
          if (scale) selectScale(scale)
        }"
      >
        <template v-for="category in sortedCategories" :key="category">
          <optgroup :label="category.charAt(0).toUpperCase() + category.slice(1)" class="bg-surface text-text">
            <option
              v-for="scale in groupedScales[category]"
              :key="scale.id"
              :value="scale.id"
              class="bg-surface-alt"
            >
              {{ scale.name }}
            </option>
          </optgroup>
        </template>
      </select>
    </div>

    <!-- Scale Display -->
    <div v-if="selectedScale" class="space-y-4">
      <div class="bg-surface rounded-lg p-4 border border-border">
        <h3 class="text-lg font-semibold text-primary mb-1">
          {{ selectedRoot }} {{ selectedScale.name }}
        </h3>
        <p class="text-text-muted text-sm mb-3">{{ selectedScale.description }}</p>

        <!-- Formula -->
        <div class="mb-4">
          <span class="text-sm text-text-muted">Notes: </span>
          <span class="text-text font-mono text-lg tracking-wider">{{ scaleFormula }}</span>
        </div>

        <!-- Scale Degrees -->
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          <div
            v-for="deg in scaleDegrees"
            :key="deg.degree"
            class="bg-surface-alt rounded-md p-2 text-center"
          >
            <div class="text-primary font-bold text-lg">{{ deg.note }}</div>
            <div class="text-text-muted text-xs">{{ deg.name }}</div>
            <div class="text-border text-xs">{{ deg.interval === 1 ? '1st' : deg.interval === 2 ? '2nd' : deg.interval === 3 ? '3rd' : `${deg.interval}th` }}</div>
          </div>
        </div>
      </div>

      <!-- Intervals Bar -->
      <div>
        <label class="block text-sm font-medium text-text-muted mb-2">Intervals (semitones)</label>
        <div class="flex gap-1">
          <div
            v-for="(deg, i) in scaleDegrees"
            :key="i"
            class="flex-1 bg-surface-alt rounded text-center py-1.5"
          >
            <span class="text-primary text-xs font-mono">{{ deg.interval }}</span>
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>