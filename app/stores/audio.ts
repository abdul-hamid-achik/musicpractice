import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAudio } from '~/composables/useAudio'

export const useAudioStore = defineStore('audio', () => {
  const { start } = useAudio()

  const isAudioReady = ref(false)
  const masterVolume = ref(80)
  const isMuted = ref(false)

  const initAudio = async () => {
    await start()
    isAudioReady.value = true
  }

  const setVolume = (vol: number) => {
    masterVolume.value = Math.max(0, Math.min(100, vol))
  }

  const toggleMute = () => {
    isMuted.value = !isMuted.value
  }

  return {
    isAudioReady,
    masterVolume,
    isMuted,
    initAudio,
    setVolume,
    toggleMute,
  }
})
