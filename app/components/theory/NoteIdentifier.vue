<script setup lang="ts">
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

interface NoteQuiz {
  note: string
  octave: number
  vexKey: string
}

const emit = defineEmits<{
  scoreUpdate: [payload: { correct: number; total: number }]
}>()

const vexContainer = ref<HTMLDivElement | null>(null)
const correct = ref(0)
const total = ref(0)
const currentNote = ref<NoteQuiz | null>(null)
const clef = ref<'treble' | 'bass'>('treble')
const difficulty = ref<'easy' | 'medium' | 'hard'>('easy')
const answered = ref(false)
const lastGuessCorrect = ref<boolean | null>(null)
const correctAnswer = ref<string | null>(null)
const flashStates = ref<Record<string, 'correct' | 'incorrect' | null>>({})
const vexReady = ref(false)

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const scorePercent = computed(() => {
  if (total.value === 0) return 0
  return Math.round((correct.value / total.value) * 100)
})

const answerButtons = computed(() => {
  if (difficulty.value === 'easy') return [...NATURAL_NOTES]
  return [...NOTE_NAMES]
})

// Note ranges per clef and difficulty
function getNoteRange(): { notes: string[]; octaves: number[] } {
  if (clef.value === 'treble') {
    if (difficulty.value === 'easy') return { notes: [...NATURAL_NOTES], octaves: [4, 5] }
    if (difficulty.value === 'medium') return { notes: [...NOTE_NAMES], octaves: [4, 5] }
    return { notes: [...NOTE_NAMES], octaves: [3, 4, 5, 6] }
  }
  // Bass clef
  if (difficulty.value === 'easy') return { notes: [...NATURAL_NOTES], octaves: [2, 3] }
  if (difficulty.value === 'medium') return { notes: [...NOTE_NAMES], octaves: [2, 3] }
  return { notes: [...NOTE_NAMES], octaves: [1, 2, 3, 4] }
}

function pickRandomNote(): NoteQuiz {
  const range = getNoteRange()
  const note = range.notes[Math.floor(Math.random() * range.notes.length)]!
  const octave = range.octaves[Math.floor(Math.random() * range.octaves.length)]!

  // Convert to VexFlow key format: "c/4", "c#/4"
  const vexNote = note.toLowerCase().replace('#', '#')
  const vexKey = `${vexNote}/${octave}`

  return { note, octave, vexKey }
}

async function renderNote(quiz: NoteQuiz) {
  if (!vexContainer.value) return

  try {
    const VexFlow = await import('vexflow')
    const { Renderer, Stave, StaveNote, Formatter, Accidental } = VexFlow.default || VexFlow

    vexContainer.value.innerHTML = ''
    vexReady.value = true

    const renderer = new Renderer(vexContainer.value, Renderer.Backends.SVG)
    renderer.resize(320, 180)
    const context = renderer.getContext()
    context.setFont('Arial', 10)

    // Style for Nord theme
    const svg = vexContainer.value.querySelector('svg')
    if (svg) {
      svg.style.background = 'transparent'
    }

    const stave = new Stave(10, 30, 300)
    stave.addClef(clef.value)
    stave.setStyle({ fillStyle: getCssVar('--color-text'), strokeStyle: getCssVar('--color-text-muted') })
    stave.setContext(context).draw()

    // Build VexFlow note
    const baseName = quiz.note.replace('#', '')
    const hasSharp = quiz.note.includes('#')
    const vexNoteName = `${baseName.toLowerCase()}/${quiz.octave}`

    const staveNote = new StaveNote({
      clef: clef.value,
      keys: [vexNoteName],
      duration: 'w',
    })

    if (hasSharp) {
      staveNote.addModifier(new Accidental('#'))
    }

    staveNote.setStyle({ fillStyle: getCssVar('--color-text'), strokeStyle: getCssVar('--color-text') })

    Formatter.FormatAndDraw(context, stave, [staveNote])
  } catch {
    // VexFlow not available in SSR
    vexReady.value = false
  }
}

async function newNote() {
  answered.value = false
  lastGuessCorrect.value = null
  correctAnswer.value = null
  flashStates.value = {}
  currentNote.value = pickRandomNote()
  await nextTick()
  await renderNote(currentNote.value)
}

function guess(note: string) {
  if (answered.value || !currentNote.value) return

  total.value++
  // Compare only note name (ignore octave)
  if (note === currentNote.value.note) {
    correct.value++
    lastGuessCorrect.value = true
    flashStates.value = { [note]: 'correct' }
    answered.value = true
    emit('scoreUpdate', { correct: correct.value, total: total.value })
    setTimeout(() => newNote(), 1000)
  } else {
    lastGuessCorrect.value = false
    correctAnswer.value = currentNote.value.note
    flashStates.value = {
      [note]: 'incorrect',
      [currentNote.value.note]: 'correct',
    }
    answered.value = true
    emit('scoreUpdate', { correct: correct.value, total: total.value })
  }
}

function reset() {
  correct.value = 0
  total.value = 0
  currentNote.value = null
  answered.value = false
  lastGuessCorrect.value = null
  correctAnswer.value = null
  flashStates.value = {}
}

function buttonClass(note: string): string {
  const flash = flashStates.value[note]
  if (flash === 'correct') return 'bg-success text-on-success'
  if (flash === 'incorrect') return 'bg-error text-on-error'
  return 'bg-surface-alt text-text hover:bg-border'
}

// Re-render when clef or difficulty changes
watch([clef, difficulty], () => {
  if (currentNote.value) {
    newNote()
  }
})

const settingsStore = useSettingsStore()
watch(() => settingsStore.theme, () => {
  if (currentNote.value) {
    nextTick(() => renderNote(currentNote.value!))
  }
})
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-text">Note Identifier</h2>
      <button
        class="px-3 py-1.5 rounded-md text-sm font-medium bg-surface-alt text-text-muted hover:bg-border transition-all"
        @click="reset"
      >
        Reset
      </button>
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
      <div class="w-full bg-surface-alt rounded-full h-2">
        <div
          class="bg-primary rounded-full h-2 transition-all duration-300"
          :style="{ width: `${scorePercent}%` }"
        />
      </div>
    </div>

    <!-- Settings -->
    <div class="flex flex-wrap gap-4">
      <!-- Clef Toggle -->
      <div>
        <label class="block text-sm font-medium text-text-muted mb-2">Clef</label>
        <div class="flex gap-2">
          <button
            v-for="c in (['treble', 'bass'] as const)"
            :key="c"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            :class="clef === c ? 'bg-primary text-on-primary' : 'bg-surface-alt text-text-muted hover:bg-border'"
            @click="clef = c"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <!-- Difficulty Toggle -->
      <div>
        <label class="block text-sm font-medium text-text-muted mb-2">Difficulty</label>
        <div class="flex gap-2">
          <button
            v-for="d in (['easy', 'medium', 'hard'] as const)"
            :key="d"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            :class="difficulty === d ? 'bg-primary text-on-primary' : 'bg-surface-alt text-text-muted hover:bg-border'"
            @click="difficulty = d"
          >
            {{ d }}
          </button>
        </div>
      </div>
    </div>

    <!-- VexFlow Staff Container -->
    <div class="bg-surface rounded-lg p-4 border border-border flex justify-center min-h-[200px] items-center">
      <div v-if="!currentNote" class="text-text-muted text-center">
        <p class="mb-4">Press "New Note" to start identifying notes on the staff.</p>
        <button
          class="px-6 py-3 rounded-md font-medium bg-primary text-on-primary hover:brightness-110 transition-all"
          @click="newNote"
        >
          New Note
        </button>
      </div>
      <div ref="vexContainer" class="vexflow-container" />
    </div>

    <!-- Action Buttons -->
    <div v-if="currentNote" class="flex gap-3">
      <button
        class="px-4 py-2 rounded-md font-medium bg-secondary text-on-secondary hover:brightness-110 transition-all"
        @click="newNote"
      >
        {{ answered ? 'Next Note' : 'Skip' }}
      </button>
    </div>

    <!-- Answer Buttons -->
    <div v-if="currentNote">
      <label class="block text-sm font-medium text-text-muted mb-2">Identify the Note</label>
      <div class="grid gap-2" :class="difficulty === 'easy' ? 'grid-cols-7' : 'grid-cols-4 sm:grid-cols-6'">
        <button
          v-for="note in answerButtons"
          :key="note"
          class="rounded-md px-2 py-3 text-center font-bold text-sm transition-all duration-200"
          :class="buttonClass(note)"
          :disabled="answered"
          @click="guess(note)"
        >
          {{ note }}
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="lastGuessCorrect !== null" class="text-center">
      <p v-if="lastGuessCorrect" class="text-success font-medium">
        Correct!
      </p>
      <p v-else class="text-error font-medium">
        Incorrect. The answer was <span class="text-primary font-bold">{{ correctAnswer }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.vexflow-container :deep(svg) {
  overflow: visible;
}

.vexflow-container :deep(.vf-stavenote) {
  fill: var(--color-text);
  stroke: var(--color-text);
}

.vexflow-container :deep(.vf-stave) {
  fill: none;
  stroke: var(--color-text-muted);
}

.vexflow-container :deep(.vf-clef) {
  fill: var(--color-text-muted);
}

.vexflow-container :deep(.vf-timesig) {
  fill: var(--color-text-muted);
}

.vexflow-container :deep(text) {
  fill: var(--color-text);
}
</style>
