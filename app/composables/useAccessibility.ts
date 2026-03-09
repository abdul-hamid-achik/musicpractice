/**
 * Accessibility Utilities Composable
 * Provides focus management, keyboard navigation helpers, and ARIA utilities
 */

export interface FocusTrapOptions {
  initialFocus?: string
  escapeDeactivates?: boolean
  clickOutsideDeactivates?: boolean
  onDeactivate?: () => void
}

export interface UseFocusTrapReturn {
  activate: () => void
  deactivate: () => void
  isActive: Readonly<Ref<boolean>>
}

export interface UseEscapeKeyReturn {
  removeListener: () => void
}

export interface UseFocusRestoreReturn {
  restore: () => void
  capture: () => void
}

/**
 * Creates a focus trap within a container element
 * Focus is contained within the element until deactivated
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  options: FocusTrapOptions = {}
): UseFocusTrapReturn {
  const isActive = ref(false)
  const previouslyFocused = ref<HTMLElement | null>(null)

  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  const getFocusableElements = () => {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => {
      return el.offsetParent !== null // Element is visible
    })
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isActive.value || event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement && lastElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement && firstElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (options.escapeDeactivates !== false && event.key === 'Escape' && isActive.value) {
      deactivate()
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (options.clickOutsideDeactivates && containerRef.value) {
      if (!containerRef.value.contains(event.target as Node)) {
        deactivate()
      }
    }
  }

  const activate = () => {
    if (isActive.value) return

    previouslyFocused.value = document.activeElement as HTMLElement

    // Add event listeners
    document.addEventListener('keydown', handleKeydown)
    if (options.escapeDeactivates !== false) {
      document.addEventListener('keydown', handleEscape)
    }
    if (options.clickOutsideDeactivates) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    isActive.value = true

    // Focus the first focusable element or specified initial focus
    nextTick(() => {
      const focusableElements = getFocusableElements()
      if (options.initialFocus) {
        const initialElement = containerRef.value?.querySelector(options.initialFocus)
        if (initialElement) {
          (initialElement as HTMLElement).focus()
          return
        }
      }
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus()
      }
    })
  }

  const deactivate = () => {
    if (!isActive.value) return

    // Remove event listeners
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('keydown', handleEscape)
    document.removeEventListener('mousedown', handleClickOutside)

    isActive.value = false

    // Restore focus to previously focused element
    if (previouslyFocused.value) {
      previouslyFocused.value.focus()
    }

    options.onDeactivate?.()
  }

  onBeforeUnmount(() => {
    deactivate()
  })

  return {
    activate,
    deactivate,
    isActive: readonly(isActive),
  }
}

/**
 * Sets up an Escape key handler
 * Useful for closing modals, dialogs, dropdowns
 */
export function useEscapeKey(handler: () => void, enabled: Ref<boolean> = ref(true)): UseEscapeKeyReturn {
  const handleKeydown = (event: KeyboardEvent) => {
    if (enabled.value && event.key === 'Escape') {
      handler()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  const removeListener = () => {
    document.removeEventListener('keydown', handleKeydown)
  }

  onBeforeUnmount(() => {
    removeListener()
  })

  return { removeListener }
}

/**
 * Captures and restores focus
 * Useful for temporary UI changes like modals
 */
export function useFocusRestore(): UseFocusRestoreReturn {
  const previouslyFocused = ref<HTMLElement | null>(null)

  const capture = () => {
    previouslyFocused.value = document.activeElement as HTMLElement
  }

  const restore = () => {
    if (previouslyFocused.value) {
      previouslyFocused.value.focus()
      previouslyFocused.value = null
    }
  }

  onBeforeUnmount(() => {
    restore()
  })

  return { capture, restore }
}

/**
 * Announces a message to screen readers using aria-live region
 */
export function useAnnouncer() {
  const announcerRef = ref<HTMLElement | null>(null)
  const message = ref('')

  const announce = (newMessage: string, _priority: 'polite' | 'assertive' = 'polite') => {
    message.value = ''
    // Clear and set message to ensure screen readers announce it
    nextTick(() => {
      message.value = newMessage
    })
  }

  const Announcer = defineComponent({
    setup() {
      return () => h('div', {
        ref: announcerRef,
        'aria-live': 'polite',
        'aria-atomic': 'true',
        class: 'sr-only',
        style: {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
      }, message.value)
    },
  })

  return {
    announce,
    Announcer,
  }
}

/**
 * Checks if an element is currently focused
 */
export function isElementFocused(element: HTMLElement | null): boolean {
  return element !== null && element === document.activeElement
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []

  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter((el) => el.offsetParent !== null)
}

/**
 * Moves focus to the next/previous focusable element
 * Useful for custom keyboard navigation
 */
export function useKeyboardNavigation(
  containerRef: Ref<HTMLElement | null>,
  options: {
    onNavigate?: (element: HTMLElement, direction: 'next' | 'prev') => void
    loop?: boolean
  } = {}
) {
  const { loop = true, onNavigate } = options

  const handleKeydown = (event: KeyboardEvent) => {
    if (!containerRef.value) return

    const focusableElements = getFocusableElements(containerRef.value)
    if (focusableElements.length === 0) return

    const currentIndex = focusableElements.findIndex(
      (el) => el === document.activeElement
    )

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      let nextIndex = currentIndex + 1
      if (nextIndex >= focusableElements.length) {
        nextIndex = loop ? 0 : currentIndex
      }
      focusableElements[nextIndex]?.focus()
      onNavigate?.(focusableElements[nextIndex]!, 'next')
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      let prevIndex = currentIndex - 1
      if (prevIndex < 0) {
        prevIndex = loop ? focusableElements.length - 1 : currentIndex
      }
      focusableElements[prevIndex]?.focus()
      onNavigate?.(focusableElements[prevIndex]!, 'prev')
    }
  }

  onMounted(() => {
    containerRef.value?.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    containerRef.value?.removeEventListener('keydown', handleKeydown)
  })

  return { handleKeydown }
}
