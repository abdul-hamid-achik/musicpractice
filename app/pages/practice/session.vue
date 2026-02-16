<script setup lang="ts">
definePageMeta({ layout: 'fullscreen' })

const router = useRouter()
const settingsStore = useSettingsStore()
const { isActive, elapsed, startSession, stopSession, saveSession, formatTime } = usePracticeSession()

const selectedInstrument = ref(settingsStore.defaultInstrument)
const sessionNotes = ref('')
const tagsInput = ref('')
const showAlphaTab = ref(false)

const tags = computed(() =>
  tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),
)

function removeTag(index: number) {
  const arr = tags.value.slice()
  arr.splice(index, 1)
  tagsInput.value = arr.join(', ')
}

function handleStart() {
  startSession(selectedInstrument.value, settingsStore.defaultTempo)
}

async function handleEnd() {
  await saveSession(sessionNotes.value || undefined, tags.value.length ? tags.value : undefined)
  router.push('/practice/history')
}

onMounted(() => {
  handleStart()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Instrument Selector -->
    <div>
      <InstrumentSelector v-model="selectedInstrument" />
    </div>

    <!-- Main Layout: Timer/Tempo + Metronome -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Timer + Tempo Trainer -->
      <div class="space-y-6">
        <NordCard title="Session Timer">
          <PracticeTimer />
          <div class="text-center mt-4">
            <span class="text-3xl font-mono font-bold text-primary">{{ formatTime(elapsed) }}</span>
          </div>
        </NordCard>

        <NordCard title="Tempo Trainer">
          <TempoTrainer :start-bpm="settingsStore.defaultTempo" :target-bpm="settingsStore.defaultTempo + 20" />
        </NordCard>
      </div>

      <!-- Right: Metronome -->
      <div>
        <NordCard title="Metronome">
          <Metronome />
        </NordCard>
      </div>
    </div>

    <!-- AlphaTab Section -->
    <NordCard>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-text">Sheet Music / Tablature</h3>
        <NordButton variant="ghost" size="sm" @click="showAlphaTab = !showAlphaTab">
          {{ showAlphaTab ? 'Hide' : 'Show' }}
        </NordButton>
      </div>
      <div v-if="showAlphaTab">
        <AlphaTabViewer alpha-tex=":4 0.6 2.5 2.4 0.3 | 0.6 2.5 2.4 0.3" />
      </div>
    </NordCard>

    <!-- Notes & Tags -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NordCard title="Session Notes">
        <textarea
          v-model="sessionNotes"
          rows="4"
          placeholder="What did you work on?"
          class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </NordCard>

      <NordCard title="Tags">
        <input
          v-model="tagsInput"
          type="text"
          placeholder="scales, arpeggios, sight-reading"
          class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
        />
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(tag, i) in tags"
            :key="i"
            class="inline-flex items-center gap-1 bg-primary/20 text-primary text-sm px-2.5 py-1 rounded-full"
          >
            {{ tag }}
            <button class="hover:text-error" @click="removeTag(i)">&times;</button>
          </span>
        </div>
      </NordCard>
    </div>

    <!-- End Session -->
    <div class="flex justify-center pb-8">
      <NordButton variant="danger" size="lg" @click="handleEnd">
        End Session
      </NordButton>
    </div>
  </div>
</template>
