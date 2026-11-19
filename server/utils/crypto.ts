import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const SCRYPT_KEYLEN = 64

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function hasBunPassword(): boolean {
  return typeof globalThis.Bun !== 'undefined' && Boolean(globalThis.Bun?.password)
}

async function hashPasswordScrypt(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

async function verifyPasswordScrypt(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts[0] !== 'scrypt' || parts.length !== 3) return false
  const salt = Buffer.from(parts[1], 'base64url')
  const expected = Buffer.from(parts[2], 'base64url')
  if (expected.length !== SCRYPT_KEYLEN) return false
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

export async function hashPassword(password: string): Promise<string> {
  if (hasBunPassword()) {
    return await globalThis.Bun!.password.hash(password, { algorithm: 'argon2id' })
  }
  return await hashPasswordScrypt(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('scrypt$')) {
    return await verifyPasswordScrypt(password, hash)
  }
  if (hasBunPassword()) {
    return await globalThis.Bun!.password.verify(password, hash)
  }
  return false
}