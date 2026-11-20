import { and, asc, eq, isNull } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { runbookSteps, runbookTemplates, runbooks } from '../../../db/schema'
import type * as schema from '../../../db/schema'
import type { TemplateStepDef } from './generator'
import { exportFilename, writeMarkdownAttachment } from './export'

export async function listVisibleRunbookSteps(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  runbookId: string,
) {
  return db
    .select()
    .from(runbookSteps)
    .where(
      and(
        eq(runbookSteps.runbookId, runbookId),
        eq(runbookSteps.workspaceId, workspaceId),
        isNull(runbookSteps.hiddenAt),
      ),
    )
    .orderBy(asc(runbookSteps.position), asc(runbookSteps.createdAt))
}

export async function listAllRunbookSteps(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  runbookId: string,
) {
  return db
    .select()
    .from(runbookSteps)
    .where(and(eq(runbookSteps.runbookId, runbookId), eq(runbookSteps.workspaceId, workspaceId)))
    .orderBy(asc(runbookSteps.position))
}

export async function templateStepsForRunbook(
  db: NodePgDatabase<typeof schema>,
  runbook: typeof runbooks.$inferSelect,
): Promise<TemplateStepDef[]> {
  if (!runbook.templateId) return []
  const [tpl] = await db
    .select()
    .from(runbookTemplates)
    .where(eq(runbookTemplates.id, runbook.templateId))
    .limit(1)
  return (tpl?.schemaJson as { steps?: TemplateStepDef[] })?.steps ?? []
}

export function exportLocaleFromEvent(event: H3Event): string {
  return getHeader(event, 'accept-language')?.split(',')[0]?.slice(0, 2) ?? 'en'
}

export function pendingCountInBodies(bodies: string[]): number {
  return bodies.filter((b) => b.includes('Pending in inventory')).length
}

export function respondMarkdownExport(event: H3Event, projectSlug: string, markdown: string) {
  writeMarkdownAttachment(event, exportFilename(projectSlug), markdown)
  return markdown
}