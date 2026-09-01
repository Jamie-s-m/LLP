import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.join(__dirname, '..', 'public', 'brand', 'twin-arc', 'app-icon-source.svg')
const outDir = path.join(__dirname, '..', 'public', 'icons')

const svg = readFileSync(svgPath)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  const outPath = path.join(outDir, `icon-${size}x${size}.png`)
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(outPath)
  console.log(`wrote ${outPath}`)
}
