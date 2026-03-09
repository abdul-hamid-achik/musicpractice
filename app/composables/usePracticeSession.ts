import { ref, onBeforeUnmount } from 'vue'

const SESSION_STORAGE_KEY = 'musicpractice-active-session'
const PERSIST_DELAY_MS = 5000 // Debounce delay for localStorage writes
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours - sessions older than this are considered stale

/**
 * Formats seconds into HH:MM:SS format
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

/**
 * Formats a duration in milliseconds to a human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

/**
 * Checks if a date is from the current day
 */
function isFromCurrentDay(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

/**
 * Creates a debounced function that delays execution until after wait milliseconds
 * The last call's arguments are used when the function finally executes
 */
function createDebounceFn<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): { debouncedFn: T; cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let isPending = false

  const debouncedFn = ((...args: Parameters<T>) => {
    lastArgs = args
    isPending = true

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs)
        lastArgs = null
        isPending = false
      }
      timeoutId = null
    }, delayMs)
  }) as T

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
    isPending = false
  }

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (lastArgs && isPending) {
      fn(...lastArgs)
      lastArgs = null
      isPending = false
    }
  }

  return { debouncedFn, cancel, flush }
}

interface StoredSession {
  instrumentId: string
  songId?: string
  tempoBpm?: number
  startedAt: string
  accumulatedSeconds: number
  isPaused: boolean
  lastPersistedAt: string // Timestamp for detecting stale sessions
}

interface SessionRecoveryInfo {
  session: StoredSession
  age: string
  isStale: boolean
  isFromCurrentDay: boolean
}

export function usePracticeSession() {
  const isActive = ref(false)
  const isPaused = ref(false)
  const startTime = ref<Date | null>(null)
  const elapsed = ref(0)
  const currentSession = ref<{ instrumentId: string; songId?: string; tempoBpm?: number } | null>(null)

  // Track previous values to detect changes
  let previousElapsed = 0
  let previousIsPaused = false

  let timer: ReturnType<typeof setInterval> | null = null
  let accumulatedSeconds = 0
  let resumeTime: number | null = null

  // Storage error state
  const storageError = ref<string | null>(null)

  /**
   * Safely writes to localStorage with error handling
   * Handles quota exceeded, private browsing, and other storage failures
   */
  const safeSetStorage = (key: string, value: string): boolean => {
    if (!import.meta.client) return false

    try {
      localStorage.setItem(key, value)
      storageError.value = null
      return true
    } catch (error) {
      // Handle specific localStorage errors
      if (error instanceof DOMException) {
        if (error.name === 'QuotaExceededError') {
          storageError.value = 'Storage quota exceeded. Please save your session or clear old data.'
          console.error('[usePracticeSession] localStorage quota exceeded')
        } else if (error.name === 'SecurityError' || error.name === 'InvalidAccessError') {
          // Private browsing mode or disabled storage
          storageError.value = 'Storage is unavailable (private browsing or disabled).'
          console.warn('[usePracticeSession] localStorage unavailable (private browsing or disabled)')
        } else {
          storageError.value = `Storage error: ${error.message}`
          console.error('[usePracticeSession] localStorage error:', error)
        }
      } else {
        storageError.value = 'An unexpected storage error occurred.'
        console.error('[usePracticeSession] unexpected storage error:', error)
      }
      return false
    }
  }

  /**
   * Safely reads from localStorage with error handling
   */
  const safeGetStorage = (key: string): string | null => {
    if (!import.meta.client) return null

    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('[usePracticeSession] Failed to read from localStorage:', error)
      storageError.value = 'Failed to read stored session data.'
      return null
    }
  }

  /**
   * Persists session data to localStorage with change detection
   * Only writes when elapsed time or pause state has changed
   */
  const persistToStorage = () => {
    if (!import.meta.client || !currentSession.value || !startTime.value) return

    // Only persist if values have actually changed
    if (elapsed.value === previousElapsed && isPaused.value === previousIsPaused) {
      return
    }

    const data: StoredSession = {
      instrumentId: currentSession.value.instrumentId,
      songId: currentSession.value.songId,
      tempoBpm: currentSession.value.tempoBpm,
      startedAt: startTime.value.toISOString(),
      accumulatedSeconds: elapsed.value,
      isPaused: isPaused.value,
      lastPersistedAt: new Date().toISOString(), // Add timestamp for stale session detection
    }

    const success = safeSetStorage(SESSION_STORAGE_KEY, JSON.stringify(data))
    if (success) {
      // Update previous values after successful write
      previousElapsed = elapsed.value
      previousIsPaused = isPaused.value
    }
  }

  // Create debounced version of persistToStorage (writes every 5 seconds max)
  const { debouncedFn: debouncedPersist, cancel: cancelDebouncedPersist, flush: flushDebouncedPersist } =
    createDebounceFn(persistToStorage, PERSIST_DELAY_MS)

  const clearStorage = () => {
    if (import.meta.client) {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY)
        storageError.value = null
      } catch (error) {
        console.warn('[usePracticeSession] Failed to clear storage:', error)
      }
    }
  }

  /**
   * Retrieves stored session with validation
   * Returns null if session is stale or from a previous day
   */
  const getStoredSession = (): StoredSession | null => {
    if (!import.meta.client) return null

    const raw = safeGetStorage(SESSION_STORAGE_KEY)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as StoredSession

      // Validate required fields
      if (!parsed.instrumentId || !parsed.startedAt) {
        console.warn('[usePracticeSession] Invalid stored session data')
        return null
      }

      return parsed
    } catch (error) {
      console.error('[usePracticeSession] Failed to parse stored session:', error)
      return null
    }
  }

  /**
   * Gets session recovery information including age and staleness
   */
  const getSessionRecoveryInfo = (): SessionRecoveryInfo | null => {
    const stored = getStoredSession()
    if (!stored) return null

    const startedAt = new Date(stored.startedAt)
    const lastPersistedAt = stored.lastPersistedAt ? new Date(stored.lastPersistedAt) : startedAt
    const now = new Date()

    // Calculate age based on last persistence time
    const ageMs = now.getTime() - lastPersistedAt.getTime()
    const age = formatDuration(ageMs)

    // Check if session is from current day
    const fromCurrentDay = isFromCurrentDay(startedAt)

    // Session is stale if older than max age
    const isStale = ageMs > SESSION_MAX_AGE_MS

    return {
      session: stored,
      age,
      isStale,
      isFromCurrentDay: fromCurrentDay,
    }
  }

  /**
   * Clears all stale sessions (older than 24 hours)
   * Returns true if a stale session was found and cleared
   */
  const clearStaleSessions = (): boolean => {
    const recoveryInfo = getSessionRecoveryInfo()
    if (recoveryInfo && recoveryInfo.isStale) {
      clearStorage()
      console.log('[usePracticeSession] Cleared stale session')
      return true
    }
    return false
  }

  const startTimer = () => {
    resumeTime = Date.now()
    timer = setInterval(() => {
      if (resumeTime !== null) {
        elapsed.value = accumulatedSeconds + Math.floor((Date.now() - resumeTime) / 1000)
        // Use debounced persist to avoid localStorage thrashing (writes every 5 seconds)
        debouncedPersist()
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const startSession = (instrumentId: string, tempoBpm?: number, songId?: string) => {
    startTime.value = new Date()
    currentSession.value = { instrumentId, songId, tempoBpm }
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
    // Flush debounced persist immediately on pause to ensure state is saved
    flushDebouncedPersist()
  }

  const resumeSession = () => {
    if (!isActive.value || !isPaused.value) return
    isPaused.value = false
    startTimer()
  }

  const stopSession = () => {
    stopTimer()
    // Cancel any pending debounced writes since we're stopping
    cancelDebouncedPersist()
    resumeTime = null
    accumulatedSeconds = 0
    isActive.value = false
    isPaused.value = false
  }

  const restoreSession = (stored: StoredSession) => {
    startTime.value = new Date(stored.startedAt)
    currentSession.value = { instrumentId: stored.instrumentId, songId: stored.songId, tempoBpm: stored.tempoBpm }
    isActive.value = true
    accumulatedSeconds = stored.accumulatedSeconds
    elapsed.value = stored.accumulatedSeconds
    // Reset previous values to match restored state
    previousElapsed = stored.accumulatedSeconds
    previousIsPaused = stored.isPaused

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
      songId: currentSession.value.songId || null,
      startedAt: startTime.value.toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: elapsed.value,
      tempoBpm: currentSession.value.tempoBpm,
      notes: notes || null,
      tags: tags || [],
    }
    const result = await $fetch('/api/sessions', { method: 'POST', body })
    // Cancel any pending debounced writes and clear storage after successful save
    cancelDebouncedPersist()
    stopSession()
    clearStorage()
    currentSession.value = null
    startTime.value = null
    elapsed.value = 0
    return result
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isActive.value) {
      // Flush any pending debounced writes before unload
      flushDebouncedPersist()
      e.preventDefault()
    }
  }

  if (import.meta.client) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  onBeforeUnmount(() => {
    // Flush any pending debounced writes before unmounting to ensure last state is saved
    if (isActive.value) {
      flushDebouncedPersist()
    }
    stopTimer()
    cancelDebouncedPersist()
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
    storageError,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    saveSession,
    restoreSession,
    getStoredSession,
    getSessionRecoveryInfo,
    clearStaleSessions,
    clearStorage,
    formatTime,
    formatDuration,
    isFromCurrentDay,
  }
}
