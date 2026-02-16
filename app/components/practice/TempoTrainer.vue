<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    startBpm?: number
    targetBpm?: number
    incrementBpm?: number
    intervalSeconds?: number
  }>(),
  {
    startBpm: 60,
    targetBpm: 120,
    incrementBpm: 5,
    intervalSeconds: 30,
  },
)

const emit = defineEmits<{
  tempoChange: [bpm: number]
}>()

const currentBpm = ref(props.startBpm)
const isRunning = ref(false)
const countdown = ref(props.intervalSeconds)
let timer: ReturnType<typeof setInterval> | null = null

const progress = computed(() => {
  const range = props.targetBpm - props.startBpm
  if (range <= 0) return 100
  const current = currentBpm.value - props.startBpm
  return Math.min(100, Math.round((current / range) * 100))
})

const isComplete = computed(() => currentBpm.value >= props.targetBpm)

function startTraining() {
  if (isComplete.value) {
    currentBpm.value = props.startBpm
    countdown.value = props.intervalSeconds
  }
  isRunning.value = true
  countdown.value = props.intervalSeconds

  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      incrementTempo()
    }
  }, 1000)
}

function stopTraining() {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function incrementTempo() {
  const newBpm = Math.min(currentBpm.value + props.incrementBpm, props.targetBpm)
  currentBpm.value = newBpm
  countdown.value = props.intervalSeconds
  emit('tempoChange', newBpm)

  if (newBpm >= props.targetBpm) {
    stopTraining()
  }
}

function reset() {
  stopTraining()
  currentBpm.value = props.startBpm
  countdown.value = props.intervalSeconds
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- BPM range display -->
    <div class="flex justify-between text-sm text-text-muted">
      <span>{{ startBpm }} BPM</span>
      <span>{{ targetBpm }} BPM</span>
    </div>

    <!-- Progress bar -->
    <div class="w-full bg-surface-alt rounded-full h-3 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="isComplete ? 'bg-success' : 'bg-primary'"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <!-- Current BPM -->
    <div class="text-center">
      <div class="text-4xl font-bold font-mono text-text">
        {{ currentBpm }}
      </div>
      <div class="text-sm text-text-muted mt-1">Current BPM</div>
      <div class="text-xs text-text-muted mt-0.5">{{ progress }}% complete</div>
    </div>

    <!-- Countdown -->
    <div v-if="isRunning && !isComplete" class="text-center">
      <div class="text-2xl font-mono text-primary">{{ countdown }}s</div>
      <div class="text-xs text-text-muted">
        until +{{ incrementBpm }} BPM
      </div>
    </div>

    <!-- Completed message -->
    <div v-if="isComplete" class="text-center text-success text-sm font-medium">
      Target tempo reached!
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-3">
      <button
        v-if="!isRunning"
        class="px-6 py-2.5 rounded-lg font-semibold transition-colors"
        :class="
          isComplete
            ? 'bg-primary text-nord0 hover:brightness-110'
            : 'bg-success text-nord0 hover:brightness-110'
        "
        @click="startTraining"
      >
        {{ isComplete ? 'Restart' : 'Start' }}
      </button>
      <button
        v-else
        class="px-6 py-2.5 rounded-lg font-semibold bg-error text-white hover:brightness-110 transition-colors"
        @click="stopTraining"
      >
        Stop
      </button>
      <button
        class="px-6 py-2.5 rounded-lg font-semibold bg-surface-alt text-text-muted hover:bg-border transition-colors"
        @click="reset"
      >
        Reset
      </button>
    </div>
  </div>
</template>
