<template>
  <footer class="ml-0 lg:ml-64 border-t border-border bg-surface-alt/50 py-6 px-6">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
      <div class="flex items-center gap-2">
        <span class="text-primary">&#9834;</span>
        <span class="font-semibold text-text">MusicPractice</span>
      </div>

      <nav aria-label="Footer navigation" class="flex items-center gap-5">
        <NuxtLink to="/practice" class="hover:text-text transition-colors duration-200">Practice</NuxtLink>
        <NuxtLink to="/instruments" class="hover:text-text transition-colors duration-200">Instruments</NuxtLink>
        <NuxtLink to="/theory" class="hover:text-text transition-colors duration-200">Theory</NuxtLink>
        <NuxtLink to="/songs" class="hover:text-text transition-colors duration-200">Songs</NuxtLink>
      </nav>

      <span>&copy; {{ new Date().getFullYear() }} MusicPractice</span>
    </div>
  </footer>
</template>
