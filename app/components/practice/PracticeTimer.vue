<script setup lang="ts">
const { isActive, elapsed, currentSession, startSession, stopSession, saveSession, formatTime } =
  usePracticeSession()

const instrumentStore = useInstrumentStore()

const instrumentId = ref('')
const tempoBpm = ref<number | undefined>(undefined)
const sessionNotes = ref('')

const instrumentName = computed(() => {
  if (!currentSession.value) return ''
  const instrument = instrumentStore.instruments.find(
    (i) => i.id === currentSession.value!.instrumentId,
  )
  return instrument?.name || ''
})

function handleStart() {
  if (!instrumentId.value) return
  startSession(instrumentId.value, tempoBpm.value)
}

async function handleStop() {
  await saveSession(sessionNotes.value || undefined)
  sessionNotes.value = ''
}

function handlePause() {
  stopSession()
}

onMounted(() => {
  if (instrumentStore.instruments.length === 0) {
    instrumentStore.fetchInstruments()
  }
})
</script>

<template>
  <div class="bg-card border border-border rounded-lg p-6">
    <!-- Timer display -->
    <div class="text-center mb-6">
      <div class="text-5xl font-mono font-bold text-text tracking-wider">
        {{ formatTime(elapsed) }}
      </div>
      <div v-if="isActive && instrumentName" class="mt-2 text-text-muted text-sm">
        <span>{{ instrumentName }}</span>
        <span v-if="currentSession?.tempoBpm" class="ml-2">
          @ {{ currentSession.tempoBpm }} BPM
        </span>
      </div>
    </div>

    <!-- Pre-session setup -->
    <div v-if="!isActive" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm text-text-muted">Instrument</label>
        <select
          v-model="instrumentId"
          class="bg-surface-alt border border-border rounded-md px-3 py-2 text-text"
        >
          <option value="" disabled>Select instrument</option>
          <option
            v-for="inst in instrumentStore.instruments"
            :key="inst.id"
            :value="inst.id"
          >
            {{ inst.name }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-text-muted">Tempo (optional)</label>
        <input
          v-model.number="tempoBpm"
          type="number"
          min="30"
          max="300"
          placeholder="BPM"
          class="bg-surface-alt border border-border rounded-md px-3 py-2 text-text"
        />
      </div>

      <button
        class="px-6 py-3 rounded-lg font-semibold transition-colors"
        :class="
          instrumentId
            ? 'bg-success text-nord0 hover:brightness-110'
            : 'bg-surface-alt text-text-muted cursor-not-allowed'
        "
        :disabled="!instrumentId"
        @click="handleStart"
      >
        Start Practice
      </button>
    </div>

    <!-- Active session controls -->
    <div v-else class="flex flex-col gap-4">
      <textarea
        v-model="sessionNotes"
        placeholder="Practice notes..."
        rows="2"
        class="bg-surface-alt border border-border rounded-md px-3 py-2 text-text text-sm resize-none"
      />

      <div class="flex gap-3 justify-center">
        <button
          class="px-6 py-3 rounded-lg font-semibold bg-warning text-nord0 hover:brightness-110 transition-colors"
          @click="handlePause"
        >
          Pause
        </button>
        <button
          class="px-6 py-3 rounded-lg font-semibold bg-error text-white hover:brightness-110 transition-colors"
          @click="handleStop"
        >
          Stop &amp; Save
        </button>
      </div>
    </div>
  </div>
</template>
