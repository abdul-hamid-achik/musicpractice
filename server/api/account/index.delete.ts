import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { requireAuth, clearAuthCookie } from '../../utils/auth'
import { createApiError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const currentUser = await requireAuth(event)
    const body = await readBody(event)

    const { confirmation } = body || {}

    // Require confirmation
    if (confirmation !== 'DELETE') {
      throw createApiError('Confirmation required. Please set confirmation to "DELETE"', 400)
    }

    // Delete user (cascade will handle related records)
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, currentUser.id))
      .returning()

    if (!deletedUser) {
      throw createApiError('Failed to delete account', 500)
    }

    // Clear auth cookie
    clearAuthCookie(event)

    return { success: true, message: 'Account deleted successfully' }
  } catch (error) {
    return handleApiError(error, { route: '/api/account', operation: 'delete_account' })
  }
})
