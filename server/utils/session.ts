import type { H3Event } from 'h3'
import { and, eq, gt } from 'drizzle-orm'
import { sessions, users, workspaceMembers, workspaces } from '../../db/schema'
import { hashToken, randomToken } from './crypto'
import { useDb } from './db'
import { assertWorkspaceMember, findPersonalWorkspaceId } from './workspace-membership'

export const SESSION_COOKIE = 'am_session'
const SESSION_DAYS = 14

export type SessionUser = {
  id: string
  email: string
  name: string
  locale: string
  theme: string
  workspaceId: string
  workspaceRole: string
  workspaceType: string
  workspaceName: string
}

export async function resolveActiveWorkspace(
  db: ReturnType<typeof useDb>,
  userId: string,
  sessionId: string,
  activeWorkspaceId: string | null,
): Promise<string> {
  if (activeWorkspaceId) {
    const member = await assertWorkspaceMember(db, userId, activeWorkspaceId)
    if (member) return activeWorkspaceId
  }
  const personalId = await findPersonalWorkspaceId(db, userId)
  if (personalId) {
    await db.update(sessions).set({ activeWorkspaceId: personalId }).where(eq(sessions.id, sessionId))
    return personalId
  }
  const [any] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1)
  if (!any) {
    throw createError({ statusCode: 500, statusMessage: 'No workspace membership' })
  }
  await db.update(sessions).set({ activeWorkspaceId: any.workspaceId }).where(eq(sessions.id, sessionId))
  return any.workspaceId
}

export async function createSession(
  event: H3Event,
  userId: string,
  activeWorkspaceId?: string,
): Promise<void> {
  const db = useDb()
  const token = randomToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  let workspaceId = activeWorkspaceId
  if (!workspaceId) {
    workspaceId = (await findPersonalWorkspaceId(db, userId)) ?? undefined
  }
  if (workspaceId) {
    const member = await assertWorkspaceMember(db, userId, workspaceId)
    if (!member) workspaceId = undefined
  }

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    activeWorkspaceId: workspaceId ?? null,
  })

  const secure = process.env.NODE_ENV === 'production'
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function getSessionRow(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const db = useDb()
  const now = new Date()
  const tokenHash = hashToken(token)

  const rows = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
      theme: users.theme,
      activeWorkspaceId: sessions.activeWorkspaceId,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1)

  return rows[0] ?? null
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const row = await getSessionRow(event)
  if (!row) return null

  const db = useDb()
  const workspaceId = await resolveActiveWorkspace(
    db,
    row.userId,
    row.sessionId,
    row.activeWorkspaceId,
  )

  const detail = await db
    .select({
      workspaceRole: workspaceMembers.role,
      workspaceType: workspaces.type,
      workspaceName: workspaces.name,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(eq(workspaceMembers.userId, row.userId), eq(workspaceMembers.workspaceId, workspaceId)),
    )
    .limit(1)

  const w = detail[0]
  if (!w) return null

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    locale: row.locale,
    theme: row.theme,
    workspaceId,
    workspaceRole: w.workspaceRole,
    workspaceType: w.workspaceType,
    workspaceName: w.workspaceName,
  }
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    const db = useDb()
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function requireSession(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

export async function setActiveWorkspaceForSession(
  event: H3Event,
  userId: string,
  workspaceId: string,
): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return
  const db = useDb()
  await db
    .update(sessions)
    .set({ activeWorkspaceId: workspaceId })
    .where(and(eq(sessions.tokenHash, hashToken(token)), eq(sessions.userId, userId)))
}