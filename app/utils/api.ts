/**
 * API utility with error handling
 * Wraps $fetch with standardized error handling and toast notifications
 */

import type { FetchOptions as OfetchOptions } from 'ofetch'

interface FetchOptions extends Omit<OfetchOptions, 'onResponse' | 'onRequest' | 'onResponseError'> {
  /**
   * Whether to show error toast on failure (default: true)
   */
  showError?: boolean
  /**
   * Custom error message to show instead of the server response
   */
  errorMessage?: string
  /**
   * Whether to suppress errors completely (no toast, no console error)
   */
  suppressError?: boolean
  /**
   * Success message to show on successful response
   */
  successMessage?: string
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'data' in error) {
    const apiError = error as { data?: { message?: string } | string }
    if (apiError.data) {
      if (typeof apiError.data === 'string') {
        return apiError.data
      }
      if (apiError.data.message) {
        return apiError.data.message
      }
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }

  return 'An unexpected error occurred'
}

/**
 * Custom $fetch wrapper with error handling
 */
export async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    showError = true,
    errorMessage,
    suppressError = false,
    successMessage,
    method,
    ...fetchOptions
  } = options

  try {
    const result = await $fetch<T>(url, { ...fetchOptions, method } as typeof fetchOptions)

    // Show success message if provided
    if (successMessage) {
      const { showSuccess } = useToast()
      showSuccess(successMessage)
    }

    return result as T
  } catch (error) {
    // Don't show error if suppressed
    if (suppressError) {
      throw error
    }

    const { showError: showToastError } = useToast()
    const message = errorMessage || extractErrorMessage(error)

    // Show error toast
    if (showError) {
      showToastError(message)
    }

    // Log error for debugging
    if (!suppressError) {
      console.error(`API Error [${url}]:`, error)
    }

    throw error
  }
}

/**
 * GET request with error handling
 */
export function apiGet<T>(url: string, options: FetchOptions = {}): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'GET' })
}

/**
 * POST request with error handling
 */
export function apiPost<T>(url: string, body?: Record<string, unknown>, options: FetchOptions = {}): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'POST', body })
}

/**
 * PUT request with error handling
 */
export function apiPut<T>(url: string, body?: Record<string, unknown>, options: FetchOptions = {}): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'PUT', body })
}

/**
 * DELETE request with error handling
 */
export function apiDelete<T>(url: string, options: FetchOptions = {}): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' })
}
