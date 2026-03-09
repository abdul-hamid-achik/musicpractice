<script setup lang="ts">
const auth = useAuth()
const sidebar = useSidebar()
const route = useRoute()

const navLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Practice', to: '/practice' },
  { label: 'Instruments', to: '/instruments' },
  { label: 'Theory', to: '/theory' },
  { label: 'Songs', to: '/songs' },
]

function isActiveLink(to: string): boolean {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <header class="fixed top-0 w-full bg-surface-alt border-b border-border z-40 h-16 flex items-center justify-between px-6" role="banner">
    <div class="flex items-center gap-2">
      <button
        class="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-card transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-alt"
        aria-label="Toggle navigation menu"
        aria-expanded="false"
        @click="sidebar.toggle()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <NuxtLink to="/" class="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-alt rounded-md">
        <span class="text-primary text-2xl" aria-hidden="true">&#9834;</span>
        <span class="font-bold text-xl text-primary">MusicPractice</span>
      </NuxtLink>
    </div>

    <div class="flex items-center gap-6">
      <nav aria-label="Primary navigation" class="hidden lg:flex items-center gap-6" role="navigation">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-text-muted hover:text-text transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-alt rounded-md px-1 py-0.5"
          :class="{ '!text-primary': isActiveLink(link.to) }"
          :aria-current="isActiveLink(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Theme toggle -->
      <ThemeToggle />

      <div v-if="auth.isAuthenticated.value" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold" aria-hidden="true">
          {{ auth.userName.value?.charAt(0)?.toUpperCase() }}
        </div>
        <span class="hidden sm:inline text-sm text-text font-medium">{{ auth.userName.value }}</span>
        <button
          class="text-text-muted hover:text-text text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-alt rounded-md px-1 py-0.5"
          @click="auth.logout"
        >
          Sign out
        </button>
      </div>

      <div v-else class="flex items-center gap-3">
        <NuxtLink
          to="/auth/login"
          class="text-text-muted hover:text-text text-sm transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-alt rounded-md px-1 py-0.5"
        >
          Sign in
        </NuxtLink>
        <NuxtLink
          to="/auth/register"
          class="bg-primary text-on-primary text-sm font-medium px-4 py-1.5 rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-alt"
        >
          Sign up
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
