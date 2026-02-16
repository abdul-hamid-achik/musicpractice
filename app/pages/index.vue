<script setup lang="ts">
definePageMeta({ layout: false })

const features = [
  {
    icon: '🎸',
    title: 'Interactive Instruments',
    description: 'Practice guitar, bass, piano, and violin with realistic fretboards and keyboards.',
  },
  {
    icon: '👂',
    title: 'Ear Training',
    description: 'Sharpen your musical ear with interval recognition and note identification exercises.',
  },
  {
    icon: '📊',
    title: 'Practice Tracking',
    description: 'Log sessions, set goals, and watch your progress grow week after week.',
  },
  {
    icon: '🎵',
    title: 'Music Theory',
    description: 'Explore scales, chords, and the Circle of Fifths with interactive visualizations.',
  },
]

const steps = [
  { number: '01', title: 'Pick your instrument', description: 'Choose from guitar, bass, piano, or violin to get started.' },
  { number: '02', title: 'Set your goals', description: 'Define daily and weekly practice targets that keep you motivated.' },
  { number: '03', title: 'Track your progress', description: 'Review session logs, streaks, and charts to see how far you\'ve come.' },
]

// Floating notes animation data
const floatingNotes = [
  { symbol: '♪', x: 8, delay: 0, duration: 18, size: 'text-2xl' },
  { symbol: '♫', x: 20, delay: 3, duration: 22, size: 'text-3xl' },
  { symbol: '♩', x: 35, delay: 7, duration: 16, size: 'text-xl' },
  { symbol: '♬', x: 55, delay: 1, duration: 20, size: 'text-2xl' },
  { symbol: '♪', x: 70, delay: 5, duration: 19, size: 'text-3xl' },
  { symbol: '♫', x: 85, delay: 9, duration: 17, size: 'text-xl' },
  { symbol: '♩', x: 45, delay: 12, duration: 21, size: 'text-2xl' },
  { symbol: '♬', x: 92, delay: 4, duration: 23, size: 'text-xl' },
]

// Mini piano keys for interactive demo
const activeKey = ref<number | null>(null)

function handleKeyPress(index: number) {
  activeKey.value = index
  setTimeout(() => {
    if (activeKey.value === index) activeKey.value = null
  }, 300)
}

const isBlackKey = (i: number) => [1, 3, 6, 8, 10, 13].includes(i)
</script>

<template>
  <div class="min-h-screen bg-surface overflow-hidden">
    <!-- ═══════ NAVIGATION ═══════ -->
    <nav class="fixed top-0 w-full z-50 backdrop-blur-md bg-surface/80 border-b border-border/50">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <span class="text-primary text-2xl transition-transform duration-300 group-hover:scale-110">♪</span>
          <span class="font-bold text-xl text-text">Music<span class="text-primary">Practice</span></span>
        </NuxtLink>
        <div class="flex items-center gap-4">
          <ThemeToggle />
          <NuxtLink
            to="/auth/login"
            class="text-text-muted hover:text-text transition-colors duration-200 text-sm font-medium"
          >
            Sign In
          </NuxtLink>
          <NuxtLink
            to="/auth/register"
            class="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:brightness-110 transition-all duration-200"
          >
            Get Started Free
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- ═══════ HERO SECTION ═══════ -->
    <section class="relative min-h-screen flex items-center justify-center pt-16">
      <!-- Animated background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-nord0 via-nord1 to-nord0" />

      <!-- Animated grid overlay -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(136,192,208,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(136,192,208,0.3) 1px, transparent 1px); background-size: 60px 60px;" />

      <!-- Floating music notes -->
      <div
        v-for="(note, i) in floatingNotes"
        :key="i"
        class="absolute text-primary/10 pointer-events-none select-none animate-float"
        :class="note.size"
        :style="{
          left: note.x + '%',
          animationDelay: note.delay + 's',
          animationDuration: note.duration + 's',
        }"
      >
        {{ note.symbol }}
      </div>

      <!-- Radial glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />

      <!-- Hero content -->
      <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <!-- Waveform decoration -->
        <div class="flex items-center justify-center gap-1 mb-8">
          <div
            v-for="i in 24"
            :key="i"
            class="w-1 rounded-full bg-primary/40 animate-waveform"
            :style="{
              height: (12 + Math.sin(i * 0.8) * 16) + 'px',
              animationDelay: (i * 0.08) + 's',
            }"
          />
        </div>

        <h1 class="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
          <span class="text-text">Your personal</span><br />
          <span class="bg-gradient-to-r from-nord8 via-nord9 to-nord10 bg-clip-text text-transparent">music practice</span><br />
          <span class="text-text">studio</span>
        </h1>

        <p class="text-text-muted text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Interactive instruments, ear training, music theory, and practice tracking — everything you need to become a better musician.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/auth/register"
            class="group relative bg-primary text-on-primary px-8 py-3.5 rounded-lg text-lg font-semibold hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <span class="relative z-10">Get Started Free</span>
            <div class="absolute inset-0 rounded-lg bg-gradient-to-r from-nord8 to-nord9 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </NuxtLink>
          <NuxtLink
            to="#features"
            class="text-text-muted hover:text-text px-8 py-3.5 rounded-lg text-lg font-medium border border-border hover:border-nord3 transition-all duration-200"
          >
            Explore Features
          </NuxtLink>
        </div>

        <!-- Scroll indicator -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div class="w-6 h-10 rounded-full border-2 border-text-muted/30 flex justify-center pt-2">
            <div class="w-1 h-2.5 rounded-full bg-text-muted/50 animate-scroll-dot" />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ FEATURES SECTION ═══════ -->
    <section id="features" class="relative py-24 sm:py-32">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Features</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-text">Everything you need to practice</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(feature, i) in features"
            :key="i"
            class="group bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div class="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">
              {{ feature.icon }}
            </div>
            <h3 class="text-lg font-semibold text-text mb-2">{{ feature.title }}</h3>
            <p class="text-text-muted text-sm leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ INTERACTIVE DEMO SECTION ═══════ -->
    <section class="relative py-24 sm:py-32 bg-surface-alt/50">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Try it out</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-text">Interactive music tools</h2>
          <p class="text-text-muted mt-4 max-w-xl mx-auto">Tap the piano keys or explore the Circle of Fifths below.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <!-- Mini Piano -->
          <div class="bg-card border border-border rounded-xl p-6">
            <h3 class="text-lg font-semibold text-text mb-4 text-center">Piano</h3>
            <div class="relative flex justify-center">
              <div class="flex gap-px">
                <template v-for="i in 14" :key="i">
                  <button
                    v-if="!isBlackKey(i - 1)"
                    class="relative w-10 sm:w-12 h-32 sm:h-40 rounded-b-md border border-border transition-all duration-100"
                    :class="activeKey === (i - 1) ? 'bg-primary/30 border-primary' : 'bg-nord5 hover:bg-nord4'"
                    @mousedown="handleKeyPress(i - 1)"
                    @touchstart.prevent="handleKeyPress(i - 1)"
                  />
                  <button
                    v-else
                    class="relative w-6 sm:w-7 h-20 sm:h-24 -mx-3 sm:-mx-3.5 z-10 rounded-b-md border border-nord1 transition-all duration-100"
                    :class="activeKey === (i - 1) ? 'bg-primary border-primary' : 'bg-nord1 hover:bg-nord2'"
                    @mousedown="handleKeyPress(i - 1)"
                    @touchstart.prevent="handleKeyPress(i - 1)"
                  />
                </template>
              </div>
            </div>
          </div>

          <!-- Circle of Fifths (reused component) -->
          <CircleOfFifths />
        </div>
      </div>
    </section>

    <!-- ═══════ HOW IT WORKS ═══════ -->
    <section class="relative py-24 sm:py-32">
      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-primary text-sm font-semibold tracking-widest uppercase mb-3">How it works</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-text">Three steps to better practice</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="relative text-center"
          >
            <!-- Connector line (between cards) -->
            <div
              v-if="i < steps.length - 1"
              class="hidden md:block absolute top-10 left-[60%] w-[80%] border-t border-dashed border-border"
            />
            <div class="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-card border border-border mb-6">
              <span class="text-primary text-2xl font-bold font-mono">{{ step.number }}</span>
            </div>
            <h3 class="text-lg font-semibold text-text mb-2">{{ step.title }}</h3>
            <p class="text-text-muted text-sm leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ CTA SECTION ═══════ -->
    <section class="relative py-24 sm:py-32">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <!-- Glow backdrop -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div class="relative">
          <h2 class="text-3xl sm:text-4xl font-bold text-text mb-4">Ready to start practicing?</h2>
          <p class="text-text-muted text-lg max-w-xl mx-auto mb-10">
            Join MusicPractice today and take your skills to the next level — completely free.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink
              to="/auth/register"
              class="bg-primary text-on-primary px-8 py-3.5 rounded-lg text-lg font-semibold hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              Get Started Free
            </NuxtLink>
            <NuxtLink
              to="/auth/login"
              class="text-text-muted hover:text-text px-8 py-3.5 rounded-lg text-lg font-medium border border-border hover:border-nord3 transition-all duration-200"
            >
              Sign In
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ FOOTER ═══════ -->
    <footer class="border-t border-border py-12">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-primary text-xl">♪</span>
              <span class="font-bold text-lg text-text">Music<span class="text-primary">Practice</span></span>
            </div>
            <p class="text-text-muted text-sm">Your personal music practice studio.</p>
          </div>

          <!-- Practice Links -->
          <div>
            <h4 class="text-text font-semibold text-sm mb-3">Practice</h4>
            <ul class="space-y-2 text-sm">
              <li><NuxtLink to="/instruments" class="text-text-muted hover:text-text transition-colors">Instruments</NuxtLink></li>
              <li><NuxtLink to="/theory" class="text-text-muted hover:text-text transition-colors">Music Theory</NuxtLink></li>
              <li><NuxtLink to="/practice" class="text-text-muted hover:text-text transition-colors">Practice Sessions</NuxtLink></li>
              <li><NuxtLink to="/songs" class="text-text-muted hover:text-text transition-colors">Songs</NuxtLink></li>
            </ul>
          </div>

          <!-- Account Links -->
          <div>
            <h4 class="text-text font-semibold text-sm mb-3">Account</h4>
            <ul class="space-y-2 text-sm">
              <li><NuxtLink to="/auth/login" class="text-text-muted hover:text-text transition-colors">Sign In</NuxtLink></li>
              <li><NuxtLink to="/auth/register" class="text-text-muted hover:text-text transition-colors">Create Account</NuxtLink></li>
              <li><NuxtLink to="/settings" class="text-text-muted hover:text-text transition-colors">Settings</NuxtLink></li>
            </ul>
          </div>
        </div>

        <div class="mt-10 pt-6 border-t border-border text-center">
          <p class="text-text-muted text-xs">&copy; {{ new Date().getFullYear() }} MusicPractice. Built for musicians, by musicians.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes waveform {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2.5);
  }
}

@keyframes scroll-dot {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(12px);
    opacity: 0;
  }
}

.animate-float {
  animation: float linear infinite;
}

.animate-waveform {
  animation: waveform 1.5s ease-in-out infinite;
}

.animate-scroll-dot {
  animation: scroll-dot 1.5s ease-in-out infinite;
}
</style>
