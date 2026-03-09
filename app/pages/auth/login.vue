<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuth()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const error = ref('')
const errorRef = ref<HTMLElement | null>(null)

async function handleLogin() {
  error.value = ''
  try {
    await auth.login(identifier.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    const errorObj = e as { data?: { message?: string } }
    error.value = errorObj?.data?.message || 'Invalid credentials'
    // Focus error message for screen readers
    nextTick(() => {
      errorRef.value?.focus()
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <nav class="w-full bg-surface/80 backdrop-blur-md border-b border-border/50 h-14 flex items-center justify-between px-6">
      <NuxtLink to="/" class="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface rounded-md">
        <span class="text-primary text-2xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">&#9834;</span>
        <span class="font-bold text-xl text-text">Music<span class="text-primary">Practice</span></span>
      </NuxtLink>
      <ThemeToggle />
    </nav>
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <p class="text-text-muted text-center mb-8">Sign in to your account</p>

        <form class="bg-card border border-border rounded-xl p-6 space-y-4" @submit.prevent="handleLogin" novalidate>
          <!-- Error message with role="alert" for screen readers -->
          <div
            v-if="error"
            ref="errorRef"
            class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3"
            role="alert"
            aria-live="assertive"
            tabindex="-1"
          >
            {{ error }}
          </div>

          <div>
            <label for="identifier" class="block text-sm font-medium text-text mb-1.5">Email or username</label>
            <input
              id="identifier"
              v-model="identifier"
              type="text"
              autocomplete="username"
              required
              aria-required="true"
              class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-text mb-1.5">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              aria-required="true"
              class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            :disabled="auth.loading.value"
            class="w-full bg-primary text-on-primary font-medium py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
            :aria-busy="auth.loading.value"
          >
            {{ auth.loading.value ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <p class="text-center text-text-muted text-sm mt-6">
          Don't have an account?
          <NuxtLink to="/auth/register" class="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface rounded-md px-1">Sign up</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
