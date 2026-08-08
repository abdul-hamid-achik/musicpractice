import { eq, inArray, sql } from 'drizzle-orm';
import {
  users,
  studioMembers,
  practiceSessions,
  instruments,
  assignments,
} from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { requireOwnedStudio } from '../../utils/studio';
import { handleApiError } from '../../utils/errors';

const WEEK_DAYS = 7;

interface RosterRow {
  userId: string;
  name: string;
  username: string;
  joinedAt: Date;
  currentStreak: number;
  minutesThisWeek: number;
  topInstrument: string | null;
  assignmentsOpen: number;
  assignmentsCompletedThisWeek: number;
  status: 'on' | 'near' | 'off';
}

/**
 * The Board: per-student practice minutes over the trailing 7 days
 * (matching the rolling windows used by /api/stats), streaks, and
 * assignment progress for the teacher's studio.
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const db = useDb();
    const studio = await requireOwnedStudio(db, user);

    const members = await db
      .select({
        userId: studioMembers.userId,
        joinedAt: studioMembers.joinedAt,
        name: users.name,
        username: users.username,
        currentStreak: users.currentStreak,
      })
      .from(studioMembers)
      .innerJoin(users, eq(studioMembers.userId, users.id))
      .where(eq(studioMembers.studioId, studio.id));

    if (members.length === 0) {
      return { studio, roster: [] };
    }

    const memberIds = members.map((m) => m.userId);
    const weekStart = new Date(Date.now() - WEEK_DAYS * 24 * 60 * 60 * 1000);

    // Practice minutes per student and per instrument over the window.
    // A single grouped query serves both the total and the top instrument.
    const minuteRows = await db
      .select({
        userId: practiceSessions.userId,
        instrumentType: instruments.type,
        minutes: sql<number>`COALESCE(SUM(${practiceSessions.durationSeconds}) / 60, 0)`,
      })
      .from(practiceSessions)
      .innerJoin(instruments, eq(practiceSessions.instrumentId, instruments.id))
      .where(
        sql`${inArray(practiceSessions.userId, memberIds)} AND ${practiceSessions.startedAt} >= ${weekStart.toISOString()}`,
      )
      .groupBy(practiceSessions.userId, instruments.type);

    const assignmentRows = await db
      .select({
        studentId: assignments.studentId,
        completedAt: assignments.completedAt,
      })
      .from(assignments)
      .where(eq(assignments.studioId, studio.id));

    const roster: RosterRow[] = members.map((member) => {
      const memberMinutes = minuteRows.filter((r) => r.userId === member.userId);
      const minutesThisWeek = memberMinutes.reduce((sum, r) => sum + Number(r.minutes), 0);
      const top = memberMinutes.reduce(
        (best, r) => (Number(r.minutes) > Number(best?.minutes ?? -1) ? r : best),
        null as (typeof memberMinutes)[number] | null,
      );

      const memberAssignments = assignmentRows.filter((a) => a.studentId === member.userId);
      const assignmentsOpen = memberAssignments.filter((a) => !a.completedAt).length;
      const assignmentsCompletedThisWeek = memberAssignments.filter(
        (a) => a.completedAt && a.completedAt.getTime() >= weekStart.getTime(),
      ).length;

      const target = studio.weeklyTargetMinutes;
      const status: RosterRow['status'] =
        minutesThisWeek >= target ? 'on' : minutesThisWeek >= target / 2 ? 'near' : 'off';

      return {
        userId: member.userId,
        name: member.name,
        username: member.username,
        joinedAt: member.joinedAt,
        currentStreak: member.currentStreak,
        minutesThisWeek,
        topInstrument: top?.instrumentType ?? null,
        assignmentsOpen,
        assignmentsCompletedThisWeek,
        status,
      };
    });

    roster.sort((a, b) => b.minutesThisWeek - a.minutesThisWeek);

    return { studio, roster };
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/roster', operation: 'list' });
  }
});
