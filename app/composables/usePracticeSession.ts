import { ref, onBeforeUnmount } from 'vue'

const SESSION_STORAGE_KEY = 'musicpractice-active-session'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

interface StoredSession {
  instrumentId: string
  tempoBpm?: number
  startedAt: string
  accumulatedSeconds: number
  isPaused: boolean
}

export function usePracticeSession() {
  const isActive = ref(false)
  const isPaused = ref(false)
  const startTime = ref<Date | null>(null)
  const elapsed = ref(0)
  const currentSession = ref<{ instrumentId: string; tempoBpm?: number } | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null
  let accumulatedSeconds = 0
  let resumeTime: number | null = null

  const persistToStorage = () => {
    if (!import.meta.client || !currentSession.value || !startTime.value) return
    const data: StoredSession = {
      instrumentId: currentSession.value.instrumentId,
      tempoBpm: currentSession.value.tempoBpm,
      startedAt: startTime.value.toISOString(),
      accumulatedSeconds: elapsed.value,
      isPaused: isPaused.value,
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
  }

  const clearStorage = () => {
    if (import.meta.client) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  const getStoredSession = (): StoredSession | null => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as StoredSession
    } catch {
      return null
    }
  }

  const startTimer = () => {
    resumeTime = Date.now()
    timer = setInterval(() => {
      if (resumeTime !== null) {
        elapsed.value = accumulatedSeconds + Math.floor((Date.now() - resumeTime) / 1000)
        persistToStorage()
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const startSession = (instrumentId: string, tempoBpm?: number) => {
    startTime.value = new Date()
    currentSession.value = { instrumentId, tempoBpm }
    isActive.value = true
    isPaused.value = false
    elapsed.value = 0
    accumulatedSeconds = 0
    startTimer()
  }

  const pauseSession = () => {
    if (!isActive.value || isPaused.value) return
    accumulatedSeconds = elapsed.value
    stopTimer()
    resumeTime = null
    isPaused.value = true
    persistToStorage()
  }

  const resumeSession = () => {
    if (!isActive.value || !isPaused.value) return
    isPaused.value = false
    startTimer()
  }

  const stopSession = () => {
    stopTimer()
    resumeTime = null
    accumulatedSeconds = 0
    isActive.value = false
    isPaused.value = false
  }

  const restoreSession = (stored: StoredSession) => {
    startTime.value = new Date(stored.startedAt)
    currentSession.value = { instrumentId: stored.instrumentId, tempoBpm: stored.tempoBpm }
    isActive.value = true
    accumulatedSeconds = stored.accumulatedSeconds
    elapsed.value = stored.accumulatedSeconds
    if (stored.isPaused) {
      isPaused.value = true
    } else {
      isPaused.value = false
      startTimer()
    }
  }

  const saveSession = async (notes?: string, tags?: string[]) => {
    if (!currentSession.value || !startTime.value) return null
    const body = {
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
    clearStorage()
    currentSession.value = null
    startTime.value = null
    elapsed.value = 0
    return result
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isActive.value) {
      e.preventDefault()
    }
  }

  if (import.meta.client) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  onBeforeUnmount(() => {
    stopTimer()
    if (import.meta.client) {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  return {
    isActive,
    isPaused,
    startTime,
    elapsed,
    currentSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    saveSession,
    restoreSession,
    getStoredSession,
    clearStorage,
    formatTime,
  }
}
