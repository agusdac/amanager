import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { providers } from '../schema'
import type * as schema from '../schema'

const SYSTEM_PROVIDERS = [
  { slug: 'google', name: 'Google', category: 'platform', websiteUrl: 'https://google.com' },
  { slug: 'github', name: 'GitHub', category: 'devtools', websiteUrl: 'https://github.com' },
  { slug: 'aws', name: 'Amazon Web Services', category: 'cloud', websiteUrl: 'https://aws.amazon.com' },
  { slug: 'cloudflare', name: 'Cloudflare', category: 'cdn', websiteUrl: 'https://cloudflare.com' },
  { slug: 'namecheap', name: 'Namecheap', category: 'registrar', websiteUrl: 'https://namecheap.com' },
  { slug: 'hostinger', name: 'Hostinger', category: 'hosting', websiteUrl: 'https://hostinger.com' },
  { slug: 'vps', name: 'VPS / bare metal', category: 'hosting', websiteUrl: null },
  { slug: 'email', name: 'Email hosting', category: 'mail', websiteUrl: null },
  { slug: 'youtube', name: 'YouTube', category: 'social', websiteUrl: 'https://youtube.com' },
  { slug: 'instagram', name: 'Instagram / Meta', category: 'social', websiteUrl: 'https://instagram.com' },
  { slug: 'tiktok', name: 'TikTok', category: 'social', websiteUrl: 'https://tiktok.com' },
  { slug: 'bitwarden', name: 'Bitwarden', category: 'vault', websiteUrl: 'https://bitwarden.com' },
] as const

export async function seedProviders(db: NodePgDatabase<typeof schema>) {
  for (const p of SYSTEM_PROVIDERS) {
    await db
      .insert(providers)
      .values({
        slug: p.slug,
        name: p.name,
        category: p.category,
        websiteUrl: p.websiteUrl,
        isSystem: true,
      })
      .onConflictDoNothing({ target: providers.slug })
  }
}