import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const { rows } = await pool.query(`
  select w.id, w.name, u.email
  from workspaces w
  join workspace_members wm on wm.workspace_id = w.id
  join users u on u.id = wm.user_id
  where wm.role = 'owner'
  order by w.created_at
`)
console.log(JSON.stringify(rows, null, 2))
await pool.end()