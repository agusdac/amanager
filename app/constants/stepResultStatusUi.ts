import type { STEP_RESULT_STATUSES } from '../../shared/schemas/runbooks'

type StepStatus = (typeof STEP_RESULT_STATUSES)[number]

export const STEP_STATUS_UI: Record<
  StepStatus,
  { badge: string; button: string; buttonActive: string }
> = {
  todo: {
    badge: 'bg-stone-100 text-stone-800 ring-stone-200',
    button: 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
    buttonActive: 'border-stone-500 bg-stone-100 text-stone-900 ring-2 ring-stone-400 ring-offset-1',
  },
  blocked: {
    badge: 'bg-red-50 text-red-900 ring-red-200',
    button: 'border-red-200 bg-red-50/50 text-red-900 hover:bg-red-50',
    buttonActive: 'border-red-600 bg-red-100 text-red-950 ring-2 ring-red-400 ring-offset-1',
  },
  in_progress: {
    badge: 'bg-amber-50 text-amber-950 ring-amber-200',
    button: 'border-amber-200 bg-amber-50/50 text-amber-950 hover:bg-amber-50',
    buttonActive: 'border-amber-600 bg-amber-100 text-amber-950 ring-2 ring-amber-400 ring-offset-1',
  },
  done: {
    badge: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    button: 'border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50',
    buttonActive: 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-400 ring-offset-1',
  },
  skipped: {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    button: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    buttonActive: 'border-slate-500 bg-slate-200 text-slate-900 ring-2 ring-slate-400 ring-offset-1',
  },
  failed: {
    badge: 'bg-rose-50 text-rose-900 ring-rose-200',
    button: 'border-rose-200 bg-rose-50/50 text-rose-900 hover:bg-rose-50',
    buttonActive: 'border-rose-600 bg-rose-100 text-rose-950 ring-2 ring-rose-400 ring-offset-1',
  },
}

export function stepStatusUi(status: string): (typeof STEP_STATUS_UI)[StepStatus] {
  return STEP_STATUS_UI[status as StepStatus] ?? STEP_STATUS_UI.todo
}