import type { H3Event } from 'h3'
import { and, eq, gt } from 'drizzle-orm'
import { sessions, users, workspaceMembers, workspaces } from '../../db/schema'
import { hashToken, randomToken } from './crypto'
import { useDb } from './db'

export const SESSION_COOKIE = 'am_session'
const SESSION_DAYS = 14

export type SessionUser = {
  id: string
  email: string
  name: string
  workspaceId: string
  workspaceRole: string
}

export async function createSession(event: H3Event, userId: string): Promise<void> {
  const db = useDb()
  const token = randomToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({ userId, tokenHash, expiresAt })

  const secure = process.env.NODE_ENV === 'production'
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    const db = useDb()
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const db = useDb()
  const now = new Date()
  const tokenHash = hashToken(token)

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      workspaceId: workspaces.id,
      workspaceRole: workspaceMembers.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now),
        eq(workspaces.type, 'personal'),
      ),
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    workspaceId: row.workspaceId,
    workspaceRole: row.workspaceRole,
  }
}

export async function requireSession(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}