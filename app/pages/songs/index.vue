<script setup lang="ts">
import type { Song } from '#shared/types/notation'
import type { ApiResponse } from '#shared/types/server'

const showAddModal = ref(false)
const isLoading = ref(false)

// Search and filters
const searchQuery = ref('')
const instrumentTypeFilter = ref<string>('')
const difficultyFilter = ref<string>('')

// Debounced search (300ms delay)
const debouncedSearch = useDebounce(searchQuery, 300)

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Songs data
const songsData = ref<Song[]>([])
const totalSongs = ref(0)
const totalPages = ref(0)

// Build query params for API call
function buildQueryParams() {
  const params: Record<string, string> = {
    page: String(currentPage.value),
    limit: String(pageSize.value),
  }

  if (debouncedSearch.value) {
    params.search = debouncedSearch.value
  }
  if (instrumentTypeFilter.value) {
    params.instrumentType = instrumentTypeFilter.value
  }
  if (difficultyFilter.value) {
    params.difficulty = difficultyFilter.value
  }

  return params
}

// Fetch songs from API
async function fetchSongs() {
  isLoading.value = true
  try {
    const params = buildQueryParams()
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    const response = await apiGet<ApiResponse<Song[]>>(
      `/api/songs?${queryString}`,
      { suppressError: true },
    )

    songsData.value = response.data
    totalSongs.value = response.total ?? 0
    currentPage.value = response.page ?? 1
    totalPages.value = Math.ceil((response.total ?? 0) / (response.limit ?? pageSize.value))
  } catch (error) {
    console.error('Failed to fetch songs:', error)
    songsData.value = []
    totalSongs.value = 0
  } finally {
    isLoading.value = false
  }
}

// Watch for changes and refetch
watch([debouncedSearch, instrumentTypeFilter, difficultyFilter], () => {
  currentPage.value = 1 // Reset to first page when filters change
  fetchSongs()
})

watch(currentPage, () => {
  fetchSongs()
})

// Initial fetch
await fetchSongs()

// Clear all filters
function clearFilters() {
  searchQuery.value = ''
  instrumentTypeFilter.value = ''
  difficultyFilter.value = ''
  currentPage.value = 1
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return debouncedSearch.value || instrumentTypeFilter.value || difficultyFilter.value
})

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
  await apiPost('/api/songs', newSong.value, {
    successMessage: 'Song added successfully',
  })
  showAddModal.value = false
  newSong.value = { title: '', artist: '', instrumentType: 'guitar', difficulty: 'beginner', format: 'alphatex', notationData: '' }
  fetchSongs()
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-nord14/20 text-nord14',
  intermediate: 'bg-nord13/20 text-nord13',
  advanced: 'bg-nord12/20 text-nord12',
  expert: 'bg-nord11/20 text-nord11',
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-text">Song Library</h1>
        <p v-if="totalSongs > 0" class="text-sm text-text-muted mt-1">
          Showing {{ songsData.length }} of {{ totalSongs }} songs
        </p>
      </div>
      <NordButton variant="primary" @click="showAddModal = true">Add Song</NordButton>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6 space-y-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by title or artist..."
              class="w-full bg-surface-alt text-text border border-border rounded-md px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <svg
              v-if="searchQuery"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted cursor-pointer hover:text-text"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              @click="searchQuery = ''"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </div>
        </div>

        <!-- Instrument Type Filter -->
        <div class="sm:w-40">
          <select
            v-model="instrumentTypeFilter"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Instruments</option>
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
            <option value="piano">Piano</option>
            <option value="violin">Violin</option>
          </select>
        </div>

        <!-- Difficulty Filter -->
        <div class="sm:w-40">
          <select
            v-model="difficultyFilter"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      <!-- Clear Filters Button -->
      <div v-if="hasActiveFilters" class="flex items-center justify-between">
        <span class="text-sm text-text-muted">
          Active filters:
          <span v-if="debouncedSearch" class="inline-flex items-center gap-1 ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
            Search: "{{ debouncedSearch }}"
          </span>
          <span v-if="instrumentTypeFilter" class="inline-flex items-center gap-1 ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs capitalize">
            {{ instrumentTypeFilter }}
          </span>
          <span v-if="difficultyFilter" class="inline-flex items-center gap-1 ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs capitalize">
            {{ difficultyFilter }}
          </span>
        </span>
        <button
          @click="clearFilters"
          class="text-sm text-text-muted hover:text-text underline underline-offset-2"
        >
          Clear all filters
        </button>
      </div>
    </div>

    <!-- Loading State with Skeleton Cards -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading songs...">
      <SkeletonCard v-for="i in 6" :key="i" variant="card" height="140px" />
    </div>

    <!-- Song List -->
    <StaggeredList v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="song in songsData"
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

    <!-- Empty State -->
    <div v-if="!isLoading && songsData.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-text-muted/50 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <p class="text-lg text-text-muted mb-2">
        {{ hasActiveFilters ? 'No songs match your filters' : 'Your song library is empty' }}
      </p>
      <p class="text-sm text-text-muted mb-6">
        {{ hasActiveFilters ? 'Try adjusting your search or filters' : 'Add your first song to start building your personal library.' }}
      </p>
      <NordButton
        v-if="hasActiveFilters"
        variant="secondary"
        @click="clearFilters"
      >
        Clear Filters
      </NordButton>
      <NordButton
        v-else
        variant="primary"
        @click="showAddModal = true"
      >
        Add Your First Song
      </NordButton>
    </div>

    <!-- Pagination -->
    <div v-if="!isLoading && totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
      <NordButton
        variant="ghost"
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >
        Previous
      </NordButton>
      <span class="text-text-muted">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <NordButton
        variant="ghost"
        :disabled="currentPage >= totalPages"
        @click="currentPage++"
      >
        Next
      </NordButton>
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
            <option value="guitar_pro">Guitar Pro</option>
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
