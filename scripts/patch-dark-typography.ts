/**
 * One-off safe pass: add semantic text/surface classes for dark mode readability.
 * Skips files that already use semantic tokens.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(import.meta.dir, '..')
const targets: string[] = []

function walk(dir: string) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === '.nuxt') continue
      walk(p)
    } else if (name.name.endsWith('.vue') || name.name.endsWith('.ts')) {
      targets.push(p)
    }
  }
}

walk(join(root, 'app'))
targets.push(join(root, 'shared', 'markdown', 'preview.ts'))

type Rule = { from: RegExp; to: string }

const rules: Rule[] = [
  { from: /\btext-stone-900\b(?!\s+dark:)/g, to: 'text-ink' },
  { from: /\btext-stone-800\b(?!\s+dark:)/g, to: 'text-stone-800 dark:text-stone-200' },
  { from: /\btext-stone-700\b(?!\s+dark:)/g, to: 'text-ink-secondary' },
  { from: /\btext-stone-600\b(?!\s+dark:)/g, to: 'text-muted' },
  { from: /\btext-stone-500\b(?!\s+dark:)/g, to: 'text-subtle' },
  { from: /\btext-stone-400\b(?!\s+dark:)/g, to: 'text-faint' },
  { from: /\bbg-white\b(?!\s+dark:|\/)/g, to: 'bg-surface' },
  { from: /\bbg-stone-50\/80\b/g, to: 'bg-stone-50/80 dark:bg-stone-900/80' },
  { from: /\bbg-stone-50\/60\b/g, to: 'bg-stone-50/60 dark:bg-stone-900/70' },
  { from: /\bbg-stone-50\/90\b/g, to: 'bg-stone-50/90 dark:bg-stone-900/80' },
  { from: /\bbg-stone-50\b(?!\s+dark:|\/)/g, to: 'bg-surface-muted' },
  { from: /\bbg-stone-100\b(?!\s+dark:|\/)/g, to: 'bg-surface-soft' },
  { from: /\bborder-stone-300\b(?!\s+dark:)/g, to: 'border-stone-300 dark:border-stone-600' },
  { from: /\bborder-stone-200\b(?!\s+dark:)/g, to: 'border-rule' },
  { from: /\bborder-stone-100\b(?!\s+dark:)/g, to: 'border-rule-light' },
  { from: /\bdivide-stone-200\b(?!\s+dark:)/g, to: 'divide-rule-md' },
  { from: /\bdivide-stone-100\b(?!\s+dark:)/g, to: 'divide-rule' },
  { from: /\bhover:bg-stone-50\b(?!\s+dark:)/g, to: 'hover:bg-stone-50 dark:hover:bg-stone-800' },
  { from: /\bhover:bg-stone-100\b(?!\s+dark:)/g, to: 'hover:bg-stone-100 dark:hover:bg-stone-800' },
  { from: /\bhover:text-stone-900\b(?!\s+dark:)/g, to: 'hover:text-stone-900 dark:hover:text-stone-100' },
  { from: /\bhover:text-stone-700\b(?!\s+dark:)/g, to: 'hover:text-stone-700 dark:hover:text-stone-300' },
]

let changed = 0
for (const file of targets) {
  const rel = relative(root, file)
  if (rel.includes('assets\\css\\main.css') || rel.includes('assets/css/main.css')) continue

  let content = readFileSync(file, 'utf8')
  const before = content

  for (const { from, to } of rules) {
    content = content.replace(from, to)
  }

  // Fix double semantic tokens from re-run
  content = content
    .replace(/\btext-ink dark:text-stone-\d+\b/g, 'text-ink')
    .replace(/\btext-muted dark:text-stone-\d+\b/g, 'text-muted')

  if (content !== before) {
    writeFileSync(file, content, 'utf8')
    changed++
    console.log('patched', rel)
  }
}

console.log(`Done. ${changed} files updated.`)