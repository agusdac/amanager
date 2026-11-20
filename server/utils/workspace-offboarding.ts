import { and, eq, ne, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { workspaceMembers } from '../../db/schema'
import type * as schema from '../../db/schema'

export async function countOwners(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
): Promise<number> {
  const [{ value }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.role, 'owner')))
  return value ?? 0
}

export async function isOnlyOwner(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const owners = await countOwners(db, workspaceId)
  if (owners !== 1) return false
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.role, 'owner'),
      ),
    )
    .limit(1)
  return !!row
}