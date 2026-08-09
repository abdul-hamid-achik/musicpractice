<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const route = useRoute();

const state = ref<'joining' | 'joined' | 'failed'>('joining');
const studioName = ref('');
const errorMessage = ref('');

onMounted(async () => {
  try {
    const result = await $fetch<{ studioName: string }>('/api/studio/join', {
      method: 'POST',
      body: { token: route.params.token },
    });
    studioName.value = result.studioName;
    state.value = 'joined';
  } catch (error) {
    const e = error as { data?: { message?: string } };
    errorMessage.value =
      e?.data?.message || 'This invite link could not be used. Ask your teacher for a new one.';
    state.value = 'failed';
  }
});

function goTo(path: string) {
  navigateTo(path);
}
</script>

<template>
  <div class="mx-auto max-w-md py-16 text-center" aria-live="polite">
    <template v-if="state === 'joining'">
      <p class="text-text-muted">Joining studio…</p>
    </template>

    <template v-else-if="state === 'joined'">
      <p class="mb-2 font-mono text-xs tracking-[0.25em] text-primary">WELCOME</p>
      <h1 class="text-2xl font-bold text-text">You're in {{ studioName }}</h1>
      <p class="mt-3 text-text-muted">
        Practice like you always do — your sessions now count toward your teacher's board.
      </p>
      <div class="mt-8 flex justify-center gap-3">
        <UiButton @click="goTo('/practice')">Start practicing</UiButton>
        <UiButton variant="ghost" @click="goTo('/studio')">View my studio</UiButton>
      </div>
    </template>

    <template v-else>
      <h1 class="text-2xl font-bold text-text">Couldn't join</h1>
      <p class="mt-3 text-text-muted">{{ errorMessage }}</p>
      <UiButton class="mt-8" variant="ghost" @click="goTo('/dashboard')">
        Back to dashboard
      </UiButton>
    </template>
  </div>
</template>
