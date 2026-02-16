<script setup lang="ts">
const { bpm, isRunning, beatsPerMeasure, currentBeat, start, stop, setBpm } =
  useMetronome()

const timeSignatures = [
  { label: '2/4', beats: 2, unit: 4 },
  { label: '3/4', beats: 3, unit: 4 },
  { label: '4/4', beats: 4, unit: 4 },
  { label: '5/4', beats: 5, unit: 4 },
  { label: '6/8', beats: 6, unit: 8 },
  { label: '7/8', beats: 7, unit: 8 },
]

const selectedTimeSig = ref('4/4')

function setTimeSignature(sig: (typeof timeSignatures)[number]) {
  selectedTimeSig.value = sig.label
  beatsPerMeasure.value = sig.beats
}

function adjustBpm(delta: number) {
  const newBpm = Math.min(300, Math.max(30, bpm.value + delta))
  setBpm(newBpm)
}

function handleSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  setBpm(parseInt(target.value))
}

function togglePlayback() {
  if (isRunning.value) {
    stop()
  } else {
    start()
  }
}

// Tap tempo
const tapTimes = ref<number[]>([])

function handleTap() {
  const now = Date.now()
  tapTimes.value.push(now)

  // Keep only last 4 taps
  if (tapTimes.value.length > 4) {
    tapTimes.value = tapTimes.value.slice(-4)
  }

  if (tapTimes.value.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < tapTimes.value.length; i++) {
      intervals.push(tapTimes.value[i]! - tapTimes.value[i - 1]!)
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const tapBpm = Math.round(60000 / avgInterval)
    if (tapBpm >= 30 && tapBpm <= 300) {
      setBpm(tapBpm)
    }
  }

  // Reset if gap > 2 seconds
  setTimeout(() => {
    if (tapTimes.value.length > 0 && Date.now() - tapTimes.value[tapTimes.value.length - 1]! > 2000) {
      tapTimes.value = []
    }
  }, 2100)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- BPM Display -->
    <div class="flex items-center justify-center gap-4">
      <button
        class="w-10 h-10 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors text-lg font-bold"
        @click="adjustBpm(-5)"
      >
        -5
      </button>
      <button
        class="w-8 h-8 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors font-bold"
        @click="adjustBpm(-1)"
      >
        -
      </button>
      <div class="text-center min-w-[100px]">
        <div class="text-5xl font-bold font-mono text-text">{{ bpm }}</div>
        <div class="text-sm text-text-muted mt-1">BPM</div>
      </div>
      <button
        class="w-8 h-8 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors font-bold"
        @click="adjustBpm(1)"
      >
        +
      </button>
      <button
        class="w-10 h-10 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors text-lg font-bold"
        @click="adjustBpm(5)"
      >
        +5
      </button>
    </div>

    <!-- BPM Slider -->
    <input
      :value="bpm"
      type="range"
      min="30"
      max="300"
      class="w-full accent-primary"
      @input="handleSliderInput"
    />

    <!-- Time Signature -->
    <div class="flex flex-wrap gap-2 justify-center">
      <button
        v-for="sig in timeSignatures"
        :key="sig.label"
        class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        :class="
          selectedTimeSig === sig.label
            ? 'bg-primary text-nord0'
            : 'bg-surface-alt text-text-muted hover:bg-border'
        "
        @click="setTimeSignature(sig)"
      >
        {{ sig.label }}
      </button>
    </div>

    <!-- Visual Beat Indicator -->
    <div class="flex justify-center gap-3">
      <div
        v-for="beat in beatsPerMeasure"
        :key="beat"
        class="w-8 h-8 rounded-full border-2 transition-all duration-100"
        :class="[
          currentBeat === beat - 1 && isRunning
            ? beat === 1
              ? 'bg-warning border-warning scale-110'
              : 'bg-primary border-primary scale-110'
            : 'border-border bg-transparent',
        ]"
      />
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-4">
      <button
        class="px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
        :class="
          isRunning
            ? 'bg-error text-white hover:brightness-110'
            : 'bg-success text-nord0 hover:brightness-110'
        "
        @click="togglePlayback"
      >
        {{ isRunning ? 'Stop' : 'Start' }}
      </button>

      <button
        class="px-6 py-3 rounded-lg text-lg font-semibold bg-surface-alt text-text-muted hover:bg-border transition-colors"
        @click="handleTap"
      >
        Tap Tempo
      </button>
    </div>
  </div>
</template>
