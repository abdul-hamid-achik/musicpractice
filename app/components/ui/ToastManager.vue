<script setup lang="ts">
const toastStore = useToastStore()

function dismiss(id: string) {
  toastStore.removeToast(id)
}
</script>

<template>
  <Teleport to="body">
    <!-- Aria-live region for screen reader announcements -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      <span v-if="toastStore.toasts.length > 0">
        {{ toastStore.toasts[0]?.message }}
      </span>
    </div>

    <!-- Visible toast container -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <TransitionGroup
        enter-active-class="transition-all duration-300"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition-all duration-300"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
        move-class="transition-all duration-300"
      >
        <NordToast
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :message="toast.message"
          :type="toast.type"
          :duration="toast.duration"
          @dismiss="dismiss(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
