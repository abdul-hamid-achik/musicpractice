<script setup lang="ts">
import { useMusicTheory } from '~/composables/useMusicTheory'
import { useTheoryStore } from '~/stores/theory'
import type { Chord } from '#shared/types/music-theory'

const emit = defineEmits<{
  chordSelected: [payload: { root: string; chord: Chord; notes: string[] }]
}>()

const { getNoteNames, getChordNotes } = useMusicTheory()
const theoryStore = useTheoryStore()

const noteNames = getNoteNames()
const selectedRoot = ref('C')
const selectedChord = ref<Chord | null>(null)
const isPlaying = ref(false)
const viewMode = ref<'guitar' | 'piano'>('piano')

const INTERVAL_NAMES: Record<number, string> = {
  0: 'R', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
  6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7',
  12: 'P8', 14: 'M9', 17: 'm10', 21: 'M13',
}

const chordNotes = computed(() => {
  if (!selectedChord.value) return []
  return getChordNotes(selectedRoot.value, selectedChord.value.intervals.map((i) => i % 12))
})

const chordSymbol = computed(() => {
  if (!selectedChord.value) return ''
  return `${selectedRoot.value}${selectedChord.value.symbol}`
})

const chordIntervals = computed(() => {
  if (!selectedChord.value) return []
  return selectedChord.value.intervals.map((interval) => ({
    semitones: interval,
    name: INTERVAL_NAMES[interval] || `${interval}`,
  }))
})

// Piano key data: which keys to highlight
const pianoKeys = computed(() => {
  const whites = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const blacks = ['C#', 'D#', '', 'F#', 'G#', 'A#', '']
  const uniqueNotes = [...new Set(chordNotes.value)]
  return { whites, blacks, active: uniqueNotes }
})

// Guitar chord grid: basic positions
const guitarGrid = computed(() => {
  if (!selectedChord.value) return []
  // Simple open-position chord approximation
  const notes = new Set(chordNotes.value)
  const standardTuning = ['E', 'A', 'D', 'G', 'B', 'E']
  const allNotes: string[] = getNoteNames()
  const dots: { string: number; fret: number }[] = []

  for (let s = 0; s < 6; s++) {
    const openIdx = allNotes.indexOf(standardTuning[s]!)
    for (let f = 0; f <= 4; f++) {
      const noteAtFret = allNotes[(openIdx + f) % 12]!
      if (notes.has(noteAtFret)) {
        dots.push({ string: s, fret: f })
        break
      }
    }
  }
  return dots
})

function selectRoot(note: string) {
  selectedRoot.value = note
  theoryStore.setRoot(note)
  emitSelection()
}

function selectChord(chord: Chord) {
  selectedChord.value = chord
  theoryStore.setChord(chord)
  emitSelection()
}

function emitSelection() {
  if (selectedChord.value) {
    emit('chordSelected', {
      root: selectedRoot.value,
      chord: selectedChord.value,
      notes: chordNotes.value,
    })
  }
}

async function playChord() {
  if (isPlaying.value || !selectedChord.value) return
  isPlaying.value = true
  try {
    const Tone = await import('tone')
    await Tone.start()
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.8 },
    }).toDestination()

    const notes = chordNotes.value.map((n, i) => {
      const allNotes: string[] = getNoteNames()
      const rootIdx = allNotes.indexOf(selectedRoot.value)
      const noteIdx = allNotes.indexOf(n)
      const octave = noteIdx >= rootIdx ? 4 : 5
      return `${n}${octave}`
    })

    synth.triggerAttackRelease(notes, '2n')
    await new Promise((resolve) => setTimeout(resolve, 1500))
    synth.dispose()
  } catch {
    // Tone.js may not be available
  } finally {
    isPlaying.value = false
  }
}

onMounted(async () => {
  if (theoryStore.chords.length === 0) {
    await theoryStore.fetchChords()
  }
  if (theoryStore.chords.length > 0) {
    selectChord(theoryStore.chords[0]!)
  }
})
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-text">Chord Library</h2>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200"
        :class="isPlaying
          ? 'bg-surface-alt text-text-muted cursor-not-allowed'
          : 'bg-primary text-on-primary hover:brightness-110'"
        :disabled="isPlaying || !selectedChord"
        @click="playChord"
      >
        <svg v-if="isPlaying" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        {{ isPlaying ? 'Playing...' : 'Play Chord' }}
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

    <!-- Chord Type Selector -->
    <div>
      <label class="block text-sm font-medium text-text-muted mb-2">Chord Type</label>
      <select
        class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        :value="selectedChord?.id"
        @change="(e) => {
          const target = e.target as HTMLSelectElement
          const chord = theoryStore.chords.find((c) => c.id === target.value)
          if (chord) selectChord(chord)
        }"
      >
        <option
          v-for="chord in theoryStore.chords"
          :key="chord.id"
          :value="chord.id"
          class="bg-surface-alt"
        >
          {{ chord.name }} ({{ chord.symbol || 'maj' }})
        </option>
      </select>
    </div>

    <!-- Chord Display -->
    <div v-if="selectedChord" class="space-y-4">
      <div class="bg-surface rounded-lg p-4 border border-border">
        <h3 class="text-lg font-semibold text-primary mb-1">
          {{ selectedRoot }} {{ selectedChord.name }}
          <span class="text-text-muted font-normal text-base ml-2">({{ chordSymbol }})</span>
        </h3>

        <!-- Notes -->
        <div class="mb-3">
          <span class="text-sm text-text-muted">Notes: </span>
          <span class="text-text font-mono text-lg tracking-wider">{{ chordNotes.join(' ') }}</span>
        </div>

        <!-- Intervals -->
        <div class="flex gap-2 flex-wrap">
          <div
            v-for="(iv, i) in chordIntervals"
            :key="i"
            class="bg-surface-alt rounded-md px-3 py-1.5 text-center"
          >
            <div class="text-primary text-sm font-bold">{{ iv.name }}</div>
            <div class="text-text-muted text-xs">{{ iv.semitones }}st</div>
          </div>
        </div>
      </div>

      <!-- Diagram View Toggle -->
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          :class="viewMode === 'piano' ? 'bg-primary text-on-primary' : 'bg-surface-alt text-text-muted hover:bg-border'"
          @click="viewMode = 'piano'"
        >
          Piano
        </button>
        <button
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          :class="viewMode === 'guitar' ? 'bg-primary text-on-primary' : 'bg-surface-alt text-text-muted hover:bg-border'"
          @click="viewMode = 'guitar'"
        >
          Guitar
        </button>
      </div>

      <!-- Piano Diagram -->
      <div v-if="viewMode === 'piano'" class="bg-surface rounded-lg p-4 border border-border">
        <svg viewBox="0 0 350 120" class="w-full max-w-md">
          <!-- White keys -->
          <g v-for="(key, i) in pianoKeys.whites" :key="'w' + i">
            <rect
              :x="i * 50"
              y="0"
              width="48"
              height="110"
              rx="3"
              :fill="pianoKeys.active.includes(key) ? 'var(--color-primary)' : 'var(--color-key-white)'"
              style="stroke: var(--color-nord3)"
              stroke-width="1"
            />
            <text
              :x="i * 50 + 24"
              y="100"
              text-anchor="middle"
              :fill="pianoKeys.active.includes(key) ? 'var(--color-on-highlight)' : 'var(--color-note-text)'"
              font-size="12"
              font-weight="bold"
            >
              {{ key }}
            </text>
          </g>
          <!-- Black keys -->
          <g v-for="(key, i) in pianoKeys.blacks" :key="'b' + i">
            <rect
              v-if="key"
              :x="i * 50 + 32"
              y="0"
              width="32"
              height="68"
              rx="3"
              :fill="pianoKeys.active.includes(key) ? 'var(--color-nord10)' : 'var(--color-key-black)'"
              style="stroke: var(--color-nord1)"
              stroke-width="1"
            />
            <text
              v-if="key && pianoKeys.active.includes(key)"
              :x="i * 50 + 48"
              y="58"
              text-anchor="middle"
              fill="var(--color-note-text-inv)"
              font-size="9"
              font-weight="bold"
            >
              {{ key }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Guitar Diagram -->
      <div v-if="viewMode === 'guitar'" class="bg-surface rounded-lg p-4 border border-border">
        <svg viewBox="0 0 200 160" class="w-full max-w-xs mx-auto">
          <!-- Nut -->
          <rect x="28" y="18" width="144" height="4" style="fill: var(--color-nord6)" rx="1" />
          <!-- Fret lines -->
          <line
            v-for="f in 4"
            :key="'fret' + f"
            x1="28"
            :y1="20 + f * 32"
            x2="172"
            :y2="20 + f * 32"
            style="stroke: var(--color-nord3)"
            stroke-width="1.5"
          />
          <!-- String lines -->
          <line
            v-for="s in 6"
            :key="'str' + s"
            :x1="28 + (s - 1) * 28.8"
            y1="18"
            :x2="28 + (s - 1) * 28.8"
            y2="148"
            style="stroke: var(--color-nord4)"
            :stroke-width="s <= 3 ? 1 : 1.5"
          />
          <!-- String labels -->
          <text
            v-for="(label, s) in ['E', 'A', 'D', 'G', 'B', 'E']"
            :key="'label' + s"
            :x="28 + s * 28.8"
            y="12"
            text-anchor="middle"
            style="fill: var(--color-nord4)"
            font-size="10"
          >
            {{ label }}
          </text>
          <!-- Dots -->
          <circle
            v-for="(dot, i) in guitarGrid"
            :key="'dot' + i"
            :cx="28 + dot.string * 28.8"
            :cy="dot.fret === 0 ? 14 : 20 + (dot.fret - 1) * 32 + 16"
            :r="dot.fret === 0 ? 5 : 8"
            :fill="dot.fret === 0 ? 'none' : 'var(--color-primary)'"
            :stroke="dot.fret === 0 ? 'var(--color-primary)' : 'none'"
            :stroke-width="dot.fret === 0 ? 2 : 0"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
