import { and, eq, isNull, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { runbookTemplates } from '../../../db/schema'
import type * as schema from '../../../db/schema'

export function templateVisibleToWorkspace(workspaceId: string) {
  return or(isNull(runbookTemplates.workspaceId), eq(runbookTemplates.workspaceId, workspaceId))
}

export async function getTemplateBySlugForWorkspace(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  slug: string,
) {
  const [row] = await db
    .select()
    .from(runbookTemplates)
    .where(and(eq(runbookTemplates.slug, slug), templateVisibleToWorkspace(workspaceId)))
    .limit(1)
  return row ?? null
}

export async function assertWorkspaceTemplate(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  slug: string,
) {
  const row = await getTemplateBySlugForWorkspace(db, workspaceId, slug)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  if (!row.workspaceId || row.workspaceId !== workspaceId) {
    throw createError({ statusCode: 403, statusMessage: 'System templates cannot be edited' })
  }
  return row
}