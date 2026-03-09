import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface AuthUser {
  id: string
  email: string
  username: string
  name: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const { showError } = useToast()

  const isAuthenticated = computed(() => !!user.value)
  const userName = computed(() => user.value?.name ?? '')
  const userId = computed(() => user.value?.id ?? '')

  async function fetchUser() {
    try {
      user.value = await $fetch<AuthUser>('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  async function login(identifier: string, password: string) {
    loading.value = true
    try {
      user.value = await $fetch<AuthUser>('/api/auth/login', {
        method: 'POST',
        body: { identifier, password },
      })
    } catch (error) {
      showError('Login failed. Please check your credentials.')
      console.error('Login error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, username: string, password: string, name: string) {
    loading.value = true
    try {
      user.value = await $fetch<AuthUser>('/api/auth/register', {
        method: 'POST',
        body: { email, username, password, name },
      })
    } catch (error) {
      showError('Registration failed. Please try again.')
      console.error('Registration error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/auth/login')
  }

  // Restore session from cookie on init
  fetchUser()

  return {
    user,
    loading,
    isAuthenticated,
    userName,
    userId,
    fetchUser,
    login,
    register,
    logout,
  }
})
