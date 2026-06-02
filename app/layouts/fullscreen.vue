<template>
  <div class="min-h-screen bg-surface">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-1 focus:left-1 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-md focus:text-sm"
    >
      Skip to main content
    </a>
    <header
      class="fixed top-0 w-full bg-surface-alt border-b border-border z-40 h-12 flex items-center justify-between px-4"
    >
      <div class="flex items-center">
        <NuxtLink to="/practice" class="text-text-muted hover:text-text mr-4">
          &larr; Back
        </NuxtLink>
        <span class="text-text font-medium">Practice Session</span>
      </div>
      <ThemeToggle />
    </header>
    <main id="main-content" class="mt-12 p-4" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
