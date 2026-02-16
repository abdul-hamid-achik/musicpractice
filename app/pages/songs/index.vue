<script setup lang="ts">
const search = ref('')
const showAddModal = ref(false)

const { data: songs, refresh } = await useAsyncData('songs', async () => {
  const res = await $fetch<{ data: any[] }>('/api/songs')
  return res.data
})

const filteredSongs = computed(() => {
  if (!songs.value) return []
  if (!search.value) return songs.value
  const q = search.value.toLowerCase()
  return songs.value.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      (s.artist && s.artist.toLowerCase().includes(q)),
  )
})

const difficultyColors: Record<string, string> = {
  beginner: 'bg-nord14/20 text-nord14',
  intermediate: 'bg-nord13/20 text-nord13',
  advanced: 'bg-nord12/20 text-nord12',
  expert: 'bg-nord11/20 text-nord11',
}

// Add song form
const newSong = ref({
  title: '',
  artist: '',
  instrumentType: 'guitar',
  difficulty: 'beginner',
  format: 'alphatex',
  notationData: '',
})

async function submitSong() {
  await $fetch('/api/songs', {
    method: 'POST',
    body: newSong.value,
  })
  showAddModal.value = false
  newSong.value = { title: '', artist: '', instrumentType: 'guitar', difficulty: 'beginner', format: 'alphatex', notationData: '' }
  refresh()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-text">Song Library</h1>
      <NordButton variant="primary" @click="showAddModal = true">Add Song</NordButton>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="Search songs..."
        class="w-full max-w-md bg-surface-alt text-text border border-border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>

    <!-- Song List -->
    <StaggeredList class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="song in filteredSongs"
        :key="song.id"
        :to="`/songs/${song.id}`"
        class="block"
      >
        <NordCard>
          <h3 class="text-lg font-semibold text-text mb-1">{{ song.title }}</h3>
          <p v-if="song.artist" class="text-text-muted text-sm mb-3">{{ song.artist }}</p>
          <div class="flex gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
              {{ song.instrumentType }}
            </span>
            <span
              v-if="song.difficulty"
              class="text-xs px-2 py-0.5 rounded-full capitalize"
              :class="difficultyColors[song.difficulty] || 'bg-surface-alt text-text-muted'"
            >
              {{ song.difficulty }}
            </span>
          </div>
        </NordCard>
      </NuxtLink>
    </StaggeredList>

    <div v-if="filteredSongs.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-text-muted/50 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <p class="text-lg text-text-muted mb-2">Your song library is empty</p>
      <p class="text-sm text-text-muted mb-6">Add your first song to start building your personal library.</p>
      <NordButton variant="primary" @click="showAddModal = true">Add Your First Song</NordButton>
    </div>

    <!-- Add Song Modal -->
    <NordModal :open="showAddModal" title="Add Song" @close="showAddModal = false">
      <form class="space-y-4" @submit.prevent="submitSong">
        <div>
          <label class="block text-sm text-text-muted mb-1">Title</label>
          <input
            v-model="newSong.title"
            type="text"
            required
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Artist</label>
          <input
            v-model="newSong.artist"
            type="text"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-text-muted mb-1">Instrument</label>
            <select
              v-model="newSong.instrumentType"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="guitar">Guitar</option>
              <option value="bass">Bass</option>
              <option value="piano">Piano</option>
              <option value="violin">Violin</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-1">Difficulty</label>
            <select
              v-model="newSong.difficulty"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Notation Format</label>
          <select
            v-model="newSong.format"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="alphatex">AlphaTex</option>
            <option value="musicxml">MusicXML</option>
            <option value="abc">ABC Notation</option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Notation Data</label>
          <textarea
            v-model="newSong.notationData"
            rows="4"
            placeholder="Paste notation data here..."
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <NordButton variant="ghost" type="button" @click="showAddModal = false">Cancel</NordButton>
          <NordButton variant="primary" type="submit">Add Song</NordButton>
        </div>
      </form>
    </NordModal>
  </div>
</template>
