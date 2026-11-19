import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../schema'
import { seedProviders } from './providers'
import { seedMiniCriptico } from './minicriptico'

const { Pool } = pg

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const pool = new Pool({ connectionString: url })
  const db = drizzle(pool, { schema })

  await seedProviders(db)

  const workspaceArg = process.argv.find((a) => a.startsWith('--workspace='))
  const workspaceId = workspaceArg?.split('=')[1]
  if (workspaceArg) {
    if (!workspaceId) throw new Error('--workspace=<uuid> required')
    await seedMiniCriptico(db, workspaceId)
    console.log('Mini Críptico seed applied to workspace', workspaceId)
  } else {
    console.log('Providers seeded. Pass --workspace=<uuid> for Mini Críptico demo data.')
  }

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})