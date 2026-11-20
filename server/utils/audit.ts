import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { auditEvents } from '../../db/schema'
import type * as schema from '../../db/schema'

type SessionActor = {
  workspaceId: string
  userId: string
}

/** `requireSession` returns `{ id }`; some callers pass `{ userId }` explicitly. */
export function resolveAuditActor(session: SessionActor | { workspaceId: string; id: string }): SessionActor {
  if ('userId' in session && session.userId) {
    return { workspaceId: session.workspaceId, userId: session.userId }
  }
  return { workspaceId: session.workspaceId, userId: session.id }
}

export async function recordAudit(
  db: NodePgDatabase<typeof schema>,
  session: SessionActor | { workspaceId: string; id: string },
  input: {
    entityType: string
    entityId?: string | null
    action: string
    safeDiff?: Record<string, unknown> | null
  },
) {
  const actor = resolveAuditActor(session)
  await db.insert(auditEvents).values({
    workspaceId: actor.workspaceId,
    actorUserId: actor.userId,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    action: input.action,
    safeDiffJson: input.safeDiff ?? null,
  })
}