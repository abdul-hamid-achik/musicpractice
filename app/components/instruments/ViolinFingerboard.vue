<script setup lang="ts">
const { transposeNote, noteToMidi, midiToNote } = useMusicTheory()
const { playNote } = useInstrumentSound()

const props = withDefaults(
  defineProps<{
    position?: number
    highlightedNotes?: string[]
    rootNote?: string
  }>(),
  {
    position: 1,
    highlightedNotes: () => [],
    rootNote: '',
  },
)

const emit = defineEmits<{
  noteClick: [payload: { note: string; string: number; finger: number; octave: number }]
}>()

const openStrings = ['G3', 'D4', 'A4', 'E5']
const stringLabels = ['G', 'D', 'A', 'E']

const svgWidth = 220
const svgHeight = 350
const stringSpacing = 36
const fingerSpacing = 55
const topPadding = 50
const leftPadding = 50

// Keyboard navigation state
const focusedPosition = ref<{ string: number; finger: number } | null>(null)
const fingerboardRef = ref<SVGSVGElement | null>(null)

function parseNote(noteWithOctave: string): { note: string; octave: number } {
  const match = noteWithOctave.match(/^([A-G][#b]?)(\d+)$/)
  if (!match) return { note: 'C', octave: 4 }
  return { note: match[1]!, octave: parseInt(match[2]!) }
}

const fingerPositions = computed(() => {
  const positions: {
    string: number
    finger: number
    note: string
    x: number
    y: number
    label: string
  }[][] = []

  const positionOffset = (props.position - 1) * 2

  for (let s = 0; s < openStrings.length; s++) {
    const stringPositions: (typeof positions)[number] = []
    const open = parseNote(openStrings[s]!)
    const x = leftPadding + s * stringSpacing

    // Open string (finger 0)
    stringPositions.push({
      string: s,
      finger: 0,
      note: transposeNote(open.note, 0),
      x,
      y: topPadding - 10,
      label: transposeNote(open.note, 0),
    })

    // Fingers 1-4
    for (let f = 1; f <= 4; f++) {
      const semitones = positionOffset + f
      const note = transposeNote(open.note, semitones)
      stringPositions.push({
        string: s,
        finger: f,
        note,
        x,
        y: topPadding + f * fingerSpacing,
        label: note,
      })
    }

    positions.push(stringPositions)
  }
  return positions
})

function isHighlighted(note: string): boolean {
  return props.highlightedNotes.includes(note)
}

function isRoot(note: string): boolean {
  return props.rootNote === note
}

function getActualOctave(stringIndex: number, finger: number): number {
  const open = parseNote(openStrings[stringIndex]!)
  const openMidi = noteToMidi(open.note, open.octave)
  const semitones = finger === 0 ? 0 : (props.position - 1) * 2 + finger
  return midiToNote(openMidi + semitones).octave
}

function handleClick(string: number, finger: number, note: string) {
  const octave = getActualOctave(string, finger)
  playNote(note, octave, 'violin')
  emit('noteClick', { note, string, finger, octave })
}

// Keyboard navigation handlers
function handleKeydown(event: KeyboardEvent) {
  if (!focusedPosition.value) {
    focusedPosition.value = { string: 0, finger: 0 }
    return
  }

  const { string, finger } = focusedPosition.value
  let newString = string
  let newFinger = finger

  switch (event.key) {
    case 'ArrowRight':
      newString = Math.min(string + 1, openStrings.length - 1)
      break
    case 'ArrowLeft':
      newString = Math.max(string - 1, 0)
      break
    case 'ArrowDown':
      newFinger = Math.min(finger + 1, 4)
      break
    case 'ArrowUp':
      newFinger = Math.max(finger - 1, 0)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      const note = fingerPositions.value[string]?.find((fp: { finger: number }) => fp.finger === finger)?.note
      if (note) {
        handleClick(string, finger, note)
      }
      return
    default:
      return
  }

  event.preventDefault()
  focusedPosition.value = { string: newString, finger: newFinger }
}

function isFocused(string: number, finger: number): boolean {
  return focusedPosition.value?.string === string && focusedPosition.value?.finger === finger
}

function getPositionLabel(string: number, finger: number): string {
  const fp = fingerPositions.value[string]?.find((p: { finger: number }) => p.finger === finger)
  if (!fp) return ''
  const octave = getActualOctave(string, finger)
  const stringName = stringLabels[string]
  const fingerLabel = finger === 0 ? 'open' : `finger ${finger}`
  return `${fp.note}${octave} - ${stringName} string, ${fingerLabel}`
}
</script>

<template>
  <svg
    ref="fingerboardRef"
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    class="w-full max-w-xs h-auto select-none mx-auto"
    xmlns="http://www.w3.org/2000/svg"
    role="application"
    aria-label="Violin fingerboard diagram. Use arrow keys to navigate between notes, Enter or Space to play."
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- Position label -->
    <text
      :x="svgWidth / 2"
      y="20"
      text-anchor="middle"
      font-size="14"
      font-weight="bold"
      style="fill: var(--color-nord6)"
    >
      Position {{ position }}
    </text>

    <!-- Strings (vertical) -->
    <line
      v-for="s in 4"
      :key="`string-${s}`"
      :x1="leftPadding + (s - 1) * stringSpacing"
      :y1="topPadding - 15"
      :x2="leftPadding + (s - 1) * stringSpacing"
      :y2="topPadding + 4.5 * fingerSpacing"
      style="stroke: var(--color-nord4)"
      :stroke-width="2.4 - (s - 1) * 0.4"
    />

    <!-- String labels -->
    <text
      v-for="(label, s) in stringLabels"
      :key="`label-${s}`"
      :x="leftPadding + s * stringSpacing"
      :y="topPadding + 5 * fingerSpacing"
      text-anchor="middle"
      font-size="12"
      style="fill: var(--color-nord4)"
    >
      {{ label }}
    </text>

    <!-- Finger position lines -->
    <line
      v-for="f in 4"
      :key="`fret-${f}`"
      :x1="leftPadding - 15"
      :y1="topPadding + f * fingerSpacing"
      :x2="leftPadding + 3 * stringSpacing + 15"
      :y2="topPadding + f * fingerSpacing"
      style="stroke: var(--color-nord3)"
      stroke-width="1"
      stroke-dasharray="4,3"
    />

    <!-- Finger numbers -->
    <text
      v-for="f in 4"
      :key="`finger-num-${f}`"
      :x="leftPadding - 25"
      :y="topPadding + f * fingerSpacing + 4"
      text-anchor="middle"
      font-size="11"
      style="fill: var(--color-nord3)"
    >
      {{ f }}
    </text>

    <!-- Note positions -->
    <template v-for="(stringPositions, s) in fingerPositions" :key="`string-notes-${s}`">
      <g
        v-for="fp in stringPositions"
        :key="`fp-${s}-${fp.finger}`"
        class="cursor-pointer"
        role="button"
        :aria-label="getPositionLabel(fp.string, fp.finger)"
        :aria-pressed="isHighlighted(fp.note) || isRoot(fp.note)"
        :tabindex="isFocused(fp.string, fp.finger) ? 0 : -1"
        @click="handleClick(fp.string, fp.finger, fp.note)"
        @focus="focusedPosition = { string: fp.string, finger: fp.finger }"
      >
        <circle
          :cx="fp.x"
          :cy="fp.y"
          :r="fp.finger === 0 ? 10 : 12"
          :fill="
            isRoot(fp.note)
              ? 'var(--color-primary)'
              : isHighlighted(fp.note)
                ? 'var(--color-secondary)'
                : 'transparent'
          "
          :stroke="isHighlighted(fp.note) || isRoot(fp.note) ? 'none' : 'var(--color-nord3)'"
          :stroke-width="isHighlighted(fp.note) || isRoot(fp.note) ? 0 : 1"
          class="hover-circle"
        />
        <!-- Focus indicator -->
        <circle
          v-if="isFocused(fp.string, fp.finger)"
          :cx="fp.x"
          :cy="fp.y"
          :r="fp.finger === 0 ? 14 : 16"
          fill="none"
          stroke="var(--color-primary)"
          stroke-width="2"
          stroke-dasharray="4,2"
          class="focus-indicator"
        />
        <text
          :x="fp.x"
          :y="fp.y + 4"
          text-anchor="middle"
          font-size="10"
          font-weight="bold"
          :fill="
            isRoot(fp.note) || isHighlighted(fp.note) ? 'var(--color-on-highlight)' : 'var(--color-note-label)'
          "
          :class="{ 'hover-text': !isHighlighted(fp.note) && !isRoot(fp.note) }"
        >
          {{ fp.label }}
        </text>
      </g>
    </template>
  </svg>
</template>

<style scoped>
.hover-circle {
  transition: fill 0.15s;
}
g:hover .hover-circle {
  fill: var(--color-nord3);
}
.hover-text {
  opacity: 0.5;
  transition: opacity 0.15s;
}
g:hover .hover-text {
  opacity: 1;
}

/* Focus indicator animation */
.focus-indicator {
  animation: focus-pulse 1.5s ease-in-out infinite;
}

@keyframes focus-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Ensure focused elements are visible */
g[tabindex="0"]:focus {
  outline: none;
}
</style>
