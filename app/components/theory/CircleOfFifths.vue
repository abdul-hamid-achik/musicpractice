<script setup lang="ts">
const emit = defineEmits<{
  keySelected: [payload: { key: string; type: 'major' | 'minor' }]
}>()

const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#/Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m/Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm']

const KEY_SIGNATURES: Record<string, string> = {
  C: '0', G: '1#', D: '2#', A: '3#', E: '4#', B: '5#',
  'F#/Gb': '6#/6b', Db: '5b', Ab: '4b', Eb: '3b', Bb: '2b', F: '1b',
  Am: '0', Em: '1#', Bm: '2#', 'F#m': '3#', 'C#m': '4#', 'G#m': '5#',
  'D#m/Ebm': '6#/6b', Bbm: '5b', Fm: '4b', Cm: '3b', Gm: '2b', Dm: '1b',
}

const DIATONIC_CHORDS: Record<string, string[]> = {
  C: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B\u00B0'],
  G: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#\u00B0'],
  D: ['D', 'Em', 'F#m', 'A', 'G', 'Bm', 'C#\u00B0'],
  A: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#\u00B0'],
  E: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#\u00B0'],
  B: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#\u00B0'],
  'F#/Gb': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#\u00B0'],
  Db: ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'C\u00B0'],
  Ab: ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'G\u00B0'],
  Eb: ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'D\u00B0'],
  Bb: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'A\u00B0'],
  F: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'E\u00B0'],
}

const ROMAN_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii\u00B0']

const selectedKey = ref<string | null>(null)
const selectedType = ref<'major' | 'minor'>('major')
const hoveredIndex = ref<number | null>(null)

const cx = 200
const cy = 200
const outerR = 170
const innerR = 120
const segAngle = (2 * Math.PI) / 12

function polarToXY(angle: number, radius: number) {
  // Start from 12 o'clock (-PI/2), go clockwise
  const a = angle - Math.PI / 2
  return {
    x: cx + radius * Math.cos(a),
    y: cy + radius * Math.sin(a),
  }
}

function arcPath(startAngle: number, endAngle: number, r1: number, r2: number) {
  const s1 = polarToXY(startAngle, r1)
  const e1 = polarToXY(endAngle, r1)
  const s2 = polarToXY(endAngle, r2)
  const e2 = polarToXY(startAngle, r2)
  return `M ${s1.x} ${s1.y} A ${r1} ${r1} 0 0 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r2} ${r2} 0 0 0 ${e2.x} ${e2.y} Z`
}

const outerSegments = computed(() => {
  return MAJOR_KEYS.map((key, i) => {
    const start = i * segAngle
    const end = (i + 1) * segAngle
    const mid = polarToXY(start + segAngle / 2, (outerR + innerR + 20) / 2)
    const isSelected = selectedKey.value === key && selectedType.value === 'major'
    const isHovered = hoveredIndex.value === i
    return { key, path: arcPath(start, end, outerR, innerR + 10), labelX: mid.x, labelY: mid.y, isSelected, isHovered, index: i }
  })
})

const innerSegments = computed(() => {
  return MINOR_KEYS.map((key, i) => {
    const start = i * segAngle
    const end = (i + 1) * segAngle
    const mid = polarToXY(start + segAngle / 2, (innerR + 40) / 2)
    const isSelected = selectedKey.value === key && selectedType.value === 'minor'
    const isHovered = hoveredIndex.value === i + 12
    return { key, path: arcPath(start, end, innerR + 6, 40), labelX: mid.x, labelY: mid.y, isSelected, isHovered, index: i + 12 }
  })
})

const keySigDisplay = computed(() => {
  if (!selectedKey.value) return null
  return KEY_SIGNATURES[selectedKey.value] || '0'
})

const relatedChords = computed(() => {
  if (!selectedKey.value || selectedType.value !== 'major') return null
  return DIATONIC_CHORDS[selectedKey.value] || null
})

function selectMajor(key: string, index: number) {
  selectedKey.value = key
  selectedType.value = 'major'
  emit('keySelected', { key, type: 'major' })
}

function selectMinor(key: string, index: number) {
  selectedKey.value = key
  selectedType.value = 'minor'
  emit('keySelected', { key, type: 'minor' })
}
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-6 space-y-6">
    <h2 class="text-xl font-semibold text-text text-center">Circle of Fifths</h2>

    <div class="flex justify-center">
      <svg viewBox="0 0 400 400" class="w-full max-w-md" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer ring (Major keys) -->
        <g v-for="seg in outerSegments" :key="'outer-' + seg.index">
          <path
            :d="seg.path"
            :fill="seg.isSelected ? '#88C0D0' : seg.isHovered ? 'var(--color-nord3)' : 'var(--color-nord2)'"
            style="stroke: var(--color-nord0)"
            stroke-width="2"
            class="cursor-pointer transition-colors duration-150"
            @click="selectMajor(seg.key, seg.index)"
            @mouseenter="hoveredIndex = seg.index"
            @mouseleave="hoveredIndex = null"
          />
          <text
            :x="seg.labelX"
            :y="seg.labelY + 1"
            text-anchor="middle"
            dominant-baseline="central"
            :fill="seg.isSelected ? '#2E3440' : '#ECEFF4'"
            :font-size="seg.key.length > 2 ? 11 : 14"
            font-weight="bold"
            class="pointer-events-none select-none"
          >
            {{ seg.key }}
          </text>
        </g>

        <!-- Inner ring (Minor keys) -->
        <g v-for="seg in innerSegments" :key="'inner-' + seg.index">
          <path
            :d="seg.path"
            :fill="seg.isSelected ? '#5E81AC' : seg.isHovered ? 'var(--color-nord1)' : 'var(--color-nord0)'"
            style="stroke: var(--color-nord1)"
            stroke-width="1.5"
            class="cursor-pointer transition-colors duration-150"
            @click="selectMinor(seg.key, seg.index - 12)"
            @mouseenter="hoveredIndex = seg.index"
            @mouseleave="hoveredIndex = null"
          />
          <text
            :x="seg.labelX"
            :y="seg.labelY + 1"
            text-anchor="middle"
            dominant-baseline="central"
            :fill="seg.isSelected ? '#ECEFF4' : '#D8DEE9'"
            :font-size="seg.key.length > 3 ? 8 : 10"
            font-weight="600"
            class="pointer-events-none select-none"
          >
            {{ seg.key }}
          </text>
        </g>

        <!-- Center circle -->
        <circle :cx="cx" :cy="cy" r="38" style="fill: var(--color-nord0); stroke: var(--color-nord1)" stroke-width="1.5" />
        <text
          v-if="selectedKey"
          :x="cx"
          :y="cy"
          text-anchor="middle"
          dominant-baseline="central"
          fill="#88C0D0"
          font-size="16"
          font-weight="bold"
          class="select-none"
        >
          {{ selectedKey }}
        </text>
        <text
          v-else
          :x="cx"
          :y="cy"
          text-anchor="middle"
          dominant-baseline="central"
          style="fill: var(--color-nord3)"
          font-size="10"
          class="select-none"
        >
          Select a key
        </text>
      </svg>
    </div>

    <!-- Key Signature Display -->
    <div v-if="selectedKey" class="space-y-4">
      <div class="bg-surface rounded-lg p-4 border border-border text-center">
        <h3 class="text-lg font-semibold text-primary mb-1">
          {{ selectedKey }} {{ selectedType === 'major' ? 'Major' : 'Minor' }}
        </h3>
        <p class="text-text-muted text-sm">
          Key Signature: <span class="text-text font-mono">{{ keySigDisplay }}</span>
        </p>
      </div>

      <!-- Related Chords (major keys only) -->
      <div v-if="relatedChords" class="bg-surface rounded-lg p-4 border border-border">
        <h4 class="text-sm font-medium text-text-muted mb-3">Diatonic Chords</h4>
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(chord, i) in relatedChords"
            :key="i"
            class="bg-surface-alt rounded-md p-2 text-center"
          >
            <div class="text-primary font-bold text-sm">{{ chord }}</div>
            <div class="text-text-muted text-xs">{{ ROMAN_NUMERALS[i] }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
