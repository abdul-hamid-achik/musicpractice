import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  return await requireAuth(event)
})
