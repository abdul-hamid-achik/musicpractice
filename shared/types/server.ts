/**
 * Stored practice session for recovery
 */
export interface StoredPracticeSession {
  instrumentId: string
  songId?: string | null
  tempoBpm: number
  startedAt: string
  elapsed: number
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  limit?: number
}

/**
 * Error response from API
 */
export interface ApiError {
  statusCode: number
  message: string
  data?: unknown
}
