import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { workspaceMembers, workspaces } from '../../db/schema'
import type * as schema from '../../db/schema'

export async function findPersonalWorkspaceId(
  db: NodePgDatabase<typeof schema>,
  userId: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaces.type, 'personal')))
    .limit(1)
  return rows[0]?.id ?? null
}

export async function assertWorkspaceMember(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  workspaceId: string,
): Promise<{ role: string } | null> {
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1)
  return row ?? null
}

export async function isWorkspaceMember(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const row = await assertWorkspaceMember(db, userId, workspaceId)
  return row !== null
}