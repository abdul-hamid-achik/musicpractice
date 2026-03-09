import { sql } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()

    // Get daily practice minutes for the last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const rows = await db
      .select({
        date: sql<string>`DATE(${practiceSessions.startedAt})`.as('date'),
        totalMinutes: sql<number>`COALESCE(SUM(${practiceSessions.durationSeconds}) / 60, 0)`.as('total_minutes'),
        sessionCount: sql<number>`COUNT(*)`.as('session_count'),
      })
      .from(practiceSessions)
      .where(
        sql`${practiceSessions.userId} = ${user.id} AND ${practiceSessions.startedAt} >= ${fourteenDaysAgo.toISOString()}`,
      )
      .groupBy(sql`DATE(${practiceSessions.startedAt})`)
      .orderBy(sql`DATE(${practiceSessions.startedAt})`)

    // Fill in missing days with zero
    const result: { date: string; totalMinutes: number; sessionCount: number }[] = []
    const dataMap = new Map(rows.map((r) => [r.date, r]))

    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]!
      const existing = dataMap.get(dateStr)
      result.push({
        date: dateStr,
        totalMinutes: existing ? Number(existing.totalMinutes) : 0,
        sessionCount: existing ? Number(existing.sessionCount) : 0,
      })
    }

    return result
  } catch (error) {
    return handleApiError(error, { route: '/api/stats/weekly', operation: 'get' })
  }
})
