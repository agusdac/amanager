import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    return { user: null }
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      workspaceId: user.workspaceId,
      workspaceRole: user.workspaceRole,
    },
  }
})