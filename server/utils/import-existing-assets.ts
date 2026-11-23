import { sql } from 'drizzle-orm'
import type { useDb } from './db'

export type ExistingAssetForImport = {
  id: string
  name: string
  type: string
  externalIdentifier: string | null
  adminUrl: string | null
  publicUrl: string | null
  description: string | null
  verificationStatus: string
  projectId: string
  projectSlug: string
  providerSlug: string | null
}

export async function loadExistingAssetsForImport(
  db: ReturnType<typeof useDb>,
  workspaceId: string,
): Promise<ExistingAssetForImport[]> {
  const existingResult = await db.execute<{
    id: string
    name: string
    type: string
    external_identifier: string | null
    admin_url: string | null
    public_url: string | null
    description: string | null
    verification_status: string
    project_slug: string
    provider_slug: string | null
  }>(sql`
    select distinct on (a.id)
      a.id,
      a.name,
      a.type,
      a.external_identifier,
      a.admin_url,
      a.public_url,
      a.description,
      a.verification_status,
      p.slug as project_slug,
      pr.slug as provider_slug
    from assets a
    inner join project_assets pa on pa.asset_id = a.id and pa.workspace_id = ${workspaceId}
    inner join projects p on p.id = pa.project_id
    left join providers pr on pr.id = a.provider_id
    where a.workspace_id = ${workspaceId}
  `)

  return existingResult.rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    externalIdentifier: r.external_identifier,
    adminUrl: r.admin_url,
    publicUrl: r.public_url,
    description: r.description,
    verificationStatus: r.verification_status,
    projectId: '',
    projectSlug: r.project_slug,
    providerSlug: r.provider_slug,
  }))
}