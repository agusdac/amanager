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
      theme: user.theme,
      workspaceId: user.workspaceId,
      workspaceRole: user.workspaceRole,
      workspaceType: user.workspaceType,
      workspaceName: user.workspaceName,
    },
  }
})