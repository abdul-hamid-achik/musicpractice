<script setup lang="ts">
const { transposeNote, noteToMidi, midiToNote } = useMusicTheory()
const { playNote } = useInstrumentSound()

const props = withDefaults(
  defineProps<{
    tuning?: string[]
    frets?: number
    highlightedNotes?: string[]
    rootNote?: string
    instrument?: 'guitar' | 'bass'
  }>(),
  {
    tuning: () => ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    frets: 24,
    highlightedNotes: () => [],
    rootNote: '',
    instrument: 'guitar',
  },
)

const emit = defineEmits<{
  noteClick: [payload: { string: number; fret: number; note: string; octave: number }]
}>()

const fretMarkers = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
const doubleFretMarkers = [12, 24]

const stringThickness = [2.5, 2.1, 1.7, 1.3, 1.0, 0.8]

const fretboardWidth = 1200
const fretboardHeight = 180
const nutX = 50
const fretSpacing = (fretboardWidth - nutX) / 24
const stringSpacing = 28
const topPadding = 30

function parseNote(noteWithOctave: string): { note: string; octave: number } {
  const match = noteWithOctave.match(/^([A-G][#b]?)(\d+)$/)
  if (!match) return { note: 'C', octave: 3 }
  return { note: match[1]!, octave: parseInt(match[2]!) }
}

const fretboardNotes = computed(() => {
  const notes: { string: number; fret: number; note: string; x: number; y: number }[][] = []
  for (let s = 0; s < props.tuning.length; s++) {
    const stringNotes: typeof notes[0] = []
    const open = parseNote(props.tuning[s]!)
    for (let f = 0; f <= props.frets; f++) {
      const note = transposeNote(open.note, f)
      const x = f === 0 ? nutX / 2 : nutX + (f - 0.5) * fretSpacing
      const y = topPadding + s * stringSpacing
      stringNotes.push({ string: s, fret: f, note, x, y })
    }
    notes.push(stringNotes)
  }
  return notes
})

function isHighlighted(note: string): boolean {
  return props.highlightedNotes.includes(note)
}

function isRoot(note: string): boolean {
  return props.rootNote === note
}

function fretX(fret: number): number {
  return nutX + fret * fretSpacing
}

function markerY(marker: number): number {
  const totalStringHeight = (props.tuning.length - 1) * stringSpacing
  return topPadding + totalStringHeight / 2
}

function getActualOctave(stringIndex: number, fret: number): number {
  const open = parseNote(props.tuning[stringIndex]!)
  const openMidi = noteToMidi(open.note, open.octave)
  const frettedMidi = openMidi + fret
  return midiToNote(frettedMidi).octave
}

function handleNoteClick(string: number, fret: number, note: string) {
  const octave = getActualOctave(string, fret)
  playNote(note, octave, props.instrument)
  emit('noteClick', { string, fret, note, octave })
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${fretboardWidth} ${fretboardHeight + 20}`"
    class="w-full h-auto select-none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Guitar fretboard diagram"
  >
    <!-- Nut -->
    <line
      :x1="nutX"
      :y1="topPadding - 8"
      :x2="nutX"
      :y2="topPadding + (tuning.length - 1) * stringSpacing + 8"
      style="stroke: var(--color-nord6)"
      stroke-width="5"
    />

    <!-- Fret lines -->
    <line
      v-for="f in frets"
      :key="`fret-${f}`"
      :x1="fretX(f)"
      :y1="topPadding - 6"
      :x2="fretX(f)"
      :y2="topPadding + (tuning.length - 1) * stringSpacing + 6"
      style="stroke: var(--color-nord3)"
      stroke-width="2"
    />

    <!-- Fret markers -->
    <template v-for="marker in fretMarkers" :key="`marker-${marker}`">
      <template v-if="marker <= frets">
        <template v-if="doubleFretMarkers.includes(marker)">
          <circle
            :cx="fretX(marker) - fretSpacing / 2"
            :cy="markerY(marker) - 12"
            r="4"
            style="fill: var(--color-nord3)"
          />
          <circle
            :cx="fretX(marker) - fretSpacing / 2"
            :cy="markerY(marker) + 12"
            r="4"
            style="fill: var(--color-nord3)"
          />
        </template>
        <circle
          v-else
          :cx="fretX(marker) - fretSpacing / 2"
          :cy="markerY(marker)"
          r="4"
          fill="#4C566A"
        />
      </template>
    </template>

    <!-- Strings -->
    <line
      v-for="(_, s) in tuning"
      :key="`string-${s}`"
      :x1="nutX"
      :y1="topPadding + s * stringSpacing"
      :x2="fretboardWidth"
      :y2="topPadding + s * stringSpacing"
      style="stroke: var(--color-nord4)"
      :stroke-width="stringThickness[s] || 1"
    />

    <!-- Notes -->
    <template v-for="(stringNotes, s) in fretboardNotes" :key="`notes-${s}`">
      <g
        v-for="n in stringNotes"
        :key="`note-${s}-${n.fret}`"
        class="cursor-pointer"
        @click="handleNoteClick(n.string, n.fret, n.note)"
      >
        <!-- Highlighted note circle -->
        <circle
          v-if="isHighlighted(n.note)"
          :cx="n.x"
          :cy="n.y"
          r="10"
          :fill="isRoot(n.note) ? '#88C0D0' : '#81A1C1'"
        />
        <!-- Non-highlighted: small dot visible on hover -->
        <circle
          v-else
          :cx="n.x"
          :cy="n.y"
          r="4"
          fill="transparent"
          class="hover-dot"
        />

        <!-- Note label for highlighted -->
        <text
          v-if="isHighlighted(n.note)"
          :x="n.x"
          :y="n.y + 4"
          text-anchor="middle"
          :font-size="9"
          font-weight="bold"
          :fill="isRoot(n.note) ? '#2E3440' : '#ECEFF4'"
        >
          {{ n.note }}
        </text>
        <!-- Hover label for non-highlighted -->
        <text
          v-else
          :x="n.x"
          :y="n.y + 4"
          text-anchor="middle"
          :font-size="8"
          fill="#D8DEE9"
          class="hover-label"
        >
          {{ n.note }}
        </text>
      </g>
    </template>
  </svg>
</template>

<style scoped>
.hover-dot {
  transition: fill 0.15s;
}
g:hover .hover-dot {
  fill: var(--color-nord3);
}

@keyframes note-glow {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); filter: drop-shadow(0 0 3px rgba(136, 192, 208, 0.5)); }
  100% { transform: scale(1); filter: none; }
}

g:active circle {
  animation: note-glow 250ms ease-out;
}
.hover-label {
  opacity: 0;
  transition: opacity 0.15s;
}
g:hover .hover-label {
  opacity: 1;
}
</style>
