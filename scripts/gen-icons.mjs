import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const svg = readFileSync(resolve(root, 'public/icon.svg'))

const targets = [
  { size: 192, out: 'public/icon-192.png' },
  { size: 512, out: 'public/icon-512.png' },
  { size: 180, out: 'public/apple-touch-icon.png' },
  { size: 32, out: 'public/favicon-32.png' },
]

for (const t of targets) {
  await sharp(svg).resize(t.size, t.size).png().toFile(resolve(root, t.out))
  console.log(`wrote ${t.out} (${t.size}x${t.size})`)
}
