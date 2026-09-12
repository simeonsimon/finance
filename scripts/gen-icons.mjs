// Generates the Finance PWA and iOS artwork into icons/.
// Run whenever the mark changes: node scripts/gen-icons.mjs
import sharp from '../../60-reps/node_modules/sharp/dist/index.mjs'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const out = path.join(root, 'icons')
mkdirSync(out, { recursive: true })

function markSvg(size, { safe = 0.14, rounded = false } = {}) {
  const radius = rounded ? size * 0.22 : 0
  const glyphSize = size * (safe >= 0.22 ? 0.44 : 0.52)
  const underlineWidth = size * (safe >= 0.22 ? 0.27 : 0.34)
  const underlineY = size * 0.735
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#000000"/>
  <text x="50%" y="48%" text-anchor="middle" dominant-baseline="middle"
    fill="#ffffff" font-family="Arial, 'Helvetica Neue', sans-serif"
    font-size="${glyphSize}" font-weight="700">€</text>
  <rect x="${(size - underlineWidth) / 2}" y="${underlineY}" width="${underlineWidth}"
    height="${Math.max(2, size * 0.022)}" rx="${size * 0.011}" fill="#3987e5"/>
</svg>`)
}

async function png(name, size, options) {
  await sharp(markSvg(size, options)).png().toFile(path.join(out, name))
  console.log('wrote', name)
}

await png('icon-192.png', 192, { safe: 0.14 })
await png('icon-512.png', 512, { safe: 0.14 })
await png('maskable-512.png', 512, { safe: 0.24 })
await png('apple-touch-icon.png', 180, { safe: 0.16, rounded: true })

{
  const width = 1179
  const height = 2556
  const markSize = 360
  const mark = markSvg(markSize, { safe: 0.16 })
  const splash = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#000000"/>
  <image href="data:image/svg+xml;base64,${mark.toString('base64')}" x="${(width-markSize)/2}" y="${(height-markSize)/2}" width="${markSize}" height="${markSize}"/>
</svg>`)
  await sharp(splash).png().toFile(path.join(out, 'apple-splash-1179x2556.png'))
  console.log('wrote apple-splash-1179x2556.png')
}
