<script setup lang="ts">
import type { Song, UserProgress } from '#shared/types/notation'

const route = useRoute()
const router = useRouter()
const songId = route.params.id as string
const { showSuccess, showError } = useToast()

const { data: song, refresh } = await useAsyncData(`song-${songId}`, () =>
  $fetch<Song>(`/api/songs/${songId}`),
)

// Fetch user progress for this song
const { data: progress, refresh: refreshProgress } = await useAsyncData(`progress-${songId}`, async () => {
  try {
    const result = await $fetch<{ data: UserProgress[] }>(`/api/progress?songId=${songId}`)
    return result.data?.[0] ?? null
  } catch {
    return null
  }
})

const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const showProgressEditModal = ref(false)

const editForm = ref({
  title: '',
  artist: '',
  instrumentType: 'guitar',
  difficulty: 'beginner',
  format: 'alphatex',
  notationData: '',
})

const progressEditForm = ref({
  completionPercent: 0,
  maxTempoBpm: null as number | null,
  practiceCount: 0,
  lastPracticedAt: '',
})

function openEdit() {
  if (!song.value) return
  editForm.value = {
    title: song.value.title,
    artist: song.value.artist || '',
    instrumentType: song.value.instrumentType,
    difficulty: song.value.difficulty || 'beginner',
    format: song.value.format || 'alphatex',
    notationData: song.value.notationData || '',
  }
  showEditModal.value = true
}

async function saveEdit() {
  try {
    await $fetch(`/api/songs/${songId}`, {
      method: 'PUT',
      body: editForm.value,
    })
    showSuccess('Song updated successfully')
    showEditModal.value = false
    refresh()
  } catch (error) {
    showError('Failed to update song')
    console.error('Error updating song:', error)
  }
}

async function deleteSong() {
  try {
    await $fetch(`/api/songs/${songId}`, { method: 'DELETE' })
    showSuccess('Song deleted successfully')
    router.push('/songs')
  } catch (error) {
    showError('Failed to delete song')
    console.error('Error deleting song:', error)
  }
}

function openProgressEdit() {
  if (!progress.value) {
    progressEditForm.value = {
      completionPercent: 0,
      maxTempoBpm: null,
      practiceCount: 0,
      lastPracticedAt: '',
    }
  } else {
    progressEditForm.value = {
      completionPercent: progress.value.completionPercent ?? 0,
      maxTempoBpm: progress.value.maxTempoBpm ?? null,
      practiceCount: progress.value.practiceCount ?? 0,
      lastPracticedAt: progress.value.lastPracticedAt
        ? new Date(progress.value.lastPracticedAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    }
  }
  showProgressEditModal.value = true
}

async function saveProgressEdit() {
  try {
    await $fetch(`/api/progress/${songId}`, {
      method: 'PUT',
      body: {
        completionPercent: progressEditForm.value.completionPercent,
        maxTempoBpm: progressEditForm.value.maxTempoBpm || null,
        practiceCount: progressEditForm.value.practiceCount,
        lastPracticedAt: progressEditForm.value.lastPracticedAt || null,
      },
    })
    showSuccess('Progress updated successfully')
    showProgressEditModal.value = false
    refreshProgress()
  } catch (error) {
    showError('Failed to update progress')
    console.error('Error updating progress:', error)
  }
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-nord14/20 text-nord14',
  intermediate: 'bg-nord13/20 text-nord13',
  advanced: 'bg-nord12/20 text-nord12',
  expert: 'bg-nord11/20 text-nord11',
}

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return 'Never'
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div v-if="song">
    <!-- Header -->
    <div class="mb-6">
      <NuxtLink to="/songs" class="text-text-muted hover:text-text text-sm mb-2 inline-block">
        &larr; Back to Songs
      </NuxtLink>
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold text-text">{{ song.title }}</h1>
          <p v-if="song.artist" class="text-text-muted text-lg mt-1">{{ song.artist }}</p>
        </div>
        <div class="flex gap-2">
          <NordButton variant="ghost" size="sm" @click="openEdit">Edit</NordButton>
          <NordButton variant="danger" size="sm" @click="showDeleteConfirm = true">Delete</NordButton>
        </div>
      </div>
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

        <!-- Progress Card -->
        <NordCard title="Your Progress">
          <div v-if="progress" class="space-y-4">
            <!-- Completion Progress Bar -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-text-muted">Completion</span>
                <span class="text-sm font-semibold text-text">{{ Math.round(progress.completionPercent) }}%</span>
              </div>
              <div class="h-2 bg-border rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary transition-all duration-500"
                  :style="{ width: progress.completionPercent + '%' }"
                />
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-surface-alt rounded-md p-2">
                <span class="text-xs text-text-muted block">Practice Sessions</span>
                <span class="text-lg font-bold text-text">{{ progress.practiceCount }}</span>
              </div>
              <div class="bg-surface-alt rounded-md p-2">
                <span class="text-xs text-text-muted block">Max Tempo</span>
                <span class="text-lg font-bold text-text">{{ progress.maxTempoBpm ?? '--' }} <span class="text-xs font-normal">BPM</span></span>
              </div>
            </div>

            <!-- Last Practiced -->
            <div class="bg-surface-alt rounded-md p-2">
              <span class="text-xs text-text-muted block">Last Practiced</span>
              <span class="text-sm font-medium text-text">{{ formatDate(progress.lastPracticedAt) }}</span>
            </div>

            <NordButton variant="secondary" size="sm" class="w-full" @click="openProgressEdit">
              Edit Progress
            </NordButton>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-text-muted text-sm mb-3">No progress tracked yet</p>
            <NordButton variant="secondary" size="sm" @click="openProgressEdit">
              Add Progress
            </NordButton>
          </div>
        </NordCard>

        <NuxtLink :to="`/practice/session?instrument=${song.instrumentType}&song=${songId}`">
          <NordButton variant="primary" class="w-full">Practice This Song</NordButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Edit Modal -->
    <NordModal :open="showEditModal" title="Edit Song" @close="showEditModal = false">
      <form class="space-y-4" @submit.prevent="saveEdit">
        <div>
          <label class="block text-sm text-text-muted mb-1">Title</label>
          <input
            v-model="editForm.title"
            type="text"
            required
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Artist</label>
          <input
            v-model="editForm.artist"
            type="text"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-text-muted mb-1">Instrument</label>
            <select
              v-model="editForm.instrumentType"
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
              v-model="editForm.difficulty"
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
            v-model="editForm.format"
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
            v-model="editForm.notationData"
            rows="4"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <NordButton variant="ghost" type="button" @click="showEditModal = false">Cancel</NordButton>
          <NordButton variant="primary" type="submit">Save Changes</NordButton>
        </div>
      </form>
    </NordModal>

    <!-- Delete Confirmation -->
    <NordModal :open="showDeleteConfirm" title="Delete Song?" @close="showDeleteConfirm = false">
      <p class="text-text-muted mb-4">
        Are you sure you want to delete "{{ song.title }}"? This action cannot be undone.
      </p>
      <div class="flex justify-end gap-3">
        <NordButton variant="ghost" @click="showDeleteConfirm = false">Cancel</NordButton>
        <NordButton variant="danger" @click="deleteSong">Delete Song</NordButton>
      </div>
    </NordModal>

    <!-- Progress Edit Modal -->
    <NordModal :open="showProgressEditModal" title="Edit Progress" @close="showProgressEditModal = false">
      <form class="space-y-4" @submit.prevent="saveProgressEdit">
        <div>
          <label class="block text-sm text-text-muted mb-1">Completion (%)</label>
          <input
            v-model.number="progressEditForm.completionPercent"
            type="number"
            min="0"
            max="100"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="range"
            v-model.number="progressEditForm.completionPercent"
            min="0"
            max="100"
            class="w-full mt-2"
          />
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Max Tempo (BPM)</label>
          <input
            v-model.number="progressEditForm.maxTempoBpm"
            type="number"
            min="1"
            placeholder="e.g., 120"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Practice Sessions</label>
          <input
            v-model.number="progressEditForm.practiceCount"
            type="number"
            min="0"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label class="block text-sm text-text-muted mb-1">Last Practiced</label>
          <input
            v-model="progressEditForm.lastPracticedAt"
            type="datetime-local"
            class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <NordButton variant="ghost" type="button" @click="showProgressEditModal = false">Cancel</NordButton>
          <NordButton variant="primary" type="submit">Save Progress</NordButton>
        </div>
      </form>
    </NordModal>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-text-muted">Song not found.</p>
    <NuxtLink to="/songs" class="text-primary hover:underline mt-2 inline-block">
      Back to Song Library
    </NuxtLink>
  </div>
</template>
