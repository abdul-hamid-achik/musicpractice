import { sql } from 'drizzle-orm';
import { practiceSessions } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { createApiError, handleApiError } from '../../utils/errors';

const DEFAULT_DAYS = 14;
const MIN_DAYS = 1;
const MAX_DAYS = 90;

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const db = useDb();
    const query = getQuery(event);

    // Parse and clamp ?days (default 14, min 1, max 90)
    let days = DEFAULT_DAYS;
    if (query.days !== undefined) {
      const parsed = Number.parseInt(query.days as string, 10);
      if (Number.isNaN(parsed)) {
        throw createApiError('days must be an integer', 400);
      }
      days = Math.min(MAX_DAYS, Math.max(MIN_DAYS, parsed));
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    // Anchor to the start of the day so the range covers exactly `days` days.
    startDate.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        date: sql<string>`DATE(${practiceSessions.startedAt})`.as('date'),
        totalMinutes: sql<number>`COALESCE(SUM(${practiceSessions.durationSeconds}) / 60, 0)`.as(
          'total_minutes',
        ),
        sessionCount: sql<number>`COUNT(*)`.as('session_count'),
      })
      .from(practiceSessions)
      .where(
        sql`${practiceSessions.userId} = ${user.id} AND ${practiceSessions.startedAt} >= ${startDate.toISOString()}`,
      )
      .groupBy(sql`DATE(${practiceSessions.startedAt})`)
      .orderBy(sql`DATE(${practiceSessions.startedAt})`);

    // Fill in missing days with zero
    const result: { date: string; totalMinutes: number; sessionCount: number }[] = [];
    const dataMap = new Map(rows.map((r) => [r.date, r]));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      const existing = dataMap.get(dateStr);
      result.push({
        date: dateStr,
        totalMinutes: existing ? Number(existing.totalMinutes) : 0,
        sessionCount: existing ? Number(existing.sessionCount) : 0,
      });
    }

    return result;
  } catch (error) {
    return handleApiError(error, { route: '/api/stats/daily', operation: 'get' });
  }
});
