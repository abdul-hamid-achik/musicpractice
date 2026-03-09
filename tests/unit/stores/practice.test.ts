import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { usePracticeStore } from '~/stores/practice'

// Mock $fetch globally (Nuxt's fetch utility)
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock useToastStore for toast notifications
const mockToastStore = {
  toasts: ref([]),
  showToast: vi.fn(),
  removeToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
}
vi.stubGlobal('useToastStore', () => mockToastStore)

describe('practice store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  it('has correct initial state', () => {
    const store = usePracticeStore()
    expect(store.sessions).toEqual([])
    expect(store.currentSession).toBeNull()
    expect(store.isLoading).toBe(false)
  })

  it('fetchSessions populates sessions', async () => {
    const mockSessions = [
      { id: '1', startedAt: new Date().toISOString(), durationSeconds: 1800 },
      { id: '2', startedAt: new Date().toISOString(), durationSeconds: 3600 },
    ]
    // Mock returns { data: sessions[], total: number } as expected by the store
    mockFetch.mockResolvedValueOnce({ data: mockSessions, total: 2 })

    const store = usePracticeStore()
    await store.fetchSessions()

    expect(store.sessions).toEqual(mockSessions)
    expect(store.isLoading).toBe(false)
  })

  it('totalPracticeTime sums all session durations', async () => {
    const mockSessions = [
      { id: '1', startedAt: new Date().toISOString(), durationSeconds: 1800 },
      { id: '2', startedAt: new Date().toISOString(), durationSeconds: 3600 },
    ]
    // Mock returns { data: sessions[], total: number } as expected by the store
    mockFetch.mockResolvedValueOnce({ data: mockSessions, total: 2 })

    const store = usePracticeStore()
    await store.fetchSessions()

    expect(store.totalPracticeTime).toBe(5400)
  })

  it('sessionsThisWeek filters correctly', async () => {
    const now = new Date()
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const mockSessions = [
      { id: '1', startedAt: now.toISOString(), durationSeconds: 1800 },
      { id: '2', startedAt: twoWeeksAgo.toISOString(), durationSeconds: 3600 },
    ]
    // Mock returns { data: sessions[], total: number } as expected by the store
    mockFetch.mockResolvedValueOnce({ data: mockSessions, total: 2 })

    const store = usePracticeStore()
    await store.fetchSessions()

    expect(store.sessionsThisWeek).toHaveLength(1)
    expect(store.sessionsThisWeek[0].id).toBe('1')
  })

  it('recentSessions returns sorted by date', async () => {
    const older = new Date('2025-01-01')
    const newer = new Date('2025-06-01')

    const mockSessions = [
      { id: '1', startedAt: older.toISOString(), durationSeconds: 1800 },
      { id: '2', startedAt: newer.toISOString(), durationSeconds: 3600 },
    ]
    // Mock returns { data: sessions[], total: number } as expected by the store
    mockFetch.mockResolvedValueOnce({ data: mockSessions, total: 2 })

    const store = usePracticeStore()
    await store.fetchSessions()

    expect(store.recentSessions[0].id).toBe('2')
  })

  it('createSession adds to sessions array', async () => {
    const newSession = { id: '3', startedAt: new Date().toISOString(), durationSeconds: 900 }
    mockFetch.mockResolvedValueOnce(newSession)

    const store = usePracticeStore()
    const result = await store.createSession({ instrumentId: 'abc', startedAt: new Date().toISOString() })

    expect(store.sessions).toContainEqual(newSession)
    expect(result).toEqual(newSession)
  })
})
