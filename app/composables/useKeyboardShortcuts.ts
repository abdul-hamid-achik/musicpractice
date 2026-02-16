import { onMounted, onUnmounted } from 'vue'

interface KeyboardShortcutOptions {
  onToggleMetronome?: () => void
  onBpmAdjust?: (delta: number) => void
  onToggleSidebar?: () => void
  onTogglePause?: () => void
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        options.onToggleMetronome?.()
        break
      case 'ArrowUp':
        e.preventDefault()
        options.onBpmAdjust?.(e.shiftKey ? 5 : 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        options.onBpmAdjust?.(e.shiftKey ? -5 : -1)
        break
      case 'Escape':
        options.onToggleSidebar?.()
        break
      case 'KeyP':
        options.onTogglePause?.()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
}
