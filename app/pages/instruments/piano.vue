<script setup lang="ts">
const theoryStore = useTheoryStore()
const { getNoteNames, getScaleNotes, getChordNotes } = useMusicTheory()

const noteNames = getNoteNames()
const selectedRoot = ref('C')
const startOctave = ref(3)
const octaveCount = ref(3)
const mode = ref<'scale' | 'chord'>('scale')
const selectedScaleId = ref('')
const selectedChordId = ref('')
const lastClickedNote = ref('')

const highlightedNotes = computed(() => {
  if (mode.value === 'scale' && selectedScaleId.value) {
    const scale = theoryStore.scales.find((s: any) => s.id === selectedScaleId.value)
    if (scale) return getScaleNotes(selectedRoot.value, scale.intervals)
  }
  if (mode.value === 'chord' && selectedChordId.value) {
    const chord = theoryStore.chords.find((c: any) => c.id === selectedChordId.value)
    if (chord) return getChordNotes(selectedRoot.value, chord.intervals.map((i: number) => i % 12))
  }
  return []
})

function handleNoteClick(payload: { note: string; octave: number; midi: number }) {
  lastClickedNote.value = `${payload.note}${payload.octave}`
}

onMounted(async () => {
  if (!theoryStore.scales.length) await theoryStore.fetchScales()
  if (!theoryStore.chords.length) await theoryStore.fetchChords()
  if (theoryStore.scales.length) selectedScaleId.value = (theoryStore.scales[0] as any).id
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-text">Piano</h1>
      <NuxtLink to="/practice/session?instrument=piano">
        <NordButton variant="primary" size="sm">Practice Piano</NordButton>
      </NuxtLink>
    </div>

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

        <!-- Octave Range -->
        <div>
          <label class="block text-sm text-text-muted mb-1">Start Octave</label>
          <select
            v-model.number="startOctave"
            class="bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="o in 6" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Octaves</label>
          <select
            v-model.number="octaveCount"
            class="bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="o in 5" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>

        <!-- Mode Toggle -->
        <div>
          <label class="block text-sm text-text-muted mb-1">Mode</label>
          <div class="flex">
            <button
              class="px-3 py-2 text-sm font-medium rounded-l-md border border-border transition-colors"
              :class="mode === 'scale' ? 'bg-primary text-nord0' : 'bg-surface-alt text-text'"
              @click="mode = 'scale'"
            >
              Scale
            </button>
            <button
              class="px-3 py-2 text-sm font-medium rounded-r-md border border-l-0 border-border transition-colors"
              :class="mode === 'chord' ? 'bg-primary text-nord0' : 'bg-surface-alt text-text'"
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
            <option v-for="scale in theoryStore.scales" :key="(scale as any).id" :value="(scale as any).id">
              {{ (scale as any).name }}
            </option>
          </select>
          <select
            v-else
            v-model="selectedChordId"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None</option>
            <option v-for="chord in theoryStore.chords" :key="(chord as any).id" :value="(chord as any).id">
              {{ (chord as any).name }}
            </option>
          </select>
        </div>
      </div>
    </NordCard>

    <!-- Keyboard -->
    <NordCard class="mb-6">
      <PianoKeyboard
        :start-octave="startOctave"
        :octaves="octaveCount"
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
  </div>
</template>
