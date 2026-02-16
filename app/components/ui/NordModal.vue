<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLElement | null>(null)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  // Focus trap
  if (e.key === 'Tab' && dialogRef.value) {
    const focusable = dialogRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const firstFocusable = dialogRef.value?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        @click.self="emit('close')"
        @keydown="handleKeydown"
      >
        <div
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="bg-card border border-border rounded-xl max-w-lg mx-auto mt-20 p-6 animate-modal-in"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 v-if="title" class="text-lg font-semibold text-text">{{ title }}</h2>
            <button
              class="text-text-muted hover:text-text ml-auto"
              aria-label="Close dialog"
              @click="emit('close')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-modal-in {
  animation: modal-in 200ms ease-out;
}
</style>
