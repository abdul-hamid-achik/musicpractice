<script setup lang="ts">
const theoryStore = useTheoryStore()
const search = ref('')

const filteredChords = computed(() => {
  if (!search.value) return theoryStore.chords
  const q = search.value.toLowerCase()
  return theoryStore.chords.filter(
    (c: any) =>
      c.name.toLowerCase().includes(q) ||
      (c.symbol && c.symbol.toLowerCase().includes(q)),
  )
})

onMounted(async () => {
  if (!theoryStore.chords.length) await theoryStore.fetchChords()
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-6">Chord Library</h1>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="Search chords..."
        class="w-full max-w-md bg-surface-alt text-text border border-border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>

    <ChordLibrary />
  </div>
</template>
