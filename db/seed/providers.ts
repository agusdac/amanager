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
  { slug: 'hetzner', name: 'Hetzner', category: 'hosting', websiteUrl: 'https://hetzner.com' },
  { slug: 'digitalocean', name: 'DigitalOcean', category: 'hosting', websiteUrl: 'https://digitalocean.com' },
  { slug: 'vultr', name: 'Vultr', category: 'hosting', websiteUrl: 'https://vultr.com' },
  { slug: 'ovh', name: 'OVHcloud', category: 'hosting', websiteUrl: 'https://ovhcloud.com' },
  { slug: 'contabo', name: 'Contabo', category: 'hosting', websiteUrl: 'https://contabo.com' },
  { slug: 'email', name: 'Email hosting', category: 'mail', websiteUrl: null },
  { slug: 'youtube', name: 'YouTube', category: 'social', websiteUrl: 'https://youtube.com' },
  { slug: 'instagram', name: 'Instagram / Meta', category: 'social', websiteUrl: 'https://instagram.com' },
  { slug: 'tiktok', name: 'TikTok', category: 'social', websiteUrl: 'https://tiktok.com' },
  { slug: 'bitwarden', name: 'Bitwarden', category: 'vault', websiteUrl: 'https://bitwarden.com' },
  { slug: '1password', name: '1Password', category: 'vault', websiteUrl: 'https://1password.com' },
  { slug: 'dashlane', name: 'Dashlane', category: 'vault', websiteUrl: 'https://dashlane.com' },
  { slug: 'keeper', name: 'Keeper', category: 'vault', websiteUrl: 'https://keepersecurity.com' },
  { slug: 'lastpass', name: 'LastPass', category: 'vault', websiteUrl: 'https://lastpass.com' },
  { slug: 'proton', name: 'Proton Pass', category: 'vault', websiteUrl: 'https://proton.me/pass' },
  { slug: 'stripe', name: 'Stripe', category: 'payments', websiteUrl: 'https://stripe.com' },
  { slug: 'creem', name: 'Creem', category: 'payments', websiteUrl: 'https://creem.io' },
  { slug: 'paypal', name: 'PayPal', category: 'payments', websiteUrl: 'https://paypal.com' },
  { slug: 'paddle', name: 'Paddle', category: 'payments', websiteUrl: 'https://paddle.com' },
  { slug: 'lemonsqueezy', name: 'Lemon Squeezy', category: 'payments', websiteUrl: 'https://lemonsqueezy.com' },
  { slug: 'openai', name: 'OpenAI / ChatGPT', category: 'ai', websiteUrl: 'https://openai.com' },
  { slug: 'anthropic', name: 'Anthropic / Claude', category: 'ai', websiteUrl: 'https://anthropic.com' },
  { slug: 'cursor', name: 'Cursor', category: 'ai', websiteUrl: 'https://cursor.com' },
  { slug: 'mistral', name: 'Mistral AI', category: 'ai', websiteUrl: 'https://mistral.ai' },
  { slug: 'perplexity', name: 'Perplexity', category: 'ai', websiteUrl: 'https://perplexity.ai' },
  { slug: 'huggingface', name: 'Hugging Face', category: 'ai', websiteUrl: 'https://huggingface.co' },
  { slug: 'deepseek', name: 'DeepSeek', category: 'ai', websiteUrl: 'https://deepseek.com' },
  { slug: 'meta', name: 'Meta AI', category: 'ai', websiteUrl: 'https://meta.ai' },
  { slug: 'canva', name: 'Canva', category: 'design', websiteUrl: 'https://canva.com' },
  { slug: 'figma', name: 'Figma', category: 'design', websiteUrl: 'https://figma.com' },
  { slug: 'penpot', name: 'Penpot', category: 'design', websiteUrl: 'https://penpot.app' },
  { slug: 'sketch', name: 'Sketch', category: 'design', websiteUrl: 'https://sketch.com' },
  { slug: 'adobe', name: 'Adobe', category: 'design', websiteUrl: 'https://adobe.com' },
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
      .onConflictDoUpdate({
        target: providers.slug,
        set: {
          name: p.name,
          category: p.category,
          websiteUrl: p.websiteUrl,
          isSystem: true,
        },
      })
  }
}