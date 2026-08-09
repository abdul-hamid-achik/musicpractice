<script setup lang="ts"></script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-2">Practice Hub</h1>
    <p class="text-text-muted mb-8">
      Start a timed session, set goals, and track your musical progress.
    </p>

    <StaggeredList tag="div" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Start Session -->
      <UiCard title="Start Session">
        <p class="text-text-muted mb-4">
          Begin a timed practice session with metronome, tempo trainer, and session tracking.
        </p>
        <template #footer>
          <NuxtLink to="/practice/session">
            <UiButton variant="primary">Start Practicing</UiButton>
          </NuxtLink>
        </template>
      </UiCard>

      <!-- Session History -->
      <UiCard title="Session History">
        <p class="text-text-muted mb-4">
          Review your past sessions, track progress, and see stats over time.
        </p>
        <template #footer>
          <NuxtLink to="/practice/history">
            <UiButton variant="secondary">View History</UiButton>
          </NuxtLink>
        </template>
      </UiCard>

      <!-- Metronome -->
      <UiCard title="Metronome">
        <Metronome />
      </UiCard>

      <!-- Practice Goals -->
      <UiCard title="Practice Goals">
        <PracticeGoals />
      </UiCard>
    </StaggeredList>
  </div>
</template>
