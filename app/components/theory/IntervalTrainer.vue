<script setup lang="ts">
import { useMusicTheory } from '~/composables/useMusicTheory'

interface Interval {
  name: string
  short: string
  semitones: number
}

const INTERVALS: Interval[] = [
  { name: 'Minor 2nd', short: 'm2', semitones: 1 },
  { name: 'Major 2nd', short: 'M2', semitones: 2 },
  { name: 'Minor 3rd', short: 'm3', semitones: 3 },
  { name: 'Major 3rd', short: 'M3', semitones: 4 },
  { name: 'Perfect 4th', short: 'P4', semitones: 5 },
  { name: 'Tritone', short: 'TT', semitones: 6 },
  { name: 'Perfect 5th', short: 'P5', semitones: 7 },
  { name: 'Minor 6th', short: 'm6', semitones: 8 },
  { name: 'Major 6th', short: 'M6', semitones: 9 },
  { name: 'Minor 7th', short: 'm7', semitones: 10 },
  { name: 'Major 7th', short: 'M7', semitones: 11 },
  { name: 'Octave', short: 'P8', semitones: 12 },
]

const emit = defineEmits<{
  scoreUpdate: [payload: { correct: number; total: number }]
}>()

const { midiToNote } = useMusicTheory()

const correct = ref(0)
const total = ref(0)
const currentInterval = ref<Interval | null>(null)
const firstNoteMidi = ref(0)
const isPlaying = ref(false)
const mode = ref<'ascending' | 'descending' | 'both'>('ascending')
const answered = ref(false)
const lastGuessCorrect = ref<boolean | null>(null)
const correctAnswer = ref<Interval | null>(null)
const flashStates = ref<Record<string, 'correct' | 'incorrect' | null>>({})

const scorePercent = computed(() => {
  if (total.value === 0) return 0
  return Math.round((correct.value / total.value) * 100)
})

function pickRandomInterval() {
  const idx = Math.floor(Math.random() * INTERVALS.length)
  return INTERVALS[idx]!
}

function pickRandomNote(): number {
  // C3 = MIDI 48, C5 = MIDI 72
  return 48 + Math.floor(Math.random() * 24)
}

async function playInterval(interval?: Interval) {
  const target = interval || currentInterval.value
  if (!target || isPlaying.value) return
  isPlaying.value = true

  try {
    const Tone = await import('tone')
    await Tone.start()
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.4 },
    }).toDestination()

    const effectiveMode = mode.value === 'both'
      ? (Math.random() > 0.5 ? 'ascending' : 'descending')
      : mode.value

    const note1Midi = firstNoteMidi.value
    const note2Midi = effectiveMode === 'ascending'
      ? note1Midi + target.semitones
      : note1Midi - target.semitones

    const n1 = midiToNote(note1Midi)
    const n2 = midiToNote(note2Midi)

    const now = Tone.now()
    synth.triggerAttackRelease(`${n1.note}${n1.octave}`, '4n', now)
    synth.triggerAttackRelease(`${n2.note}${n2.octave}`, '4n', now + 0.8)

    await new Promise((resolve) => setTimeout(resolve, 1600))
    synth.dispose()
  } catch {
    // Tone.js may not be available
  } finally {
    isPlaying.value = false
  }
}

async function newQuestion() {
  answered.value = false
  lastGuessCorrect.value = null
  correctAnswer.value = null
  flashStates.value = {}
  currentInterval.value = pickRandomInterval()
  firstNoteMidi.value = pickRandomNote()
  await playInterval()
}

function guess(interval: Interval) {
  if (answered.value || !currentInterval.value) return

  total.value++

  if (interval.semitones === currentInterval.value.semitones) {
    correct.value++
    lastGuessCorrect.value = true
    flashStates.value = { [interval.short]: 'correct' }
    answered.value = true
    emit('scoreUpdate', { correct: correct.value, total: total.value })
    setTimeout(() => newQuestion(), 1000)
  } else {
    lastGuessCorrect.value = false
    correctAnswer.value = currentInterval.value
    flashStates.value = {
      [interval.short]: 'incorrect',
      [currentInterval.value.short]: 'correct',
    }
    answered.value = true
    emit('scoreUpdate', { correct: correct.value, total: total.value })
  }
}

function reset() {
  correct.value = 0
  total.value = 0
  currentInterval.value = null
  answered.value = false
  lastGuessCorrect.value = null
  correctAnswer.value = null
  flashStates.value = {}
}

function buttonClass(interval: Interval): string {
  const flash = flashStates.value[interval.short]
  if (flash === 'correct') return 'bg-success text-on-success'
  if (flash === 'incorrect') return 'bg-error text-on-error'
  return 'bg-surface-alt text-text hover:bg-border'
}
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-text">Interval Trainer</h2>
      <NordButton variant="ghost" size="sm" @click="reset">
        Reset
      </NordButton>
    </div>

    <!-- Score Display -->
    <div class="bg-surface rounded-lg p-4 border border-border">
      <div class="flex items-center justify-between mb-2">
        <span class="text-text-muted text-sm">Score</span>
        <span class="text-text font-mono">
          {{ correct }}/{{ total }} correct
          <span v-if="total > 0" class="text-text-muted">({{ scorePercent }}%)</span>
        </span>
      </div>
      <NordProgressBar :value="scorePercent" color="primary" size="sm" />
    </div>

    <!-- Mode Toggle -->
    <div>
      <label class="block text-sm font-medium text-text-muted mb-2">Direction</label>
      <div class="flex gap-2">
        <NordButton
          v-for="m in (['ascending', 'descending', 'both'] as const)"
          :key="m"
          :variant="mode === m ? 'primary' : 'ghost'"
          size="sm"
          class="capitalize"
          @click="mode = m"
        >
          {{ m }}
        </NordButton>
      </div>
    </div>

    <!-- Play Button -->
    <div class="flex gap-3">
      <NordButton
        class="flex-1"
        :variant="currentInterval ? 'secondary' : 'primary'"
        :disabled="isPlaying"
        :loading="isPlaying"
        @click="currentInterval ? playInterval() : newQuestion()"
      >
        <svg v-if="!isPlaying" class="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        {{ !currentInterval ? 'Start' : isPlaying ? 'Playing...' : 'Replay' }}
      </NordButton>
      <NordButton
        v-if="answered && !lastGuessCorrect"
        variant="primary"
        @click="newQuestion()"
      >
        Next
      </NordButton>
    </div>

    <!-- Answer Buttons -->
    <div v-if="currentInterval">
      <label class="block text-sm font-medium text-text-muted mb-2">Your Answer</label>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button
          v-for="interval in INTERVALS"
          :key="interval.short"
          class="rounded-md px-3 py-3 text-center font-medium transition-all duration-200"
          :class="buttonClass(interval)"
          :disabled="answered"
          @click="guess(interval)"
        >
          <div class="text-sm font-bold">{{ interval.short }}</div>
          <div class="text-xs opacity-75">{{ interval.name }}</div>
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="lastGuessCorrect !== null" class="text-center">
      <p v-if="lastGuessCorrect" class="text-success font-medium">
        Correct!
      </p>
      <p v-else class="text-error font-medium">
        Incorrect. The answer was <span class="text-primary font-bold">{{ correctAnswer?.name }} ({{ correctAnswer?.short }})</span>
      </p>
    </div>
  </div>
</template>
