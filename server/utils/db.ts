import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../../db/schema'

const { Pool } = pg

let pool: pg.Pool | undefined

export function useDb() {
  if (!pool) {
    const config = useRuntimeConfig()
    const url = config.databaseUrl || process.env.DATABASE_URL
    if (!url) {
      throw createError({
        statusCode: 500,
        statusMessage: 'DATABASE_URL is not configured',
      })
    }
    pool = new Pool({ connectionString: url })
  }
  return drizzle(pool, { schema })
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = undefined
  }
}