import { ref, onBeforeUnmount } from 'vue'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

export function usePracticeSession() {
  const isActive = ref(false)
  const startTime = ref<Date | null>(null)
  const elapsed = ref(0)
  const currentSession = ref<{ instrumentId: string; tempoBpm?: number } | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  const startSession = (instrumentId: string, tempoBpm?: number) => {
    startTime.value = new Date()
    currentSession.value = { instrumentId, tempoBpm }
    isActive.value = true
    elapsed.value = 0
    timer = setInterval(() => {
      if (startTime.value) {
        elapsed.value = Math.floor((Date.now() - startTime.value.getTime()) / 1000)
      }
    }, 1000)
  }

  const stopSession = () => {
    if (timer) clearInterval(timer)
    timer = null
    isActive.value = false
  }

  const saveSession = async (notes?: string, tags?: string[]) => {
    if (!currentSession.value || !startTime.value) return null
    const body = {
      userId: 'demo-user-id', // TODO: get from auth
      instrumentId: currentSession.value.instrumentId,
      startedAt: startTime.value.toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: elapsed.value,
      tempoBpm: currentSession.value.tempoBpm,
      notes: notes || null,
      tags: tags || [],
    }
    const result = await $fetch('/api/sessions', { method: 'POST', body })
    stopSession()
    currentSession.value = null
    startTime.value = null
    elapsed.value = 0
    return result
  }

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { isActive, startTime, elapsed, currentSession, startSession, stopSession, saveSession, formatTime }
}
