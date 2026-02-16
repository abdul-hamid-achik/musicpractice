import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMusicTheory } from '~/composables/useMusicTheory'

export const useTheoryStore = defineStore('theory', () => {
  const { getScaleNotes, getChordNotes } = useMusicTheory()

  const selectedRoot = ref('C')
  const selectedScale = ref<any | null>(null)
  const selectedChord = ref<any | null>(null)
  const scales = ref<any[]>([])
  const chords = ref<any[]>([])

  const currentScaleNotes = computed(() => {
    if (!selectedScale.value) return []
    return getScaleNotes(selectedRoot.value, selectedScale.value.intervals)
  })

  const currentChordNotes = computed(() => {
    if (!selectedChord.value) return []
    return getChordNotes(selectedRoot.value, selectedChord.value.intervals)
  })

  const fetchScales = async () => {
    scales.value = await $fetch('/api/scales')
  }

  const fetchChords = async () => {
    chords.value = await $fetch('/api/chords')
  }

  const setRoot = (note: string) => {
    selectedRoot.value = note
  }

  const setScale = (scale: any) => {
    selectedScale.value = scale
  }

  const setChord = (chord: any) => {
    selectedChord.value = chord
  }

  return {
    selectedRoot,
    selectedScale,
    selectedChord,
    scales,
    chords,
    currentScaleNotes,
    currentChordNotes,
    fetchScales,
    fetchChords,
    setRoot,
    setScale,
    setChord,
  }
})
