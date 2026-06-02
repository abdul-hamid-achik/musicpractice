export default defineNuxtRouteMiddleware(async (_to) => {
  // Skip on server-side rendering if there's no token — the page can hydrate
  // and the client middleware will catch it.
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
