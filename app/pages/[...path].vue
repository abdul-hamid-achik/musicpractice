<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

// Page metadata
useHead({
  title: 'Page Not Found | MusicPractice',
  meta: [
    {
      name: 'description',
      content: 'Oops! The page you\'re looking for doesn\'t exist. Return to MusicPractice homepage or explore our instruments, practice sessions, and songs.',
    },
  ],
})

// Auth store for conditional dashboard link
const authStore = useAuthStore()

// Search functionality
const searchQuery = ref('')
const router = useRouter()

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/songs?search=${encodeURIComponent(searchQuery.value.trim())}`)
  }
}

function handleSearchKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

// Floating music notes for animation
const floatingNotes = [
  { symbol: '♪', x: 10, delay: 0, duration: 15, size: 'text-3xl' },
  { symbol: '♫', x: 25, delay: 4, duration: 18, size: 'text-4xl' },
  { symbol: '♩', x: 40, delay: 2, duration: 20, size: 'text-2xl' },
  { symbol: '♬', x: 55, delay: 6, duration: 16, size: 'text-3xl' },
  { symbol: '♪', x: 70, delay: 1, duration: 22, size: 'text-4xl' },
  { symbol: '♫', x: 85, delay: 5, duration: 17, size: 'text-2xl' },
  { symbol: '♩', x: 15, delay: 8, duration: 19, size: 'text-3xl' },
  { symbol: '♬', x: 90, delay: 3, duration: 21, size: 'text-2xl' },
]

// Popular sections for quick navigation
const popularSections = [
  {
    title: 'Instruments',
    description: 'Practice guitar, bass, piano & violin',
    icon: '🎸',
    href: '/instruments',
  },
  {
    title: 'Practice',
    description: 'Track your sessions and progress',
    icon: '📊',
    href: '/practice',
  },
  {
    title: 'Songs',
    description: 'Browse and learn new songs',
    icon: '🎵',
    href: '/songs',
  },
  {
    title: 'Theory',
    description: 'Learn music theory & ear training',
    icon: '🎼',
    href: '/theory',
  },
]
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Animated background gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-surface via-surface-alt to-surface" />

    <!-- Animated grid overlay -->
    <div
      class="absolute inset-0 opacity-[0.03]"
      style="background-image: linear-gradient(rgba(136,192,208,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(136,192,208,0.3) 1px, transparent 1px); background-size: 60px 60px;"
    />

    <!-- Floating music notes -->
    <div
      v-for="(note, i) in floatingNotes"
      :key="i"
      class="absolute text-primary/15 pointer-events-none select-none animate-float"
      :class="note.size"
      :style="{
        left: note.x + '%',
        animationDelay: note.delay + 's',
        animationDuration: note.duration + 's',
      }"
      aria-hidden="true"
    >
      {{ note.symbol }}
    </div>

    <!-- Radial glow effect -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

    <!-- Main content -->
    <div class="relative z-10 w-full max-w-2xl">
      <!-- Fade-in wrapper -->
      <div class="animate-fade-in">
        <!-- 404 Card -->
        <NordCard class="text-center">
          <!-- Music illustration -->
          <div class="mb-8 relative">
            <!-- Broken string illustration -->
            <div class="relative inline-block">
              <!-- Guitar body silhouette -->
              <svg
                class="w-32 h-32 mx-auto text-primary/30"
                viewBox="0 0 120 120"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M60 5c-8 0-15 6-15 15v25c0 3-2 6-5 8l-8 6c-4 3-6 8-6 13 0 10 8 18 18 18h32c10 0 18-8 18-18 0-5-2-10-6-13l-8-6c-3-2-5-5-5-8V20c0-9-7-15-15-15zm0 10c3 0 5 2 5 5v25c0 2-2 4-5 4s-5-2-5-4V20c0-3 2-5 5-5z"
                />
                <!-- Broken string -->
                <line
                  x1="35"
                  y1="30"
                  x2="35"
                  y2="70"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="opacity-50"
                />
                <line
                  x1="45"
                  y1="30"
                  x2="45"
                  y2="65"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="opacity-50"
                />
                <!-- Broken wavy string -->
                <path
                  d="M55 30 L55 55 Q50 60 55 65 Q60 60 55 65"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                  class="opacity-70"
                />
                <line
                  x1="65"
                  y1="30"
                  x2="65"
                  y2="70"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="opacity-50"
                />
                <line
                  x1="75"
                  y1="30"
                  x2="75"
                  y2="70"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="opacity-50"
                />
                <line
                  x1="85"
                  y1="30"
                  x2="85"
                  y2="70"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="opacity-50"
                />
              </svg>
              <!-- Floating note decoration -->
              <span
                class="absolute -top-2 -right-2 text-4xl animate-bounce-slow"
                aria-hidden="true"
              >
                ♪
              </span>
            </div>
          </div>

          <!-- Heading -->
          <h1
            class="text-7xl sm:text-8xl font-bold text-primary mb-4 tracking-tight"
            aria-label="404"
          >
            404
          </h1>

          <!-- Subheading with music pun -->
          <h2 class="text-2xl sm:text-3xl font-semibold text-text mb-3">
            Looks like this page is off-key...
          </h2>

          <!-- Description -->
          <p class="text-text-muted text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back in tune!
          </p>

          <!-- Search box -->
          <div class="mb-8 max-w-md mx-auto">
            <label for="search" class="sr-only">Search songs</label>
            <div class="flex gap-2">
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Search for songs..."
                class="flex-1 px-4 py-2.5 bg-surface-alt border border-border rounded-md text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                @keydown="handleSearchKeyDown"
              />
              <NordButton
                variant="primary"
                aria-label="Search"
                @click="handleSearch"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </NordButton>
            </div>
          </div>

          <!-- Primary action buttons -->
          <div class="flex flex-wrap items-center justify-center gap-3 mb-8">
            <NuxtLink to="/">
              <NordButton variant="primary" size="md">
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </NordButton>
            </NuxtLink>

            <NuxtLink v-if="authStore.isAuthenticated" to="/dashboard">
              <NordButton variant="secondary" size="md">
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Dashboard
              </NordButton>
            </NuxtLink>

            <NuxtLink v-else to="/auth/login">
              <NordButton variant="secondary" size="md">
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </NordButton>
            </NuxtLink>
          </div>

          <!-- Popular sections -->
          <div class="border-t border-border pt-8">
            <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Popular Sections
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NuxtLink
                v-for="section in popularSections"
                :key="section.href"
                :to="section.href"
                class="group"
              >
                <div
                  class="bg-surface-alt border border-border rounded-lg p-4 text-center hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                >
                  <span
                    class="text-3xl block mb-2 transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    {{ section.icon }}
                  </span>
                  <span class="text-sm font-medium text-text block mb-0.5">
                    {{ section.title }}
                  </span>
                  <span class="text-xs text-text-muted line-clamp-1">
                    {{ section.description }}
                  </span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </NordCard>

        <!-- Additional help text -->
        <p class="text-center text-text-muted text-sm mt-6">
          Need help? Visit our
          <NuxtLink
            to="/instruments"
            class="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface rounded"
          >
            instruments page
          </NuxtLink>
          to start practicing.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════ FADE-IN ANIMATION ═══════ */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

/* ═══════ FLOAT ANIMATION ═══════ */
@keyframes float {
  0%, 100% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

.animate-float {
  animation: float linear infinite;
}

/* ═══════ BOUNCE SLOW ANIMATION ═══════ */
@keyframes bounceSlow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-slow {
  animation: bounceSlow 2s ease-in-out infinite;
}

/* ═══════ ACCESSIBILITY ═══════ */
/* Focus visible styles for keyboard navigation */
a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--nord8);
  outline-offset: 2px;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-float,
  .animate-bounce-slow {
    animation: none;
  }

  .animate-fade-in {
    opacity: 1;
  }
}

/* ═══════ RESPONSIVE ADJUSTMENTS ═══════ */
@media (max-width: 640px) {
  .animate-float {
    animation-duration: 25s !important;
  }
}
</style>
