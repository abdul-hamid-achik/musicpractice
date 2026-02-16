<script setup lang="ts">
const props = defineProps<{
  alphaTex?: string
  fileData?: ArrayBuffer
}>()

const containerRef = ref<HTMLElement | null>(null)
const { api, isLoaded, isPlaying, loadAlphaTex, loadFile, play, stop, setTempo } =
  useAlphaTab(containerRef)

const tempoMultiplier = ref(100)

function handleTempoChange() {
  setTempo(tempoMultiplier.value)
}

function formatTempo(value: number): string {
  return `${(value / 100).toFixed(2)}x`
}

// Watch both the API readiness and the prop to handle initial load
watch(
  [api, () => props.alphaTex],
  ([apiVal, tex]) => {
    if (apiVal && tex) loadAlphaTex(tex)
  },
  { immediate: true },
)

watch(
  [api, () => props.fileData],
  ([apiVal, data]) => {
    if (apiVal && data) loadFile(data as any)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Controls -->
    <div class="flex items-center gap-3 bg-surface-alt rounded-lg px-4 py-2">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
        :class="isPlaying ? 'bg-warning text-on-warning' : 'bg-primary text-on-primary'"
        :disabled="!isLoaded"
        @click="play()"
      >
        <svg
          v-if="!isPlaying"
          class="w-5 h-5 ml-0.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      </button>

      <button
        class="flex items-center justify-center w-10 h-10 rounded-full bg-card text-text-muted hover:bg-border transition-colors"
        :disabled="!isLoaded"
        @click="stop()"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h12v12H6z" />
        </svg>
      </button>

      <div class="flex items-center gap-2 ml-4 flex-1">
        <span class="text-sm text-text-muted whitespace-nowrap">Tempo:</span>
        <input
          v-model.number="tempoMultiplier"
          type="range"
          min="25"
          max="200"
          step="5"
          class="flex-1 accent-primary"
          @input="handleTempoChange"
        />
        <span class="text-sm text-text font-mono w-14 text-right">
          {{ formatTempo(tempoMultiplier) }}
        </span>
      </div>
    </div>

    <!-- AlphaTab container -->
    <div class="relative rounded-lg overflow-hidden bg-card border border-border min-h-[200px]">
      <!-- Loading spinner -->
      <div
        v-if="!isLoaded"
        class="absolute inset-0 flex items-center justify-center bg-card/80 z-10"
      >
        <svg
          class="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      <div ref="containerRef" class="alphatab-container" />
    </div>
  </div>
</template>

<style scoped>
.alphatab-container {
  width: 100%;
  min-height: 200px;
}

.alphatab-container :deep(.at-cursor-bar) {
  background-color: rgba(136, 192, 208, 0.15);
}

.alphatab-container :deep(.at-cursor-beat) {
  background-color: rgba(136, 192, 208, 0.6);
}
</style>
