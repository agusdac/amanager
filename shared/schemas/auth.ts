import { z } from 'zod'

const userLocaleSchema = z.enum(['en', 'es'])
const userThemeSchema = z.enum(['light', 'dark'])

export const registerSchema = z
  .object({
    email: z.string().email().max(320),
    password: z.string().min(10).max(128),
    passwordConfirm: z.string().min(10).max(128),
    name: z.string().min(1).max(120),
    locale: userLocaleSchema.optional(),
    theme: userThemeSchema.optional(),
    inviteToken: z.string().min(16).max(128).optional(),
    /** Public signup: personal inventory only, or new team (no personal unless includePersonalWorkspace). */
    signupPlan: z.enum(['personal', 'team']).optional(),
    teamName: z.string().min(1).max(120).optional(),
    includePersonalWorkspace: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'password_mismatch',
        path: ['passwordConfirm'],
      })
    }
    if (!data.inviteToken) {
      if (!data.signupPlan) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'signup_plan_required', path: ['signupPlan'] })
      } else if (data.signupPlan === 'team' && !data.teamName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'team_name_required', path: ['teamName'] })
      }
    }
  })

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(10).max(128),
})