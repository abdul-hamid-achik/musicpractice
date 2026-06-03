export default defineNuxtRouteMiddleware(async (_to) => {
  // Trust the in-memory auth state first. After a successful register or
  // login the auth store already has the user object (the response is
  // assigned to `user.value` before the post-auth router.push runs), so
  // a freshly-authenticated user does not have to round-trip through
  // /api/auth/me to prove they are who they say they are. This also
  // sidesteps a Nuxt quirk where `useCookie` does not always see an
  // httpOnly cookie that was just set by an XHR response, which would
  // otherwise bounce the user back to /auth/login immediately after
  // a successful register/login.
  const auth = useAuthStore();
  if (auth.isAuthenticated) {
    return;
  }

  // Fall back to cookie + /api/auth/me validation for cold loads
  // (e.g. refreshing the page on a protected route).
  const token = useCookie('auth-token');
  if (!token.value) {
    return navigateTo('/auth/login', { replace: true });
  }

  // useRequestFetch forwards request headers (including cookies) on the server
  // and falls back to a regular $fetch on the client. This lets the middleware
  // hit the same /api/auth/me endpoint the auth store uses, so a forged /
  // expired cookie is rejected before the user can land on a protected page.
  const fetch = useRequestFetch();
  try {
    await fetch('/api/auth/me');
  } catch {
    return navigateTo('/auth/login', { replace: true });
  }
});
