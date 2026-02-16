<script setup lang="ts">
const { transposeNote } = useMusicTheory()

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
  noteClick: [payload: { note: string; string: number; finger: number }]
}>()

const openStrings = ['G3', 'D4', 'A4', 'E5']
const stringLabels = ['G', 'D', 'A', 'E']

const svgWidth = 220
const svgHeight = 350
const stringSpacing = 36
const fingerSpacing = 55
const topPadding = 50
const leftPadding = 50

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

function handleClick(string: number, finger: number, note: string) {
  emit('noteClick', { note, string, finger })
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    class="w-full max-w-xs h-auto select-none mx-auto"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Violin fingerboard diagram"
  >
    <!-- Position label -->
    <text
      :x="svgWidth / 2"
      y="20"
      text-anchor="middle"
      font-size="14"
      font-weight="bold"
      fill="#ECEFF4"
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
      stroke="#D8DEE9"
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
      fill="#D8DEE9"
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
      stroke="#4C566A"
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
      fill="#4C566A"
    >
      {{ f }}
    </text>

    <!-- Note positions -->
    <template v-for="(stringPositions, s) in fingerPositions" :key="`string-notes-${s}`">
      <g
        v-for="fp in stringPositions"
        :key="`fp-${s}-${fp.finger}`"
        class="cursor-pointer"
        @click="handleClick(fp.string, fp.finger, fp.note)"
      >
        <circle
          :cx="fp.x"
          :cy="fp.y"
          :r="fp.finger === 0 ? 10 : 12"
          :fill="
            isRoot(fp.note)
              ? '#88C0D0'
              : isHighlighted(fp.note)
                ? '#81A1C1'
                : 'transparent'
          "
          :stroke="isHighlighted(fp.note) || isRoot(fp.note) ? 'none' : '#4C566A'"
          :stroke-width="isHighlighted(fp.note) || isRoot(fp.note) ? 0 : 1"
          class="hover-circle"
        />
        <text
          :x="fp.x"
          :y="fp.y + 4"
          text-anchor="middle"
          font-size="10"
          font-weight="bold"
          :fill="
            isRoot(fp.note) || isHighlighted(fp.note) ? '#2E3440' : '#D8DEE9'
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
  fill: #4c566a;
}
.hover-text {
  opacity: 0.5;
  transition: opacity 0.15s;
}
g:hover .hover-text {
  opacity: 1;
}
</style>
