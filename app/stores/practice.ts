import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PracticeSession } from '#shared/types/practice';

export const usePracticeStore = defineStore('practice', () => {
  const sessions = ref<PracticeSession[]>([]);
  const isLoading = ref(false);
  const { showError } = useToast();

  const totalPracticeTime = computed(() =>
    sessions.value.reduce((sum, s) => sum + (s.durationSeconds || 0), 0),
  );

  const sessionsThisWeek = computed(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessions.value.filter((s) => new Date(s.startedAt) >= weekAgo);
  });

  const recentSessions = computed(() =>
    [...sessions.value]
      .toSorted((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 10),
  );

  const fetchSessions = async () => {
    isLoading.value = true;
    try {
      const res = await $fetch<{ data: PracticeSession[]; total: number }>('/api/sessions');
      sessions.value = res.data;
    } catch {
      showError('Failed to load practice sessions');
    } finally {
      isLoading.value = false;
    }
  };

  const createSession = async (data: Omit<PracticeSession, 'id' | 'createdAt'>) => {
    const session = await $fetch<PracticeSession>('/api/sessions', { method: 'POST', body: data });
    sessions.value.push(session);
    return session;
  };

  return {
    sessions,
    isLoading,
    totalPracticeTime,
    sessionsThisWeek,
    recentSessions,
    fetchSessions,
    createSession,
  };
});
