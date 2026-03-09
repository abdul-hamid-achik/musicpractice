<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuth()
const router = useRouter()

const form = ref({
  email: '',
  username: '',
  password: '',
  name: '',
})
const error = ref('')
const errorRef = ref<HTMLElement | null>(null)

const validation = computed(() => {
  const errors: string[] = []
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.push('Invalid email format')
  }
  if (form.value.username && (form.value.username.length < 3 || form.value.username.length > 30)) {
    errors.push('Username must be 3-30 characters')
  }
  if (form.value.password && form.value.password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  return errors
})

const canSubmit = computed(() => {
  return form.value.email && form.value.username && form.value.password && form.value.name && validation.value.length === 0
})

async function handleRegister() {
  error.value = ''
  try {
    await auth.register(form.value.email, form.value.username, form.value.password, form.value.name)
    router.push('/dashboard')
  } catch (e: unknown) {
    const errorObj = e as { data?: { message?: string } }
    error.value = errorObj?.data?.message || 'Registration failed'
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
        <p class="text-text-muted text-center mb-8">Create your account</p>

        <form class="bg-card border border-border rounded-xl p-6 space-y-4" @submit.prevent="handleRegister" novalidate>
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
            <label for="name" class="block text-sm font-medium text-text mb-1.5">Full name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              required
              aria-required="true"
              class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-text mb-1.5">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              aria-required="true"
              :aria-invalid="validation.some(e => e.includes('email'))"
              class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-text mb-1.5">Username</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              aria-required="true"
              minlength="3"
              maxlength="30"
              :aria-invalid="validation.some(e => e.includes('Username'))"
              class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="janedoe"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-text mb-1.5">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              required
              aria-required="true"
              minlength="8"
              :aria-invalid="validation.some(e => e.includes('Password'))"
              aria-describedby="password-help"
              class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="8+ characters"
            />
            <p id="password-help" class="text-xs text-text-muted mt-1">Password must be at least 8 characters</p>
          </div>

          <!-- Validation errors with role="alert" -->
          <ul
            v-if="validation.length > 0"
            class="text-sm text-amber-400 space-y-1 list-disc list-inside"
            role="alert"
            aria-live="polite"
          >
            <li v-for="msg in validation" :key="msg">{{ msg }}</li>
          </ul>

          <button
            type="submit"
            :disabled="!canSubmit || auth.loading.value"
            class="w-full bg-primary text-on-primary font-medium py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
            :aria-busy="auth.loading.value"
          >
            {{ auth.loading.value ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <p class="text-center text-text-muted text-sm mt-6">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface rounded-md px-1">Sign in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
