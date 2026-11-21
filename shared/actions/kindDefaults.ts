import type { ActionKind } from '../schemas/actions'

export const DEFAULT_ACTION_KIND: ActionKind = 'command'

export function defaultBodyForKind(kind: ActionKind): string {
  switch (kind) {
    case 'command':
      return '```bash\n\n```'
    case 'checklist':
      return '- [ ] \n- [ ] \n- [ ] '
    case 'reference':
      return '## \n\n'
    default:
      return ''
  }
}

export function shouldApplyKindTemplate(currentBody: string, previousKind: ActionKind | ''): boolean {
  const trimmed = currentBody.trim()
  if (!trimmed) return true
  if (previousKind) {
    return trimmed === defaultBodyForKind(previousKind).trim()
  }
  return false
}