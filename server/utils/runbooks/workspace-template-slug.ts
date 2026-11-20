import { and, eq, isNull } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { runbookTemplates } from '../../../db/schema'
import type * as schema from '../../../db/schema'
import { slugify } from '../slug'

export async function uniqueWorkspaceTemplateSlug(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  title: string,
  excludeTemplateId?: string,
): Promise<string> {
  const base = slugify(title)
  let candidate = base
  let n = 0
  while (true) {
    const [inWorkspace] = await db
      .select({ id: runbookTemplates.id })
      .from(runbookTemplates)
      .where(and(eq(runbookTemplates.workspaceId, workspaceId), eq(runbookTemplates.slug, candidate)))
      .limit(1)
    if (inWorkspace && inWorkspace.id !== excludeTemplateId) {
      n += 1
      candidate = `${base}-${n}`
      continue
    }
    const [systemSlug] = await db
      .select({ id: runbookTemplates.id })
      .from(runbookTemplates)
      .where(and(isNull(runbookTemplates.workspaceId), eq(runbookTemplates.slug, candidate)))
      .limit(1)
    if (systemSlug) {
      n += 1
      candidate = `${base}-${n}`
      continue
    }
    if (!inWorkspace || inWorkspace.id === excludeTemplateId) return candidate
    n += 1
    candidate = `${base}-${n}`
  }
}