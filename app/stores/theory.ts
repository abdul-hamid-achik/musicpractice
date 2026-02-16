import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMusicTheory } from '~/composables/useMusicTheory'
import type { Scale, Chord } from '#shared/types/music-theory'

export const useTheoryStore = defineStore('theory', () => {
  const { getScaleNotes, getChordNotes } = useMusicTheory()

  const selectedRoot = ref('C')
  const selectedScale = ref<Scale | null>(null)
  const selectedChord = ref<Chord | null>(null)
  const scales = ref<Scale[]>([])
  const chords = ref<Chord[]>([])

  const currentScaleNotes = computed(() => {
    if (!selectedScale.value) return []
    return getScaleNotes(selectedRoot.value, selectedScale.value.intervals)
  })

  const currentChordNotes = computed(() => {
    if (!selectedChord.value) return []
    return getChordNotes(selectedRoot.value, selectedChord.value.intervals)
  })

  const fetchScales = async () => {
    const res = await $fetch<{ data: Scale[] }>('/api/scales')
    scales.value = res.data
  }

  const fetchChords = async () => {
    const res = await $fetch<{ data: Chord[] }>('/api/chords')
    chords.value = res.data
  }

  const setRoot = (note: string) => {
    selectedRoot.value = note
  }

  const setScale = (scale: Scale) => {
    selectedScale.value = scale
  }

  const setChord = (chord: Chord) => {
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
