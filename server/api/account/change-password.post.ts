import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, createValidationError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const currentUser = await requireAuth(event)
    const body = await readBody(event)

    const { currentPassword, newPassword } = body || {}

    // Validate input
    if (!currentPassword || !newPassword) {
      throw createApiError('Current password and new password are required', 400)
    }

    const errors: Record<string, string[]> = {}

    // Validate new password length
    if (newPassword.length < 8) {
      errors.newPassword = ['New password must be at least 8 characters long']
    }

    if (Object.keys(errors).length > 0) {
      throw createValidationError('Validation failed', errors)
    }

    // Get current user with password hash
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1)

    if (!user) {
      throw createApiError('User not found', 404)
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!validPassword) {
      throw createApiError('Current password is incorrect', 401)
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning()

    if (!updatedUser) {
      throw createApiError('Failed to change password', 500)
    }

    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    return handleApiError(error, { route: '/api/account/change-password', operation: 'change_password' })
  }
})
