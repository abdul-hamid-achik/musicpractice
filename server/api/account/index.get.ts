import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    return user
  } catch (error) {
    return handleApiError(error, { route: '/api/account' })
  }
})
