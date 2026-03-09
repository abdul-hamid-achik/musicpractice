<script setup lang="ts">
const settingsStore = useSettingsStore()

// Simulate loading state for settings (they load from localStorage)
const isLoading = ref(true)

onMounted(() => {
  // Settings are loaded synchronously from localStorage, but we show a brief skeleton
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-text">App Settings</h1>
      <NuxtLink
        to="/account"
        class="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
      >
        Account Settings →
      </NuxtLink>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="isLoading" class="max-w-2xl space-y-6" aria-busy="true" aria-label="Loading settings...">
      <SkeletonCard variant="card" height="100px" />
      <SkeletonCard variant="card" height="120px" />
      <SkeletonCard variant="card" height="100px" />
      <SkeletonCard variant="card" height="140px" />
      <SkeletonCard variant="card" height="100px" />
    </div>

    <!-- Loaded Settings -->
    <div v-else class="max-w-2xl space-y-6">
      <!-- Theme -->
      <NordCard title="Theme">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <span class="text-text">Dark Mode</span>
            <p class="text-xs text-text-muted mt-0.5">Toggle between dark and light appearance</p>
          </div>
          <div class="relative">
            <input
              type="checkbox"
              :checked="settingsStore.theme === 'dark'"
              class="sr-only peer"
              @change="settingsStore.updateSetting('theme', settingsStore.theme === 'dark' ? 'light' : 'dark')"
            />
            <div class="w-11 h-6 bg-surface-alt rounded-full peer peer-checked:bg-primary transition-colors" />
            <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </NordCard>

      <!-- Instrument -->
      <NordCard title="Instrument">
        <div>
          <label class="block text-sm text-text-muted mb-2">Default Instrument</label>
          <select
            :value="settingsStore.defaultInstrument"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            @change="(e) => settingsStore.updateSetting('defaultInstrument', (e.target as HTMLSelectElement).value)"
          >
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
            <option value="piano">Piano</option>
            <option value="violin">Violin</option>
          </select>
        </div>
      </NordCard>

      <!-- Metronome -->
      <NordCard title="Metronome">
        <div>
          <label class="block text-sm text-text-muted mb-2">
            Default Tempo: <span class="text-primary font-medium">{{ settingsStore.defaultTempo }} BPM</span>
          </label>
          <input
            type="range"
            :value="settingsStore.defaultTempo"
            min="30"
            max="300"
            step="1"
            class="w-full accent-primary"
            @input="(e) => settingsStore.updateSetting('defaultTempo', parseInt((e.target as HTMLInputElement).value))"
          />
          <div class="flex justify-between text-xs text-text-muted mt-1">
            <span>30</span>
            <span>300</span>
          </div>
        </div>
      </NordCard>

      <!-- Display -->
      <NordCard title="Display">
        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-text">Show Notation</span>
            <div class="relative">
              <input
                type="checkbox"
                :checked="settingsStore.showNotation"
                class="sr-only peer"
                @change="settingsStore.updateSetting('showNotation', !settingsStore.showNotation)"
              />
              <div class="w-11 h-6 bg-surface-alt rounded-full peer peer-checked:bg-primary transition-colors" />
              <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-text">Show Tablature</span>
            <div class="relative">
              <input
                type="checkbox"
                :checked="settingsStore.showTablature"
                class="sr-only peer"
                @change="settingsStore.updateSetting('showTablature', !settingsStore.showTablature)"
              />
              <div class="w-11 h-6 bg-surface-alt rounded-full peer peer-checked:bg-primary transition-colors" />
              <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </NordCard>

      <!-- Audio -->
      <NordCard title="Audio">
        <div>
          <label class="block text-sm text-text-muted mb-2">
            Volume: <span class="text-primary font-medium">{{ settingsStore.volume }}%</span>
          </label>
          <input
            :value="settingsStore.volume"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
            @input="(e) => settingsStore.updateSetting('volume', parseInt((e.target as HTMLInputElement).value))"
          />
          <div class="flex justify-between text-xs text-text-muted mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </NordCard>
    </div>
  </div>
</template>