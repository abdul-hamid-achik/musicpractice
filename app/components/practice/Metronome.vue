<script setup lang="ts">
import { apiGet, apiPost } from '~/utils/api'

const { bpm, isRunning, beatsPerMeasure, currentBeat, start, stop, setBpm } =
  useMetronome()
const { showError, showSuccess } = useToast()

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

// Presets
const presets = ref<Array<{ id: string; name: string; tempoBpm: number; beatsPerMeasure: number; beatUnit: number }>>([])
const showSavePreset = ref(false)
const presetName = ref('')
const presetsLoading = ref(false)

async function loadPresets() {
  try {
    presetsLoading.value = true
    const result = await apiGet<{ data: typeof presets.value }>('/api/metronome-presets', { suppressError: true })
    presets.value = result.data
  } catch (error) {
    showError('Failed to load metronome presets')
    console.error('Error loading presets:', error)
  } finally {
    presetsLoading.value = false
  }
}

async function savePreset() {
  if (!presetName.value.trim()) return
  try {
    const preset = await apiPost<{ id: string; name: string; tempoBpm: number; beatsPerMeasure: number; beatUnit: number }>(
      '/api/metronome-presets',
      {
        name: presetName.value.trim(),
        tempoBpm: bpm.value,
        beatsPerMeasure: beatsPerMeasure.value,
        beatUnit: 4,
      },
      { successMessage: 'Preset saved successfully' }
    )
    presets.value.push(preset)
    presetName.value = ''
    showSavePreset.value = false
  } catch (error) {
    showError('Failed to save preset')
    console.error('Error saving preset:', error)
  }
}

function loadPreset(preset: (typeof presets.value)[number]) {
  setBpm(preset.tempoBpm)
  beatsPerMeasure.value = preset.beatsPerMeasure
  const matchedSig = timeSignatures.find((s) => s.beats === preset.beatsPerMeasure)
  if (matchedSig) {
    selectedTimeSig.value = matchedSig.label
  }
}

onMounted(() => {
  loadPresets()
})

defineExpose({ setBpm, adjustBpm, togglePlayback, bpm, isRunning })
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- BPM Display -->
    <div class="flex items-center justify-center gap-4">
      <button
        class="w-10 h-10 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
        aria-label="Decrease tempo by 5 BPM"
        @click="adjustBpm(-5)"
      >
        -5
      </button>
      <button
        class="w-8 h-8 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
        aria-label="Decrease tempo by 1 BPM"
        @click="adjustBpm(-1)"
      >
        -
      </button>
      <div class="text-center min-w-[100px]" aria-live="polite">
        <div class="text-5xl font-bold font-mono text-text">{{ bpm }}</div>
        <div class="text-sm text-text-muted mt-1">BPM</div>
      </div>
      <button
        class="w-8 h-8 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
        aria-label="Increase tempo by 1 BPM"
        @click="adjustBpm(1)"
      >
        +
      </button>
      <button
        class="w-10 h-10 rounded-lg bg-surface-alt text-text-muted hover:bg-border transition-colors text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
        aria-label="Increase tempo by 5 BPM"
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
      class="w-full accent-primary focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Tempo slider"
      aria-valuemin="30"
      aria-valuemax="300"
      aria-valuenow="bpm"
      @input="handleSliderInput"
    />

    <!-- Time Signature -->
    <div class="flex flex-wrap gap-2 justify-center" role="group" aria-label="Time signature selection">
      <NordButton
        v-for="sig in timeSignatures"
        :key="sig.label"
        :variant="selectedTimeSig === sig.label ? 'primary' : 'ghost'"
        size="sm"
        :aria-pressed="selectedTimeSig === sig.label"
        @click="setTimeSignature(sig)"
      >
        {{ sig.label }}
      </NordButton>
    </div>

    <!-- Visual Beat Indicator -->
    <div class="flex justify-center gap-3" role="group" aria-label="Beat indicator" aria-live="polite">
      <div
        v-for="beat in beatsPerMeasure"
        :key="beat"
        class="w-8 h-8 rounded-full border-2 transition-all duration-100"
        :class="[
          currentBeat === beat - 1 && isRunning
            ? beat === 1
              ? 'bg-warning border-warning scale-110 beat-ripple'
              : 'bg-primary border-primary scale-110 beat-ripple'
            : 'border-border bg-transparent',
        ]"
        :aria-label="`Beat ${beat}${currentBeat === beat - 1 && isRunning ? ' (current)' : ''}`"
      />
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-4">
      <NordButton
        :variant="isRunning ? 'danger' : 'success'"
        size="lg"
        :aria-pressed="isRunning"
        :aria-label="isRunning ? 'Stop metronome' : 'Start metronome'"
        @click="togglePlayback"
      >
        {{ isRunning ? 'Stop' : 'Start' }}
      </NordButton>

      <NordButton variant="ghost" size="lg" aria-label="Tap tempo" @click="handleTap">
        Tap Tempo
      </NordButton>
    </div>

    <!-- Presets -->
    <div class="border-t border-border pt-4 mt-2">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-text-muted">Presets</h4>
        <button
          class="text-sm text-primary hover:text-text transition-colors"
          @click="showSavePreset = !showSavePreset"
        >
          {{ showSavePreset ? 'Cancel' : 'Save Current' }}
        </button>
      </div>

      <!-- Save preset form -->
      <div v-if="showSavePreset" class="flex gap-2 mb-3">
        <input
          v-model="presetName"
          type="text"
          placeholder="Preset name..."
          class="flex-1 bg-surface-alt text-text border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          @keyup.enter="savePreset"
        />
        <button
          class="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-on-primary hover:brightness-110 transition-colors disabled:opacity-50"
          :disabled="!presetName.trim()"
          @click="savePreset"
        >
          Save
        </button>
      </div>

      <!-- Preset buttons -->
      <div v-if="presets.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="px-3 py-1.5 rounded-md text-sm bg-surface-alt text-text-muted hover:bg-border hover:text-text transition-colors"
          @click="loadPreset(preset)"
        >
          {{ preset.name }} ({{ preset.tempoBpm }})
        </button>
      </div>
      <p v-else-if="!presetsLoading" class="text-xs text-text-muted">No saved presets</p>
    </div>
  </div>
</template>

<style scoped>
.beat-ripple {
  animation: beat-ripple 300ms ease-out;
}

@keyframes beat-ripple {
  from { box-shadow: 0 0 0 0 rgba(136, 192, 208, 0.5); }
  to   { box-shadow: 0 0 0 10px rgba(136, 192, 208, 0); }
}
</style>
