<template>
  <div class="min-h-screen bg-surface">
    <header class="fixed top-0 w-full bg-surface-alt border-b border-border z-40 h-12 flex items-center justify-between px-4">
      <div class="flex items-center">
        <NuxtLink to="/practice" class="text-text-muted hover:text-text mr-4">
          &larr; Back
        </NuxtLink>
        <span class="text-text font-medium">Practice Session</span>
      </div>
      <ThemeToggle />
    </header>
    <main class="mt-12 p-4">
      <slot />
    </main>
  </div>
</template>
