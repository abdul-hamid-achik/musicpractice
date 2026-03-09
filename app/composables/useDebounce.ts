import type { Ref } from 'vue'

/**
 * Composable for creating debounced reactive values
 * Useful for search inputs to avoid excessive API calls
 */
export function useDebounce<T>(source: Ref<T>, delayMs: number = 300): Ref<T> {
  const debounced = ref<T>(source.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  watch(
    source,
    (newValue) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        debounced.value = newValue
        timeoutId = null
      }, delayMs)
    },
    { immediate: true },
  )

  // Clean up timeout on unmount
  if (import.meta.client) {
    onUnmounted(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    })
  }

  return debounced
}

/**
 * Composable for debounced search specifically
 * Returns both the immediate and debounced search values
 */
export function useDebounceSearch(delayMs: number = 300) {
  const searchQuery = ref('')
  const debouncedQuery = useDebounce(searchQuery, delayMs)

  /**
   * Clear the search query immediately
   */
  function clearSearch() {
    searchQuery.value = ''
    // Debounced will clear automatically via watch
  }

  return {
    searchQuery,
    debouncedQuery,
    clearSearch,
  }
}
