export type ExportStep = {
  position: number
  title: string
  bodyMarkdown: string
  risk: string
  stepKey?: string
}

export type RunbookExportInput = {
  title: string
  projectName: string
  projectSlug: string
  templateSlug: string | null
  templateVersion: number | null
  overviewMarkdown: string | null
  generatedAt: Date
  locale: string
  pendingCount: number
  unverifiedAssetCount: number
  contentBinding?: string | null
  steps: ExportStep[]
}

function isPendingBody(body: string): boolean {
  return body.includes('**Pending in inventory**')
}

export function buildRunbookMarkdown(input: RunbookExportInput): string {
  const pending = input.steps.filter((s) => isPendingBody(s.bodyMarkdown)).length
  const lines: string[] = [
    `# ${input.title}`,
    '',
    `> Generated ${input.generatedAt.toISOString().slice(0, 10)} · locale \`${input.locale}\` · project **${input.projectName}**`,
  ]
  if (input.templateSlug) {
    lines.push(`> Template: \`${input.templateSlug}\` v${input.templateVersion ?? 1}`)
  }
  if (input.contentBinding) {
    lines.push(`> Execution mode: \`${input.contentBinding}\``)
  }
  lines.push(`> Pending steps in body: ${pending} · Unverified assets in scope: ${input.unverifiedAssetCount}`)
  lines.push('', '---', '')

  if (input.overviewMarkdown?.trim()) {
    lines.push(input.overviewMarkdown.trim(), '', '---', '')
  }

  const sorted = [...input.steps].sort((a, b) => a.position - b.position)
  for (const [i, step] of sorted.entries()) {
    lines.push(`## ${i + 1}. ${step.title}`, '', step.bodyMarkdown, '')
  }

  lines.push(
    '---',
    '',
    '_Snapshot from Hilko. Changes in inventory do not update this file automatically._',
  )

  return lines.join('\n')
}

export function exportFilename(projectSlug: string): string {
  const safe = projectSlug.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60)
  return `SETUP_${safe || 'project'}.md`
}

export function writeMarkdownAttachment(event: import('h3').H3Event, filename: string, markdown: string) {
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
}