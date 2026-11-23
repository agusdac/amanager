import { buildInventoryZip, emptyTemplateFiles } from '../../utils/import-bundle'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const files = emptyTemplateFiles()
  const zip = await buildInventoryZip(files)
  setHeader(event, 'content-type', 'application/zip')
  setHeader(event, 'content-disposition', 'attachment; filename="hilko-import-template.zip"')
  return zip
})