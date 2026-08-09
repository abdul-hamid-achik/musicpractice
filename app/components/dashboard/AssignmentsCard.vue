<script setup lang="ts">
interface StudentAssignment {
  id: string;
  title: string;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  studioName: string;
}

const toast = useToast();
const assignments = ref<StudentAssignment[]>([]);
const isLoaded = ref(false);

const open = computed(() => assignments.value.filter((a) => !a.completedAt));

async function load() {
  try {
    assignments.value = await $fetch<StudentAssignment[]>('/api/studio/assignments');
  } catch {
    // Not in a studio (or offline) — the card simply doesn't render.
    assignments.value = [];
  } finally {
    isLoaded.value = true;
  }
}

async function complete(assignment: StudentAssignment) {
  try {
    await $fetch(`/api/studio/assignments/${assignment.id}`, {
      method: 'PATCH',
      body: { completed: true },
    });
    toast.showSuccess('Nice — marked as done');
    await load();
  } catch {
    toast.showError('Could not update the assignment. Please try again.');
  }
}

onMounted(load);
</script>

<template>
  <UiCard v-if="isLoaded && open.length > 0" title="From your teacher">
    <ul class="space-y-2">
      <li
        v-for="assignment in open"
        :key="assignment.id"
        class="flex items-start gap-3 rounded-md bg-surface-alt px-3 py-2.5"
      >
        <input
          :id="`dash-assignment-${assignment.id}`"
          type="checkbox"
          class="mt-1 h-4 w-4 accent-[var(--color-primary)]"
          @change="complete(assignment)"
        />
        <label :for="`dash-assignment-${assignment.id}`" class="min-w-0 flex-1 cursor-pointer">
          <span class="block text-sm font-medium text-text">{{ assignment.title }}</span>
          <span v-if="assignment.notes" class="mt-0.5 block text-xs text-text-muted">
            {{ assignment.notes }}
          </span>
        </label>
      </li>
    </ul>
    <template #footer>
      <NuxtLink to="/studio" class="text-primary text-sm hover:underline">My studio</NuxtLink>
    </template>
  </UiCard>
</template>
