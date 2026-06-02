<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const errorMessage = computed(() => {
  const code = props.error?.statusCode;
  if (code === 404) return 'Page not found';
  if (code === 403) return 'Access denied';
  if (code === 401) return 'Authentication required';
  return 'Something went wrong';
});

const errorDetail = computed(() => {
  const code = props.error?.statusCode;
  if (code === 404) return 'The page you are looking for does not exist or has been moved.';
  if (code === 403) return 'You do not have permission to access this page.';
  if (code === 401) return 'Please sign in to access this page.';
  return props.error?.message || 'An unexpected error occurred. Please try again later.';
});
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <p class="text-6xl font-bold text-primary mb-4">
        {{ props.error?.statusCode ?? 500 }}
      </p>
      <h1 class="text-2xl font-bold text-text mb-3">{{ errorMessage }}</h1>
      <p class="text-text-muted mb-8">{{ errorDetail }}</p>
      <div class="flex justify-center gap-4">
        <NuxtLink
          to="/"
          class="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all"
        >
          Go Home
        </NuxtLink>
        <button
          class="bg-surface-alt text-text px-6 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-border transition-all"
          @click="clearError({ redirect: '/' })"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>
