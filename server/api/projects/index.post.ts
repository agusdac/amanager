import { createProjectSchema } from '../../../shared/schemas/project'
import { projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'
import { slugify } from '../../utils/slug'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const db = useDb()
  const baseSlug = slugify(parsed.data.name)
  let slug = baseSlug
  let attempt = 0

  while (attempt < 5) {
    try {
      const [project] = await db
        .insert(projects)
        .values({
          workspaceId: session.workspaceId,
          createdByUserId: session.id,
          slug,
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          websiteUrl: parsed.data.websiteUrl || null,
        })
        .returning()
      return { project }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === '23505') {
        attempt += 1
        slug = `${baseSlug}-${attempt}`
        continue
      }
      throw err
    }
  }

  throw createError({ statusCode: 500, statusMessage: 'Could not create project' })
})