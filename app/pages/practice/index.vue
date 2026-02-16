<script setup lang="ts">
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-8">Practice Hub</h1>

    <StaggeredList tag="div" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Start Session -->
      <NordCard title="Start Session">
        <p class="text-text-muted mb-4">
          Begin a timed practice session with metronome, tempo trainer, and session tracking.
        </p>
        <template #footer>
          <NuxtLink to="/practice/session">
            <NordButton variant="primary">Start Practicing</NordButton>
          </NuxtLink>
        </template>
      </NordCard>

      <!-- Session History -->
      <NordCard title="Session History">
        <p class="text-text-muted mb-4">
          Review your past sessions, track progress, and see stats over time.
        </p>
        <template #footer>
          <NuxtLink to="/practice/history">
            <NordButton variant="secondary">View History</NordButton>
          </NuxtLink>
        </template>
      </NordCard>

      <!-- Metronome -->
      <NordCard title="Metronome">
        <Metronome />
      </NordCard>

      <!-- Practice Goals -->
      <NordCard title="Practice Goals">
        <PracticeGoals />
      </NordCard>
    </StaggeredList>
  </div>
</template>
