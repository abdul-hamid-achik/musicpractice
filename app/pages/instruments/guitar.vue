<script setup lang="ts">
import { GUITAR_TUNINGS, type TuningPreset } from '#shared/constants/tunings'
import type { Scale, Chord } from '#shared/types/music-theory'

const theoryStore = useTheoryStore()
const { getNoteNames, getScaleNotes, getChordNotes } = useMusicTheory()

const noteNames = getNoteNames()
const selectedRoot = ref('C')
const mode = ref<'scale' | 'chord'>('scale')
const selectedScaleId = ref('')
const selectedChordId = ref('')
const lastClickedNote = ref('')

// Track loading state
const isTheoryLoading = computed(() => !theoryStore.scales.length || !theoryStore.chords.length)

// Tuning
const selectedTuningIndex = ref(0)
const customTuning = ref<string[] | null>(null)

const activeTuning = computed(() => {
  if (customTuning.value) return customTuning.value
  return [...GUITAR_TUNINGS[selectedTuningIndex.value]!.notes]
})

const tuningLabel = computed(() => {
  return activeTuning.value.map(n => n.replace(/\d+$/, '')).join('-')
})

const tuningsByCategory = computed(() => {
  const categories: Record<string, TuningPreset[]> = {}
  for (const t of GUITAR_TUNINGS) {
    if (!categories[t.category]) categories[t.category] = []
    categories[t.category]!.push(t)
  }
  return categories
})

const categoryLabels: Record<string, string> = {
  standard: 'Standard',
  alternate: 'Alternate Standard',
  drop: 'Drop Tunings',
  open: 'Open Tunings',
  special: 'Special / Modal',
}

function selectTuning(index: number) {
  selectedTuningIndex.value = index
  customTuning.value = null
}

const highlightedNotes = computed(() => {
  if (mode.value === 'scale' && selectedScaleId.value) {
    const scale = theoryStore.scales.find((s: Scale) => s.id === selectedScaleId.value)
    if (scale) return getScaleNotes(selectedRoot.value, scale.intervals)
  }
  if (mode.value === 'chord' && selectedChordId.value) {
    const chord = theoryStore.chords.find((c: Chord) => c.id === selectedChordId.value)
    if (chord) return getChordNotes(selectedRoot.value, chord.intervals.map((i: number) => i % 12))
  }
  return []
})

function handleNoteClick(payload: { string: number; fret: number; note: string; octave: number }) {
  lastClickedNote.value = `${payload.note}${payload.octave}`
}

function clearSelection() {
  selectedScaleId.value = ''
  selectedChordId.value = ''
}

onMounted(async () => {
  if (!theoryStore.scales.length) await theoryStore.fetchScales()
  if (!theoryStore.chords.length) await theoryStore.fetchChords()
  if (theoryStore.scales.length) selectedScaleId.value = theoryStore.scales[0]!.id
})
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm text-text-muted mb-4">
      <NuxtLink to="/instruments" class="hover:text-primary transition-colors">Instruments</NuxtLink>
      <span>/</span>
      <span class="text-text">Guitar</span>
    </nav>

    <div class="flex items-center justify-between mb-2">
      <h1 class="text-3xl font-bold text-text">Guitar</h1>
      <NuxtLink to="/practice/session?instrument=guitar">
        <NordButton variant="primary" size="sm">Practice Guitar</NordButton>
      </NuxtLink>
    </div>
    <p class="text-text-muted mb-6">Interactive 6-string fretboard — visualize scales, chords, and fingering patterns.</p>

    <!-- Loading State for Fretboard and Controls -->
    <div v-if="isTheoryLoading" class="space-y-4" aria-busy="true" aria-label="Loading fretboard...">
      <!-- Skeleton for Tuning Selector -->
      <SkeletonCard variant="card" height="60px" />

      <!-- Skeleton for Controls -->
      <SkeletonCard variant="card" height="100px" />

      <!-- Skeleton for Fretboard -->
      <SkeletonCard variant="card" height="200px" />
    </div>

    <!-- Loaded Content -->
    <template v-else>
      <!-- Tuning Selector -->
      <NordCard class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M9 5l6-2M9 9l6-2" /><circle cx="12" cy="19" r="3" />
          </svg>
          <span class="text-sm font-medium text-text">Tuning:</span>
        </div>
        <select
          :value="selectedTuningIndex"
          class="bg-surface-alt text-text border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          @change="selectTuning(Number(($event.target as HTMLSelectElement).value))"
        >
          <template v-for="(tunings, category) in tuningsByCategory" :key="category">
            <optgroup :label="categoryLabels[category] || category">
              <option
                v-for="t in tunings"
                :key="t.name"
                :value="GUITAR_TUNINGS.indexOf(t)"
              >
                {{ t.name }} ({{ t.notes.map(n => n.replace(/\d+$/, '')).join('-') }})
              </option>
            </optgroup>
          </template>
        </select>
        <span class="text-xs text-text-muted font-mono bg-surface-alt px-2 py-1 rounded">
          {{ tuningLabel }}
        </span>
      </div>
    </NordCard>

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

        <!-- Mode Toggle -->
        <div>
          <label class="block text-sm text-text-muted mb-1">Mode</label>
          <div class="flex">
            <button
              class="px-3 py-2 text-sm font-medium rounded-l-md border border-border transition-colors"
              :class="mode === 'scale' ? 'bg-primary text-on-primary' : 'bg-surface-alt text-text'"
              @click="mode = 'scale'"
            >
              Scale
            </button>
            <button
              class="px-3 py-2 text-sm font-medium rounded-r-md border border-l-0 border-border transition-colors"
              :class="mode === 'chord' ? 'bg-primary text-on-primary' : 'bg-surface-alt text-text'"
              @click="mode = 'chord'"
            >
              Chord
            </button>
          </div>
        </div>

        <!-- Scale/Chord Selector -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm text-text-muted mb-1">
            {{ mode === 'scale' ? 'Scale' : 'Chord' }}
          </label>
          <select
            v-if="mode === 'scale'"
            v-model="selectedScaleId"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None</option>
            <option v-for="scale in theoryStore.scales" :key="scale.id" :value="scale.id">
              {{ scale.name }}
            </option>
          </select>
          <select
            v-else
            v-model="selectedChordId"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None</option>
            <option v-for="chord in theoryStore.chords" :key="chord.id" :value="chord.id">
              {{ chord.name }}
            </option>
          </select>
        </div>

        <!-- Clear -->
        <NordButton variant="ghost" size="sm" @click="clearSelection">Clear</NordButton>
      </div>
    </NordCard>

    <!-- Fretboard -->
    <NordCard class="mb-6">
      <GuitarFretboard
        :tuning="activeTuning"
        :highlighted-notes="highlightedNotes"
        :root-note="selectedRoot"
        @note-click="handleNoteClick"
      />
    </NordCard>

    <!-- Note Display -->
    <NordCard v-if="lastClickedNote" title="Last Played">
      <div class="text-center">
        <span class="text-2xl font-bold text-primary">{{ lastClickedNote }}</span>
      </div>
    </NordCard>
    </template>

  </div>
</template>
