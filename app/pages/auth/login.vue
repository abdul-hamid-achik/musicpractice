<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuth()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const error = ref('')

async function handleLogin() {
  error.value = ''
  try {
    await auth.login(identifier.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.message || 'Invalid credentials'
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center px-4">
    <div class="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <span class="text-primary text-3xl">&#9834;</span>
          <span class="font-bold text-2xl text-primary">MusicPractice</span>
        </NuxtLink>
        <p class="text-text-muted mt-2">Sign in to your account</p>
      </div>

      <form class="bg-card border border-border rounded-xl p-6 space-y-4" @submit.prevent="handleLogin">
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
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
            class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
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
            class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          :disabled="auth.loading.value"
          class="w-full bg-primary text-on-primary font-medium py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {{ auth.loading.value ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="text-center text-text-muted text-sm mt-6">
        Don't have an account?
        <NuxtLink to="/auth/register" class="text-primary hover:underline font-medium">Sign up</NuxtLink>
      </p>
    </div>
  </div>
</template>
