import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    return await requireAuth(event)
  } catch (error) {
    return handleApiError(error, { route: '/api/auth/me' })
  }
})
