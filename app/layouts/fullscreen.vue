<template>
  <div class="min-h-screen bg-surface">
    <header class="fixed top-0 w-full bg-surface-alt border-b border-border z-40 h-12 flex items-center px-4">
      <NuxtLink to="/practice" class="text-text-muted hover:text-text mr-4">
        &larr; Back
      </NuxtLink>
      <span class="text-text font-medium">Practice Session</span>
    </header>
    <main class="mt-12 p-4">
      <slot />
    </main>
  </div>
</template>
