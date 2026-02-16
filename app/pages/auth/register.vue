<script setup lang="ts">
definePageMeta({ layout: 'fullscreen' })

const auth = useAuth()
const router = useRouter()

const form = ref({
  email: '',
  username: '',
  password: '',
  name: '',
})
const error = ref('')

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
  } catch (e: any) {
    error.value = e?.data?.message || 'Registration failed'
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
        <p class="text-text-muted mt-2">Create your account</p>
      </div>

      <form class="bg-card border border-border rounded-xl p-6 space-y-4" @submit.prevent="handleRegister">
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
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
            class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
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
            class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
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
            minlength="3"
            maxlength="30"
            class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
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
            minlength="8"
            class="w-full bg-surface-alt border border-border rounded-lg px-3.5 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            placeholder="8+ characters"
          />
        </div>

        <ul v-if="validation.length > 0" class="text-sm text-amber-400 space-y-1 list-disc list-inside">
          <li v-for="msg in validation" :key="msg">{{ msg }}</li>
        </ul>

        <button
          type="submit"
          :disabled="!canSubmit || auth.loading.value"
          class="w-full bg-primary text-on-primary font-medium py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {{ auth.loading.value ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="text-center text-text-muted text-sm mt-6">
        Already have an account?
        <NuxtLink to="/auth/login" class="text-primary hover:underline font-medium">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>
