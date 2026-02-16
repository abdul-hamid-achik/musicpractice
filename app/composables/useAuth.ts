export function useAuth() {
  const store = useAuthStore()

  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    userId: computed(() => store.userId),
    userName: computed(() => store.userName),
    loading: computed(() => store.loading),
    login: store.login,
    logout: store.logout,
    register: store.register,
    fetchUser: store.fetchUser,
  }
}
