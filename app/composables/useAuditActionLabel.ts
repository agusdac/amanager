/** Maps `audit_events.action` codes to localized labels (team activity feed). */
export function useAuditActionLabel() {
  const { t, te } = useI18n()

  function auditActionLabel(action: string): string {
    const parts = action.split('.')
    if (parts.length === 2) {
      const key = `team.audit.${parts[0]}.${parts[1]}`
      if (te(key)) return t(key)
    }
    const genericKey = `team.audit.generic.${action}`
    if (te(genericKey)) return t(genericKey)
    return t('team.audit.unknown', { action })
  }

  return { auditActionLabel }
}