import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Instrument } from '#shared/types/instrument'

export const useInstrumentStore = defineStore('instrument', () => {
  const instruments = ref<Instrument[]>([])
  const activeInstrument = ref<Instrument | null>(null)
  const activeInstrumentId = ref('')

  const currentTuning = computed(() => {
    if (!activeInstrument.value) return null
    return activeInstrument.value.tuning
  })

  const instrumentsByType = computed(() => {
    const grouped: Record<string, Instrument[]> = {}
    for (const inst of instruments.value) {
      if (!grouped[inst.type]) grouped[inst.type] = []
      grouped[inst.type]!.push(inst)
    }
    return grouped
  })

  const fetchInstruments = async () => {
    instruments.value = await $fetch('/api/instruments')
  }

  const setActiveInstrument = (id: string) => {
    activeInstrumentId.value = id
    activeInstrument.value = instruments.value.find((i) => i.id === id) || null
  }

  return {
    instruments,
    activeInstrument,
    activeInstrumentId,
    currentTuning,
    instrumentsByType,
    fetchInstruments,
    setActiveInstrument,
  }
})
