import { sql } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const rows = await db
      .select({
        date: sql<string>`DATE(${practiceSessions.startedAt})`.as('date'),
        totalMinutes: sql<number>`COALESCE(SUM(${practiceSessions.durationSeconds}) / 60, 0)`.as('total_minutes'),
        sessionCount: sql<number>`COUNT(*)`.as('session_count'),
      })
      .from(practiceSessions)
      .where(
        sql`${practiceSessions.userId} = ${user.id} AND ${practiceSessions.startedAt} >= ${ninetyDaysAgo.toISOString()}`,
      )
      .groupBy(sql`DATE(${practiceSessions.startedAt})`)
      .orderBy(sql`DATE(${practiceSessions.startedAt})`)

    return rows
  } catch (error) {
    return handleApiError(error, { route: '/api/stats/heatmap', operation: 'get' })
  }
})
