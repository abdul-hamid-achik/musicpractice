<script setup lang="ts">
const settingsStore = useSettingsStore()

const volume = ref(80)
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-8">Settings</h1>

    <div class="max-w-2xl space-y-6">
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
            Volume: <span class="text-primary font-medium">{{ volume }}%</span>
          </label>
          <input
            v-model.number="volume"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
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
