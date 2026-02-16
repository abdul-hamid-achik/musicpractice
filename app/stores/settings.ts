import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'musicpractice-settings'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('dark')
  const defaultInstrument = ref('guitar')
  const defaultTempo = ref(120)
  const showNotation = ref(true)
  const showTablature = ref(true)

  // Load saved settings from localStorage on init
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.theme) theme.value = parsed.theme
        if (parsed.defaultInstrument) defaultInstrument.value = parsed.defaultInstrument
        if (parsed.defaultTempo) defaultTempo.value = parsed.defaultTempo
        if (parsed.showNotation !== undefined) showNotation.value = parsed.showNotation
        if (parsed.showTablature !== undefined) showTablature.value = parsed.showTablature
      }
    } catch {
      // Ignore parse errors
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: theme.value,
        defaultInstrument: defaultInstrument.value,
        defaultTempo: defaultTempo.value,
        showNotation: showNotation.value,
        showTablature: showTablature.value,
      }),
    )
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const refs: Record<string, any> = {
      theme,
      defaultInstrument,
      defaultTempo,
      showNotation,
      showTablature,
    }
    if (refs[key]) {
      refs[key].value = value
      persist()
    }
  }

  // Auto-persist on any change
  watch([theme, defaultInstrument, defaultTempo, showNotation, showTablature], persist)

  return {
    theme,
    defaultInstrument,
    defaultTempo,
    showNotation,
    showTablature,
    updateSetting,
  }
})

interface Settings {
  theme: string
  defaultInstrument: string
  defaultTempo: number
  showNotation: boolean
  showTablature: boolean
}
