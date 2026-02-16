<script setup lang="ts">
const auth = useAuth()
const settingsStore = useSettingsStore()

const navLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Practice', to: '/practice' },
  { label: 'Instruments', to: '/instruments' },
  { label: 'Theory', to: '/theory' },
  { label: 'Songs', to: '/songs' },
]

function toggleTheme() {
  settingsStore.updateSetting('theme', settingsStore.theme === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <header class="fixed top-0 w-full bg-surface-alt border-b border-border z-40 h-16 flex items-center justify-between px-6">
    <NuxtLink to="/" class="flex items-center gap-2">
      <span class="text-primary text-2xl">&#9834;</span>
      <span class="font-bold text-xl text-primary">MusicPractice</span>
    </NuxtLink>

    <div class="flex items-center gap-6">
      <nav v-if="auth.isAuthenticated.value" aria-label="Primary navigation" class="hidden lg:flex items-center gap-6">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-text-muted hover:text-text transition-colors duration-200"
          active-class="!text-primary"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Theme toggle -->
      <button
        class="w-9 h-9 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-card transition-colors duration-200"
        :aria-label="settingsStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <svg v-if="settingsStore.theme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>

      <div v-if="auth.isAuthenticated.value" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
          {{ auth.userName.value?.charAt(0)?.toUpperCase() }}
        </div>
        <span class="hidden sm:inline text-sm text-text font-medium">{{ auth.userName.value }}</span>
        <button
          class="text-text-muted hover:text-text text-sm transition-colors"
          @click="auth.logout"
        >
          Sign out
        </button>
      </div>

      <div v-else class="flex items-center gap-3">
        <NuxtLink
          to="/auth/login"
          class="text-text-muted hover:text-text text-sm transition-colors font-medium"
        >
          Sign in
        </NuxtLink>
        <NuxtLink
          to="/auth/register"
          class="bg-primary text-nord0 text-sm font-medium px-4 py-1.5 rounded-lg hover:brightness-110 transition-all"
        >
          Sign up
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
