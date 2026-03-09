import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function showToast(message: string, type: Toast['type'] = 'info', duration?: number) {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)

    // Auto-dismiss after duration
    const timeout = duration || 3000
    setTimeout(() => {
      removeToast(id)
    }, timeout)

    return id
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function showSuccess(message: string, duration?: number) {
    return showToast(message, 'success', duration)
  }

  function showError(message: string, duration?: number) {
    return showToast(message, 'error', duration)
  }

  function showInfo(message: string, duration?: number) {
    return showToast(message, 'info', duration)
  }

  function showWarning(message: string, duration?: number) {
    return showToast(message, 'warning', duration)
  }

  function clearAll() {
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll,
  }
})
