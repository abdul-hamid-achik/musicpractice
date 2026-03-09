import { clearAuthCookie } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    clearAuthCookie(event)
    return { success: true }
  } catch (error) {
    return handleApiError(error, { route: '/api/auth/logout' })
  }
})
