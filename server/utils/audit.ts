import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { auditEvents } from '../../db/schema'
import type * as schema from '../../db/schema'

type SessionActor = {
  workspaceId: string
  userId: string
}

export async function recordAudit(
  db: NodePgDatabase<typeof schema>,
  session: SessionActor,
  input: {
    entityType: string
    entityId?: string | null
    action: string
    safeDiff?: Record<string, unknown> | null
  },
) {
  await db.insert(auditEvents).values({
    workspaceId: session.workspaceId,
    actorUserId: session.userId,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    action: input.action,
    safeDiffJson: input.safeDiff ?? null,
  })
}