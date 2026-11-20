import type { STEP_RESULT_STATUSES } from '../../shared/schemas/runbooks'

type StepStatus = (typeof STEP_RESULT_STATUSES)[number]

const ringOff = 'ring-offset-1 dark:ring-offset-stone-900'

export const STEP_STATUS_UI: Record<
  StepStatus,
  { badge: string; button: string; buttonActive: string }
> = {
  todo: {
    badge: `bg-surface-soft text-stone-800 dark:text-stone-200 ring-stone-200 dark:ring-stone-600`,
    button: 'border-rule bg-surface text-ink-secondary hover:bg-surface-muted',
    buttonActive: `border-stone-500 bg-surface-soft text-ink ring-2 ring-stone-400 ${ringOff}`,
  },
  blocked: {
    badge: 'bg-red-50 text-red-900 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800',
    button:
      'border-red-200 bg-red-50/50 text-red-900 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60',
    buttonActive: `border-red-600 bg-red-100 text-red-950 ring-2 ring-red-400 ${ringOff} dark:bg-red-900/50 dark:text-red-100`,
  },
  in_progress: {
    badge: 'bg-amber-50 text-amber-950 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800',
    button:
      'border-amber-200 bg-amber-50/50 text-amber-950 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60',
    buttonActive: `border-amber-600 bg-amber-100 text-amber-950 ring-2 ring-amber-400 ${ringOff} dark:bg-amber-900/40 dark:text-amber-100`,
  },
  done: {
    badge: 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800',
    button:
      'border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60',
    buttonActive: `border-emerald-600 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-400 ${ringOff} dark:bg-emerald-900/40 dark:text-emerald-100`,
  },
  skipped: {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600',
    button:
      'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
    buttonActive: `border-slate-500 bg-slate-200 text-slate-900 ring-2 ring-slate-400 ${ringOff} dark:bg-slate-700 dark:text-slate-100`,
  },
  failed: {
    badge: 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800',
    button:
      'border-rose-200 bg-rose-50/50 text-rose-900 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60',
    buttonActive: `border-rose-600 bg-rose-100 text-rose-950 ring-2 ring-rose-400 ${ringOff} dark:bg-rose-900/40 dark:text-rose-100`,
  },
}

export function stepStatusUi(status: string): (typeof STEP_STATUS_UI)[StepStatus] {
  return STEP_STATUS_UI[status as StepStatus] ?? STEP_STATUS_UI.todo
}