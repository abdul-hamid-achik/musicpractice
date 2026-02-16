import { ref } from 'vue'

async function getContext() {
  const Tone = await import('tone')
  return Tone.getContext()
}

export function useAudio() {
  const isReady = ref(false)

  const start = async () => {
    const Tone = await import('tone')
    await Tone.start()
    isReady.value = true
  }

  return { isReady, start, getContext }
}
