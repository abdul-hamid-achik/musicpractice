<script setup lang="ts">
definePageMeta({ layout: 'fullscreen' })

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const instrumentStore = useInstrumentStore()
const {
  isActive, isPaused, elapsed,
  startSession, pauseSession, resumeSession, stopSession, saveSession,
  restoreSession, getStoredSession, clearStorage, formatTime,
} = usePracticeSession()

const selectedInstrumentId = ref('')
const selectedSongId = ref('')
const songs = ref<Array<{ id: string; title: string; artist: string | null; instrumentType: string }>>([])
const sessionNotes = ref('')
const tagsInput = ref('')
const sessionStarted = ref(false)
const showEndConfirm = ref(false)
const showRecovery = ref(false)
const recoveredSession = ref<any>(null)
const targetBpm = ref(140)
const metronomeRef = ref<{ setBpm: (bpm: number) => void; adjustBpm: (delta: number) => void; togglePlayback: () => void } | null>(null)

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

const filteredSongs = computed(() => {
  if (!selectedInstrumentId.value) return songs.value
  const inst = instrumentStore.instruments.find((i) => i.id === selectedInstrumentId.value)
  if (!inst) return songs.value
  return songs.value.filter((s) => s.instrumentType === inst.type)
})

const selectedSongTitle = computed(() => {
  if (!selectedSongId.value) return null
  const song = songs.value.find((s) => s.id === selectedSongId.value)
  return song ? `${song.title}${song.artist ? ` - ${song.artist}` : ''}` : null
})

function handleStart() {
  if (!selectedInstrumentId.value) return
  startSession(selectedInstrumentId.value, settingsStore.defaultTempo, selectedSongId.value || undefined)
  sessionStarted.value = true
  targetBpm.value = settingsStore.defaultTempo + 20
}

function handleEndClick() {
  showEndConfirm.value = true
}

async function handleConfirmEnd() {
  showEndConfirm.value = false
  await saveSession(sessionNotes.value || undefined, tags.value.length ? tags.value : undefined)
  router.push('/practice/history')
}

function handleCancelEnd() {
  showEndConfirm.value = false
}

function handleTempoChange(bpm: number) {
  metronomeRef.value?.setBpm(bpm)
}

function togglePause() {
  if (isPaused.value) {
    resumeSession()
  } else {
    pauseSession()
  }
}

function handleRecoveryResume() {
  if (recoveredSession.value) {
    restoreSession(recoveredSession.value)
    selectedInstrumentId.value = recoveredSession.value.instrumentId
    sessionStarted.value = true
    targetBpm.value = (recoveredSession.value.tempoBpm || settingsStore.defaultTempo) + 20
  }
  showRecovery.value = false
  recoveredSession.value = null
}

function handleRecoveryDiscard() {
  clearStorage()
  showRecovery.value = false
  recoveredSession.value = null
}

// Keyboard shortcuts
useKeyboardShortcuts({
  onToggleMetronome: () => {
    metronomeRef.value?.togglePlayback()
  },
  onBpmAdjust: (delta: number) => {
    metronomeRef.value?.adjustBpm(delta)
  },
  onTogglePause: () => {
    if (sessionStarted.value) {
      togglePause()
    }
  },
})

onMounted(async () => {
  if (instrumentStore.instruments.length === 0) {
    await instrumentStore.fetchInstruments()
  }

  // Fetch songs for the song selector
  try {
    const res = await $fetch<{ data: typeof songs.value }>('/api/songs')
    songs.value = res.data
  } catch {
    songs.value = []
  }

  // Read instrument type from query param and resolve to UUID
  const queryInstrument = route.query.instrument as string | undefined
  const instrumentType = queryInstrument || settingsStore.defaultInstrument
  const matched = instrumentStore.instruments.find((i) => i.type === instrumentType)
  if (matched) {
    selectedInstrumentId.value = matched.id
  }

  // Pre-select song from query param
  const querySong = route.query.song as string | undefined
  if (querySong) {
    selectedSongId.value = querySong
  }

  // Check for recoverable session
  const stored = getStoredSession()
  if (stored) {
    recoveredSession.value = stored
    showRecovery.value = true
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Pre-session: instrument selection + start button -->
    <template v-if="!sessionStarted">
      <NordCard title="Start a Practice Session">
        <div class="flex flex-col gap-4 items-center py-8">
          <InstrumentSelector v-model="selectedInstrumentId" />
          <div class="w-full max-w-xs">
            <label class="block text-sm text-text-muted mb-1 text-center">Song (optional)</label>
            <select
              v-model="selectedSongId"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Free practice</option>
              <option v-for="song in filteredSongs" :key="song.id" :value="song.id">
                {{ song.title }}{{ song.artist ? ` - ${song.artist}` : '' }}
              </option>
            </select>
          </div>
          <NordButton
            variant="primary"
            size="lg"
            :disabled="!selectedInstrumentId"
            @click="handleStart"
          >
            Start Session
          </NordButton>
        </div>
      </NordCard>
    </template>

    <!-- Active session -->
    <template v-else>
      <!-- Sticky mobile controls -->
      <div class="sticky top-12 z-30 bg-surface border-b border-border p-3 flex items-center justify-between lg:hidden -mx-4 -mt-6 mb-2">
        <span class="text-xl font-mono font-bold text-primary">{{ formatTime(elapsed) }}</span>
        <div class="flex gap-2">
          <NordButton v-if="isActive" size="sm" :variant="isPaused ? 'primary' : 'ghost'" @click="togglePause">
            {{ isPaused ? 'Resume' : 'Pause' }}
          </NordButton>
          <NordButton variant="danger" size="sm" @click="handleEndClick">
            End
          </NordButton>
        </div>
      </div>

      <!-- Instrument Selector -->
      <div class="flex items-center gap-4">
        <InstrumentSelector v-model="selectedInstrumentId" />
        <span v-if="selectedSongTitle" class="text-sm text-text-muted">
          Practicing: <span class="text-primary font-medium">{{ selectedSongTitle }}</span>
        </span>
      </div>

      <!-- Main Layout: Timer/Tempo + Metronome -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Timer + Tempo Trainer -->
        <div class="space-y-6">
          <NordCard title="Session Timer">
            <PracticeTimer
              :is-active="isActive"
              :is-paused="isPaused"
              :elapsed="elapsed"
              :format-time="formatTime"
            />
            <div class="flex justify-center gap-3 mt-4">
              <NordButton
                v-if="isActive"
                :variant="isPaused ? 'primary' : 'ghost'"
                @click="togglePause"
              >
                {{ isPaused ? 'Resume' : 'Pause' }}
              </NordButton>
            </div>
          </NordCard>

          <NordCard title="Tempo Trainer">
            <div class="flex items-center gap-2 mb-4">
              <label class="text-sm text-text-muted">Target BPM:</label>
              <input
                v-model.number="targetBpm"
                type="number"
                min="30"
                max="300"
                class="w-20 bg-surface-alt text-text border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <TempoTrainer
              :start-bpm="settingsStore.defaultTempo"
              :target-bpm="targetBpm"
              @tempo-change="handleTempoChange"
            />
          </NordCard>
        </div>

        <!-- Right: Metronome -->
        <div>
          <NordCard title="Metronome">
            <Metronome ref="metronomeRef" />
          </NordCard>
        </div>
      </div>


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
      <div class="hidden lg:flex justify-center pb-8">
        <NordButton variant="danger" size="lg" @click="handleEndClick">
          End Session
        </NordButton>
      </div>
    </template>

    <!-- End Session Confirmation Modal -->
    <NordModal :open="showEndConfirm" title="End Session?" @close="handleCancelEnd">
      <p class="text-text-muted mb-4">
        Are you sure you want to end this practice session? Your session data will be saved.
      </p>
      <div class="flex justify-end gap-3">
        <NordButton variant="ghost" @click="handleCancelEnd">Cancel</NordButton>
        <NordButton variant="danger" @click="handleConfirmEnd">End Session</NordButton>
      </div>
    </NordModal>

    <!-- Session Recovery Modal -->
    <NordModal :open="showRecovery" title="Resume Previous Session?" @close="handleRecoveryDiscard">
      <p class="text-text-muted mb-4">
        You have an unfinished practice session. Would you like to resume where you left off?
      </p>
      <div class="flex justify-end gap-3">
        <NordButton variant="ghost" @click="handleRecoveryDiscard">Discard</NordButton>
        <NordButton variant="primary" @click="handleRecoveryResume">Resume</NordButton>
      </div>
    </NordModal>
  </div>
</template>
