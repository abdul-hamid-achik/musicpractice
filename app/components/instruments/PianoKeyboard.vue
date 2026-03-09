<script setup lang="ts">
const { noteToMidi } = useMusicTheory()
const { playNote } = useInstrumentSound()

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
  index: number
}

const whiteKeys = computed<KeyData[]>(() => {
  const keys: KeyData[] = []
  let globalIndex = 0
  for (let o = 0; o < props.octaves; o++) {
    const octave = props.startOctave + o
    for (let i = 0; i < whiteNotes.length; i++) {
      const note = whiteNotes[i]!
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
        index: globalIndex++,
      })
    }
  }
  return keys
})

const blackKeys = computed<KeyData[]>(() => {
  const keys: KeyData[] = []
  let globalIndex = whiteKeys.value.length
  for (let o = 0; o < props.octaves; o++) {
    const octave = props.startOctave + o
    for (const [note, offset] of Object.entries(blackKeyOffsets)) {
      if (!note) continue
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
        index: globalIndex++,
      })
    }
  }
  return keys
})

// All keys combined for keyboard navigation
const allKeys = computed(() => {
  return [...whiteKeys.value, ...blackKeys.value].sort((a, b) => a.x - b.x)
})

// Keyboard navigation state
const focusedKeyIndex = ref<number | null>(null)
const keyboardRef = ref<SVGSVGElement | null>(null)

function isHighlighted(note: string): boolean {
  return props.highlightedNotes.includes(note)
}

function isRoot(note: string): boolean {
  return props.rootNote === note
}

function getWhiteKeyFill(note: string): string {
  if (isRoot(note)) return 'var(--color-primary)'
  if (isHighlighted(note)) return 'var(--color-secondary)'
  return 'var(--color-key-white)'
}

function getBlackKeyFill(note: string): string {
  if (isRoot(note)) return 'var(--color-primary)'
  if (isHighlighted(note)) return 'var(--color-secondary)'
  return 'var(--color-key-black)'
}

function getTextFill(note: string, isBlack: boolean): string {
  if (isRoot(note) || isHighlighted(note)) return 'var(--color-on-highlight)'
  return isBlack ? 'var(--color-note-text-inv)' : 'var(--color-note-text)'
}

const pressedKey = ref<string | null>(null)
const tappedKey = ref<string | null>(null)

function keyId(key: KeyData): string {
  return `${key.note}-${key.octave}`
}

function handleMouseDown(key: KeyData) {
  pressedKey.value = keyId(key)
}

function handleMouseUp() {
  pressedKey.value = null
}

function handleClick(key: KeyData) {
  tappedKey.value = keyId(key)
  setTimeout(() => { tappedKey.value = null }, 250)
  playNote(key.note, key.octave, 'piano')
  emit('noteClick', { note: key.note, octave: key.octave, midi: key.midi })
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  if (focusedKeyIndex.value === null) {
    focusedKeyIndex.value = 0
    return
  }

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      focusedKeyIndex.value = Math.min(focusedKeyIndex.value + 1, allKeys.value.length - 1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      focusedKeyIndex.value = Math.max(focusedKeyIndex.value - 1, 0)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      const currentKey = allKeys.value[focusedKeyIndex.value]
      if (currentKey) {
        handleClick(currentKey)
      }
      break
    default:
      return
  }
}

function isFocused(key: KeyData): boolean {
  return focusedKeyIndex.value !== null && allKeys.value[focusedKeyIndex.value]?.index === key.index
}

function getKeyLabel(key: KeyData): string {
  const state = isHighlighted(key.note) ? ' (highlighted)' : ''
  const rootState = isRoot(key.note) ? ' (root note)' : ''
  return `${key.note}${key.octave}${key.isBlack ? ' sharp' : ''}${state}${rootState}`
}
</script>

<template>
  <svg
    ref="keyboardRef"
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    class="w-full h-auto select-none"
    xmlns="http://www.w3.org/2000/svg"
    role="application"
    aria-label="Piano keyboard. Use arrow keys to navigate between keys, Enter or Space to play."
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- White keys -->
    <g
      v-for="key in whiteKeys"
      :key="`white-${key.note}-${key.octave}`"
      class="cursor-pointer"
      :class="{ 'note-tapped': tappedKey === keyId(key) }"
      role="button"
      :aria-label="getKeyLabel(key)"
      :aria-pressed="isHighlighted(key.note) || isRoot(key.note)"
      :tabindex="isFocused(key) ? 0 : -1"
      @click="handleClick(key)"
      @mousedown="handleMouseDown(key)"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @focus="focusedKeyIndex = allKeys.findIndex(k => k.index === key.index)"
    >
      <rect
        :x="key.x"
        :y="pressedKey === keyId(key) ? key.y + 2 : key.y"
        :width="key.w"
        :height="key.h"
        :fill="getWhiteKeyFill(key.note)"
        style="stroke: var(--color-nord3)"
        stroke-width="1"
        rx="0"
        ry="0"
        class="white-key"
      />
      <!-- Focus indicator -->
      <rect
        v-if="isFocused(key)"
        :x="key.x + 2"
        :y="key.y + 2"
        :width="key.w - 4"
        :height="key.h - 4"
        fill="none"
        stroke="var(--color-primary)"
        stroke-width="3"
        stroke-dasharray="4,2"
        class="focus-indicator"
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
      :class="{ 'note-tapped': tappedKey === keyId(key) }"
      role="button"
      :aria-label="getKeyLabel(key)"
      :aria-pressed="isHighlighted(key.note) || isRoot(key.note)"
      :tabindex="isFocused(key) ? 0 : -1"
      @click="handleClick(key)"
      @mousedown="handleMouseDown(key)"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @focus="focusedKeyIndex = allKeys.findIndex(k => k.index === key.index)"
    >
      <rect
        :x="key.x"
        :y="pressedKey === keyId(key) ? key.y + 2 : key.y"
        :width="key.w"
        :height="key.h"
        :fill="getBlackKeyFill(key.note)"
        style="stroke: var(--color-nord1)"
        stroke-width="1"
        rx="0"
        ry="0"
        class="black-key"
      />
      <!-- Focus indicator -->
      <rect
        v-if="isFocused(key)"
        :x="key.x + 2"
        :y="key.y + 2"
        :width="key.w - 4"
        :height="key.h - 4"
        fill="none"
        stroke="var(--color-primary)"
        stroke-width="3"
        stroke-dasharray="4,2"
        class="focus-indicator"
      />
    </g>
  </svg>
</template>

<style scoped>
.white-key {
  transition: fill 0.1s, y 0.05s ease;
}
.white-key:hover {
  filter: brightness(0.92);
}
.black-key {
  transition: fill 0.1s, y 0.05s ease;
}
.black-key:hover {
  filter: brightness(1.3);
}

@keyframes note-glow {
  0%   { transform: scale(1); filter: none; }
  50%  { transform: scale(1.08); filter: drop-shadow(0 0 4px rgba(136, 192, 208, 0.6)); }
  100% { transform: scale(1); filter: none; }
}

.note-tapped {
  animation: note-glow 250ms ease-out;
  transform-origin: center;
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
