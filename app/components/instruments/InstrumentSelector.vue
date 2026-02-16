<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const instrumentStore = useInstrumentStore()

onMounted(() => {
  if (instrumentStore.instruments.length === 0) {
    instrumentStore.fetchInstruments()
  }
})

const instrumentEmoji: Record<string, string> = {
  guitar: '\uD83C\uDFB8',
  bass: '\uD83C\uDFB8',
  piano: '\uD83C\uDFB9',
  violin: '\uD83C\uDFBB',
}

function selectInstrument(id: string) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
    <button
      v-for="instrument in instrumentStore.instruments"
      :key="instrument.id"
      class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 bg-card hover:bg-surface-alt"
      :class="
        modelValue === instrument.id
          ? 'border-primary ring-2 ring-primary'
          : 'border-border'
      "
      @click="selectInstrument(instrument.id)"
    >
      <span class="text-3xl">
        {{ instrumentEmoji[instrument.type] || '\uD83C\uDFB5' }}
      </span>
      <span class="text-sm font-medium text-text">{{ instrument.name }}</span>
      <span class="text-xs text-text-muted capitalize">{{ instrument.type }}</span>
    </button>
  </div>
</template>
