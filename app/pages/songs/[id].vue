<script setup lang="ts">
const route = useRoute()
const songId = route.params.id as string

const { data: song } = await useAsyncData(`song-${songId}`, () =>
  $fetch<any>(`/api/songs/${songId}`),
)

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-900/30 text-green-400',
  intermediate: 'bg-yellow-900/30 text-yellow-400',
  advanced: 'bg-orange-900/30 text-orange-400',
  expert: 'bg-red-900/30 text-red-400',
}
</script>

<template>
  <div v-if="song">
    <!-- Header -->
    <div class="mb-6">
      <NuxtLink to="/songs" class="text-text-muted hover:text-text text-sm mb-2 inline-block">
        &larr; Back to Songs
      </NuxtLink>
      <h1 class="text-3xl font-bold text-text">{{ song.title }}</h1>
      <p v-if="song.artist" class="text-text-muted text-lg mt-1">{{ song.artist }}</p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <!-- Notation Viewer -->
      <div class="xl:col-span-3">
        <NordCard title="Score">
          <AlphaTabViewer
            v-if="song.notationData"
            :alpha-tex="song.notationData"
          />
          <p v-else class="text-text-muted">No notation data available for this song.</p>
        </NordCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <NordCard title="Details">
          <div class="space-y-3">
            <div v-if="song.artist">
              <span class="text-sm text-text-muted block">Artist</span>
              <span class="text-text">{{ song.artist }}</span>
            </div>
            <div>
              <span class="text-sm text-text-muted block">Instrument</span>
              <span class="text-text capitalize">{{ song.instrumentType }}</span>
            </div>
            <div v-if="song.difficulty">
              <span class="text-sm text-text-muted block">Difficulty</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full capitalize inline-block"
                :class="difficultyColors[song.difficulty] || 'bg-surface-alt text-text-muted'"
              >
                {{ song.difficulty }}
              </span>
            </div>
          </div>
        </NordCard>

        <NuxtLink :to="`/practice/session?instrument=${song.instrumentType}`">
          <NordButton variant="primary" class="w-full">Practice This Song</NordButton>
        </NuxtLink>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-text-muted">Song not found.</p>
    <NuxtLink to="/songs" class="text-primary hover:underline mt-2 inline-block">
      Back to Song Library
    </NuxtLink>
  </div>
</template>
