import { createError, type H3Error } from 'h3'
import { ZodError } from 'zod'

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export function isH3Error(err: unknown): err is H3Error {
  return Boolean(err && typeof err === 'object' && 'statusCode' in err)
}

/** Map Zod failures to a readable 400 in development. */
export function invalidInputError(err: ZodError) {
  const flat = err.flatten()
  return createError({
    statusCode: 400,
    statusMessage: 'Invalid input',
    data: isDev()
      ? { fields: flat.fieldErrors, formErrors: flat.formErrors }
      : undefined,
  })
}

/**
 * Log and return a safe API error. In localhost, exposes message + short stack in `data`.
 */
export function serverError(err: unknown, context: string): never {
  if (isH3Error(err)) {
    throw err
  }

  if (err instanceof ZodError) {
    throw invalidInputError(err)
  }

  const message = err instanceof Error ? err.message : String(err)
  if (isDev()) {
    console.error(`[${context}]`, err)
    throw createError({
      statusCode: 500,
      statusMessage: message || context,
      data: {
        context,
        hint: 'See server terminal for full stack trace.',
        stack: err instanceof Error ? err.stack?.split('\n').slice(0, 8) : undefined,
      },
    })
  }

  throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
}