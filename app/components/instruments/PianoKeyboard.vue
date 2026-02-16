<script setup lang="ts">
const { noteToMidi } = useMusicTheory()

const props = withDefaults(
  defineProps<{
    startOctave?: number
    octaves?: number
    highlightedNotes?: string[]
    rootNote?: string
  }>(),
  {
    startOctave: 3,
    octaves: 2,
    highlightedNotes: () => [],
    rootNote: '',
  },
)

const emit = defineEmits<{
  noteClick: [payload: { note: string; octave: number; midi: number }]
}>()

const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const blackNotes = ['C#', 'D#', '', 'F#', 'G#', 'A#', ''] as const
const blackKeyOffsets: Record<string, number> = {
  'C#': 0.65,
  'D#': 1.75,
  'F#': 3.7,
  'G#': 4.75,
  'A#': 5.8,
}

const whiteKeyWidth = 36
const whiteKeyHeight = 140
const blackKeyWidth = 22
const blackKeyHeight = 90

const totalWhiteKeys = computed(() => props.octaves * 7)
const svgWidth = computed(() => totalWhiteKeys.value * whiteKeyWidth + 2)
const svgHeight = whiteKeyHeight + 10

interface KeyData {
  note: string
  octave: number
  midi: number
  x: number
  y: number
  w: number
  h: number
  isBlack: boolean
}

const whiteKeys = computed<KeyData[]>(() => {
  const keys: KeyData[] = []
  for (let o = 0; o < props.octaves; o++) {
    const octave = props.startOctave + o
    for (let i = 0; i < whiteNotes.length; i++) {
      const note = whiteNotes[i]
      const keyIndex = o * 7 + i
      keys.push({
        note,
        octave,
        midi: noteToMidi(note, octave),
        x: keyIndex * whiteKeyWidth + 1,
        y: 1,
        w: whiteKeyWidth - 1,
        h: whiteKeyHeight,
        isBlack: false,
      })
    }
  }
  return keys
})

const blackKeys = computed<KeyData[]>(() => {
  const keys: KeyData[] = []
  for (let o = 0; o < props.octaves; o++) {
    const octave = props.startOctave + o
    for (const [note, offset] of Object.entries(blackKeyOffsets)) {
      const x = (o * 7 + offset) * whiteKeyWidth - blackKeyWidth / 2 + whiteKeyWidth / 2
      keys.push({
        note,
        octave,
        midi: noteToMidi(note, octave),
        x,
        y: 1,
        w: blackKeyWidth,
        h: blackKeyHeight,
        isBlack: true,
      })
    }
  }
  return keys
})

function isHighlighted(note: string): boolean {
  return props.highlightedNotes.includes(note)
}

function isRoot(note: string): boolean {
  return props.rootNote === note
}

function getWhiteKeyFill(note: string): string {
  if (isRoot(note)) return '#88C0D0'
  if (isHighlighted(note)) return '#81A1C1'
  return '#ECEFF4'
}

function getBlackKeyFill(note: string): string {
  if (isRoot(note)) return '#88C0D0'
  if (isHighlighted(note)) return '#81A1C1'
  return '#2E3440'
}

function getTextFill(note: string, isBlack: boolean): string {
  if (isRoot(note) || isHighlighted(note)) return '#2E3440'
  return isBlack ? '#D8DEE9' : '#4C566A'
}

function handleClick(key: KeyData) {
  emit('noteClick', { note: key.note, octave: key.octave, midi: key.midi })
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    class="w-full h-auto select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- White keys -->
    <g
      v-for="key in whiteKeys"
      :key="`white-${key.note}-${key.octave}`"
      class="cursor-pointer"
      @click="handleClick(key)"
    >
      <rect
        :x="key.x"
        :y="key.y"
        :width="key.w"
        :height="key.h"
        :fill="getWhiteKeyFill(key.note)"
        stroke="#4C566A"
        stroke-width="1"
        rx="0"
        ry="0"
        class="white-key"
      />
      <text
        :x="key.x + key.w / 2"
        :y="key.y + key.h - 10"
        text-anchor="middle"
        :font-size="10"
        :fill="getTextFill(key.note, false)"
      >
        {{ key.note }}{{ key.octave }}
      </text>
    </g>

    <!-- Black keys (on top) -->
    <g
      v-for="key in blackKeys"
      :key="`black-${key.note}-${key.octave}`"
      class="cursor-pointer"
      @click="handleClick(key)"
    >
      <rect
        :x="key.x"
        :y="key.y"
        :width="key.w"
        :height="key.h"
        :fill="getBlackKeyFill(key.note)"
        stroke="#3B4252"
        stroke-width="1"
        rx="0"
        ry="0"
        class="black-key"
      />
    </g>
  </svg>
</template>

<style scoped>
.white-key {
  transition: fill 0.1s;
}
.white-key:hover {
  filter: brightness(0.92);
}
.black-key {
  transition: fill 0.1s;
}
.black-key:hover {
  filter: brightness(1.3);
}
</style>
