import { ref } from 'vue'

export function useAudio() {
  const isReady = ref(false)

  const start = async () => {
    const Tone = await import('tone')
    await Tone.start()
    isReady.value = true
  }

  const getContext = async () => {
    const Tone = await import('tone')
    return Tone.getContext()
  }

  return { isReady, start, getContext }
}
