<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

interface StudioInfo {
  id: string;
  name: string;
  weeklyTargetMinutes: number;
}

interface StudioContext {
  role: 'teacher' | 'student' | null;
  studio: StudioInfo | null;
  memberCount: number | null;
}

interface RosterRow {
  userId: string;
  name: string;
  username: string;
  currentStreak: number;
  minutesThisWeek: number;
  topInstrument: string | null;
  assignmentsOpen: number;
  assignmentsCompletedThisWeek: number;
  status: 'on' | 'near' | 'off';
}

interface StudentAssignment {
  id: string;
  title: string;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  studioName: string;
}

const FREE_STUDENT_LIMIT = 3;

const toast = useToast();

const isLoading = ref(true);
const context = ref<StudioContext>({ role: null, studio: null, memberCount: null });
const roster = ref<RosterRow[]>([]);
const myAssignments = ref<StudentAssignment[]>([]);

// Create-studio form
const newStudioName = ref('');
const newStudioTarget = ref(90);
const isCreating = ref(false);

// Invite link
const inviteUrl = ref<string | null>(null);
const isMintingInvite = ref(false);

// Assignment modal
const assignTarget = ref<RosterRow | null>(null);
const assignmentTitle = ref('');
const assignmentNotes = ref('');
const isAssigning = ref(false);

// Two-step remove confirmation (no native confirm dialogs)
const armedRemove = ref<string | null>(null);

const ledClass: Record<RosterRow['status'], string> = {
  on: 'bg-success shadow-[0_0_6px_var(--color-success)]',
  near: 'bg-primary shadow-[0_0_6px_var(--color-primary)]',
  off: 'bg-error shadow-[0_0_6px_var(--color-error)]',
};

const barMax = computed(() => {
  const target = context.value.studio?.weeklyTargetMinutes ?? 90;
  const top = Math.max(0, ...roster.value.map((r) => r.minutesThisWeek));
  return Math.max(target * 1.5, top);
});

function barWidth(minutes: number): string {
  if (barMax.value === 0) return '0%';
  return `${Math.min(minutes / barMax.value, 1) * 100}%`;
}

function apiMessage(error: unknown): string {
  const e = error as { data?: { message?: string }; message?: string };
  return e?.data?.message || 'Something went wrong. Please try again.';
}

async function loadContext() {
  isLoading.value = true;
  try {
    context.value = await $fetch<StudioContext>('/api/studio');
    if (context.value.role === 'teacher') {
      const data = await $fetch<{ studio: StudioInfo; roster: RosterRow[] }>('/api/studio/roster');
      context.value.studio = data.studio;
      roster.value = data.roster;
    } else if (context.value.role === 'student') {
      myAssignments.value = await $fetch<StudentAssignment[]>('/api/studio/assignments');
    }
  } catch (error) {
    toast.showError(apiMessage(error));
  } finally {
    isLoading.value = false;
  }
}

async function createStudio() {
  if (!newStudioName.value.trim()) return;
  isCreating.value = true;
  try {
    await $fetch('/api/studio', {
      method: 'POST',
      body: { name: newStudioName.value.trim(), weeklyTargetMinutes: newStudioTarget.value },
    });
    toast.showSuccess('Your studio is ready — invite your first student');
    await loadContext();
  } catch (error) {
    toast.showError(apiMessage(error));
  } finally {
    isCreating.value = false;
  }
}

async function mintInvite() {
  isMintingInvite.value = true;
  try {
    const invite = await $fetch<{ token: string }>('/api/studio/invite', { method: 'POST' });
    inviteUrl.value = `${window.location.origin}/join/${invite.token}`;
  } catch (error) {
    toast.showError(apiMessage(error));
  } finally {
    isMintingInvite.value = false;
  }
}

async function copyInvite() {
  if (!inviteUrl.value) return;
  await navigator.clipboard.writeText(inviteUrl.value);
  toast.showSuccess('Invite link copied');
}

function openAssignModal(student: RosterRow) {
  assignTarget.value = student;
  assignmentTitle.value = '';
  assignmentNotes.value = '';
}

async function submitAssignment() {
  if (!assignTarget.value || !assignmentTitle.value.trim()) return;
  isAssigning.value = true;
  try {
    await $fetch('/api/studio/assignments', {
      method: 'POST',
      body: {
        studentId: assignTarget.value.userId,
        title: assignmentTitle.value.trim(),
        notes: assignmentNotes.value.trim() || undefined,
      },
    });
    toast.showSuccess(`Assigned to ${assignTarget.value.name}`);
    assignTarget.value = null;
    await loadContext();
  } catch (error) {
    toast.showError(apiMessage(error));
  } finally {
    isAssigning.value = false;
  }
}

async function removeStudent(student: RosterRow) {
  if (armedRemove.value !== student.userId) {
    armedRemove.value = student.userId;
    setTimeout(() => {
      if (armedRemove.value === student.userId) armedRemove.value = null;
    }, 4000);
    return;
  }
  armedRemove.value = null;
  try {
    await $fetch(`/api/studio/members/${student.userId}`, { method: 'DELETE' });
    toast.showSuccess(`${student.name} removed from your studio`);
    await loadContext();
  } catch (error) {
    toast.showError(apiMessage(error));
  }
}

async function toggleAssignment(assignment: StudentAssignment) {
  try {
    await $fetch(`/api/studio/assignments/${assignment.id}`, {
      method: 'PATCH',
      body: { completed: !assignment.completedAt },
    });
    myAssignments.value = await $fetch<StudentAssignment[]>('/api/studio/assignments');
  } catch (error) {
    toast.showError(apiMessage(error));
  }
}

const openAssignments = computed(() => myAssignments.value.filter((a) => !a.completedAt));
const doneAssignments = computed(() => myAssignments.value.filter((a) => a.completedAt));

onMounted(loadContext);
</script>

<template>
  <div aria-live="polite">
    <div v-if="isLoading" class="py-16 text-center text-text-muted">Loading your studio…</div>

    <!-- ═══════ TEACHER: THE BOARD ═══════ -->
    <template v-else-if="context.role === 'teacher' && context.studio">
      <div class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-1 font-mono text-xs tracking-[0.25em] text-primary">THE BOARD</p>
          <h1 class="text-3xl font-bold text-text">{{ context.studio.name }}</h1>
        </div>
        <p class="font-mono text-xs tracking-[0.15em] text-text-muted">
          LAST 7 DAYS · TARGET {{ context.studio.weeklyTargetMinutes }} MIN
        </p>
      </div>

      <!-- Roster -->
      <div
        v-if="roster.length > 0"
        class="rounded-xl border border-border bg-surface-alt p-1.5"
        data-testid="studio-roster"
      >
        <ul class="divide-y divide-border/60">
          <li
            v-for="student in roster"
            :key="student.userId"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5"
          >
            <span class="h-2 w-2 shrink-0 rounded-full" :class="ledClass[student.status]" />
            <div class="w-32 shrink-0 sm:w-40">
              <p class="truncate text-sm font-medium text-text">{{ student.name }}</p>
              <p class="truncate font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                {{ student.topInstrument ?? 'no sessions yet' }}
              </p>
            </div>
            <div class="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-surface">
              <div
                class="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                :style="{ width: barWidth(student.minutesThisWeek) }"
              />
            </div>
            <span class="w-16 shrink-0 text-right font-mono text-xs text-text-muted">
              {{ student.minutesThisWeek }} min
            </span>
            <span
              class="hidden w-20 shrink-0 text-right font-mono text-xs text-text-muted md:inline"
              :title="`${student.assignmentsOpen} open assignments`"
            >
              {{ student.assignmentsOpen }} open
            </span>
            <div class="flex shrink-0 gap-2">
              <NordButton
                size="sm"
                variant="secondary"
                :testid="`assign-${student.username}`"
                @click="openAssignModal(student)"
              >
                Assign
              </NordButton>
              <NordButton
                size="sm"
                :variant="armedRemove === student.userId ? 'danger' : 'ghost'"
                @click="removeStudent(student)"
              >
                {{ armedRemove === student.userId ? 'Confirm' : 'Remove' }}
              </NordButton>
            </div>
          </li>
        </ul>
      </div>

      <!-- Empty roster -->
      <div
        v-else
        class="rounded-xl border border-border bg-surface-alt px-6 py-12 text-center"
      >
        <h2 class="text-xl font-bold text-text">No students yet</h2>
        <p class="mx-auto mt-2 max-w-md text-sm text-text-muted">
          Share an invite link and your students' practice will start showing up here.
        </p>
      </div>

      <!-- Invite -->
      <div class="mt-6 rounded-xl border border-border bg-card p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-semibold text-text">Invite students</h2>
            <p class="mt-0.5 text-sm text-text-muted">
              {{ context.memberCount ?? roster.length }} / {{ FREE_STUDENT_LIMIT }} students on the
              free plan
            </p>
          </div>
          <NordButton
            :loading="isMintingInvite"
            testid="mint-invite"
            @click="mintInvite"
          >
            {{ inviteUrl ? 'New invite link' : 'Create invite link' }}
          </NordButton>
        </div>
        <div
          v-if="inviteUrl"
          class="mt-4 flex flex-col gap-2 rounded-md border border-border bg-surface px-3 py-2 sm:flex-row sm:items-center"
        >
          <code class="min-w-0 flex-1 truncate font-mono text-xs text-text-muted">{{
            inviteUrl
          }}</code>
          <NordButton size="sm" variant="ghost" @click="copyInvite">Copy</NordButton>
        </div>
      </div>

      <!-- Assign modal -->
      <NordModal
        :open="assignTarget !== null"
        :title="assignTarget ? `Assign practice to ${assignTarget.name}` : ''"
        testid="assign-modal"
        @close="assignTarget = null"
      >
        <form class="space-y-4" @submit.prevent="submitAssignment">
          <div>
            <label for="assignment-title" class="mb-1 block text-sm font-medium text-text">
              What to practice
            </label>
            <input
              id="assignment-title"
              v-model="assignmentTitle"
              type="text"
              required
              maxlength="120"
              placeholder="e.g. Minuet in G — bars 1–16 at 70 bpm"
              class="w-full rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted/60"
              data-testid="assignment-title-input"
            />
          </div>
          <div>
            <label for="assignment-notes" class="mb-1 block text-sm font-medium text-text">
              Notes <span class="text-text-muted">(optional)</span>
            </label>
            <textarea
              id="assignment-notes"
              v-model="assignmentNotes"
              rows="3"
              maxlength="1000"
              placeholder="Watch the string crossings in bar 9."
              class="w-full rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted/60"
            />
          </div>
          <div class="flex justify-end gap-2">
            <NordButton variant="ghost" @click="assignTarget = null">Cancel</NordButton>
            <NordButton
              type="submit"
              :loading="isAssigning"
              :disabled="!assignmentTitle.trim()"
              testid="assignment-submit"
            >
              Assign
            </NordButton>
          </div>
        </form>
      </NordModal>
    </template>

    <!-- ═══════ STUDENT VIEW ═══════ -->
    <template v-else-if="context.role === 'student' && context.studio">
      <div class="mb-8">
        <p class="mb-1 font-mono text-xs tracking-[0.25em] text-primary">MY STUDIO</p>
        <h1 class="text-3xl font-bold text-text">{{ context.studio.name }}</h1>
        <p class="mt-1 text-text-muted">
          Your practice sessions count toward your teacher's board automatically.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-5">
        <h2 class="font-semibold text-text">This week's assignments</h2>
        <p v-if="myAssignments.length === 0" class="mt-3 text-sm text-text-muted">
          Nothing assigned yet. When your teacher assigns practice, it shows up here.
        </p>
        <ul v-else class="mt-4 space-y-2">
          <li
            v-for="assignment in [...openAssignments, ...doneAssignments]"
            :key="assignment.id"
            class="flex items-start gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
          >
            <input
              :id="`assignment-${assignment.id}`"
              type="checkbox"
              :checked="assignment.completedAt !== null"
              class="mt-1 h-4 w-4 accent-[var(--color-primary)]"
              @change="toggleAssignment(assignment)"
            />
            <label :for="`assignment-${assignment.id}`" class="min-w-0 flex-1 cursor-pointer">
              <span
                class="block text-sm font-medium"
                :class="assignment.completedAt ? 'text-text-muted line-through' : 'text-text'"
              >
                {{ assignment.title }}
              </span>
              <span v-if="assignment.notes" class="mt-0.5 block text-xs text-text-muted">
                {{ assignment.notes }}
              </span>
            </label>
          </li>
        </ul>
      </div>
    </template>

    <!-- ═══════ NO STUDIO YET ═══════ -->
    <template v-else>
      <div class="mb-8">
        <p class="mb-1 font-mono text-xs tracking-[0.25em] text-primary">STUDIO</p>
        <h1 class="text-3xl font-bold text-text">Teach with MusicPractice</h1>
        <p class="mt-1 max-w-xl text-text-muted">
          Start a studio to assign practice and see who actually practiced — or join one with an
          invite link from your teacher.
        </p>
      </div>

      <div class="grid gap-6 lg:max-w-4xl lg:grid-cols-2">
        <form
          class="rounded-xl border border-border bg-card p-6"
          @submit.prevent="createStudio"
        >
          <h2 class="text-lg font-bold text-text">Start your studio</h2>
          <div class="mt-4">
            <label for="studio-name" class="mb-1 block text-sm font-medium text-text">
              Studio name
            </label>
            <input
              id="studio-name"
              v-model="newStudioName"
              type="text"
              required
              maxlength="80"
              placeholder="e.g. Rivera Guitar Studio"
              class="w-full rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted/60"
              data-testid="studio-name-input"
            />
          </div>
          <div class="mt-4">
            <label for="studio-target" class="mb-1 block text-sm font-medium text-text">
              Weekly practice target (minutes per student)
            </label>
            <input
              id="studio-target"
              v-model.number="newStudioTarget"
              type="number"
              min="1"
              max="10000"
              class="w-32 rounded-md border border-border bg-surface px-3 py-2 text-text"
            />
          </div>
          <NordButton
            type="submit"
            class="mt-6"
            :loading="isCreating"
            :disabled="!newStudioName.trim()"
            testid="create-studio-submit"
          >
            Create studio — free
          </NordButton>
          <p class="mt-2 text-xs text-text-muted">
            Free for up to {{ FREE_STUDENT_LIMIT }} students.
          </p>
        </form>

        <div class="rounded-xl border border-border bg-surface-alt p-6">
          <h2 class="text-lg font-bold text-text">Joining as a student?</h2>
          <p class="mt-2 text-sm text-text-muted">
            Ask your teacher for an invite link — it looks like
            <code class="font-mono text-xs">{{ '/join/…' }}</code> — and open it while signed in.
            Your practice tools stay exactly the same; your teacher just gets to see your progress.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
