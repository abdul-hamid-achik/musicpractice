<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  ariaPressed?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-110',
  secondary: 'bg-secondary text-on-secondary hover:brightness-110',
  danger: 'bg-error text-on-error hover:brightness-110',
  success: 'bg-success text-on-success hover:brightness-110',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-alt',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
</script>

<template>
  <button
    :type="type || 'button'"
    :class="[
      'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card',
      variantClasses[variant || 'primary'],
      sizeClasses[size || 'md'],
      (disabled || loading) && 'opacity-50 cursor-not-allowed',
    ]"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-pressed="ariaPressed"
    :aria-busy="loading"
    @click="emit('click', $event)"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
