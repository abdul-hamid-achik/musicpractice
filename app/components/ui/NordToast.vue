<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const typeClasses: Record<string, string> = {
  success: 'bg-success text-on-success',
  error: 'bg-error text-on-error',
  warning: 'bg-warning text-on-warning',
  info: 'bg-info text-on-info',
}

let timer: ReturnType<typeof setTimeout>

onMounted(() => {
  timer = setTimeout(() => emit('dismiss'), props.duration || 3000)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-300"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      role="alert"
      aria-live="polite"
      class="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
      :class="typeClasses[type || 'info']"
    >
      <span>{{ message }}</span>
      <button class="ml-2 hover:opacity-80" aria-label="Dismiss notification" @click="emit('dismiss')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
