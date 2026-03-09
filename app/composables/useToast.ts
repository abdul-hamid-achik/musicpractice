/**
 * Toast notification composable
 * Provides convenient methods for showing toast notifications
 */

export function useToast() {
  const store = useToastStore()

  /**
   * Show a toast notification
   * @param message - The message to display
   * @param type - The type of toast: 'success', 'error', 'warning', 'info'
   * @param duration - Optional duration in milliseconds (default: 3000)
   * @returns The toast ID
   */
  function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number) {
    return store.showToast(message, type, duration)
  }

  /**
   * Show a success toast
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  function showSuccess(message: string, duration?: number) {
    return store.showSuccess(message, duration)
  }

  /**
   * Show an error toast
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  function showError(message: string, duration?: number) {
    return store.showError(message, duration)
  }

  /**
   * Show an info toast
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  function showInfo(message: string, duration?: number) {
    return store.showInfo(message, duration)
  }

  /**
   * Show a warning toast
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds (default: 3000)
   */
  function showWarning(message: string, duration?: number) {
    return store.showWarning(message, duration)
  }

  /**
   * Remove a toast by ID
   * @param id - The toast ID to remove
   */
  function removeToast(id: string) {
    store.removeToast(id)
  }

  /**
   * Clear all toasts
   */
  function clearAll() {
    store.clearAll()
  }

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
    clearAll,
  }
}
