import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, createValidationError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const currentUser = await requireAuth(event)
    const body = await readBody(event)

    const { email, username, name } = body || {}

    // Validate input
    if (!email && !username && !name) {
      throw createApiError('At least one field (email, username, or name) is required', 400)
    }

    const errors: Record<string, string[]> = {}

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.email = ['Invalid email format']
      }
    }

    // Validate username length if provided
    if (username) {
      if (username.length < 3 || username.length > 30) {
        errors.username = ['Username must be between 3 and 30 characters']
      }
      // Check for valid characters (alphanumeric and underscore)
      const usernameRegex = /^[a-zA-Z0-9_]+$/
      if (!usernameRegex.test(username)) {
        errors.username = ['Username can only contain letters, numbers, and underscores']
      }
    }

    // Validate name if provided
    if (name) {
      if (name.length < 1 || name.length > 50) {
        errors.name = ['Display name must be between 1 and 50 characters']
      }
    }

    if (Object.keys(errors).length > 0) {
      throw createValidationError('Validation failed', errors)
    }

    // Check for uniqueness if email is being changed
    if (email && email !== currentUser.email) {
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
      if (existingEmail) {
        throw createApiError('Email already in use', 409)
      }
    }

    // Check for uniqueness if username is being changed
    if (username && username !== currentUser.username) {
      const [existingUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1)
      if (existingUsername) {
        throw createApiError('Username already in use', 409)
      }
    }

    // Build update object
    const updateData: Record<string, string> = {}
    if (email) updateData.email = email
    if (username) updateData.username = username
    if (name) updateData.name = name

    // Perform update
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning()

    if (!updatedUser) {
      throw createApiError('Failed to update profile', 500)
    }

    const { passwordHash: _, ...safeUser } = updatedUser
    return safeUser
  } catch (error) {
    return handleApiError(error, { route: '/api/account/profile', operation: 'update_profile' })
  }
})
