import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const svgTemplate = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#5B5CE2;stop-opacity:1" />
      <stop offset="35%" style="stop-color:#4546B8;stop-opacity:1" />
      <stop offset="55%" style="stop-color:#36C9A5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFB547;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E0E7FF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bgGradient)"/>
  <path d="M${size * 0.3} ${size * 0.35} L${size * 0.3} ${size * 0.65} L${size * 0.7} ${size * 0.65} L${size * 0.7} ${size * 0.35} Z"
        fill="url(#bookGradient)" stroke="#FFFFFF" stroke-width="${size * 0.02}"/>
  <path d="M${size * 0.5} ${size * 0.35} L${size * 0.5} ${size * 0.65}" stroke="#5B5CE2" stroke-width="${size * 0.012}" opacity="0.45"/>
  <path d="M${size * 0.34} ${size * 0.45} L${size * 0.46} ${size * 0.45}" stroke="#5B5CE2" stroke-width="${size * 0.012}" stroke-linecap="round"/>
  <path d="M${size * 0.34} ${size * 0.53} L${size * 0.46} ${size * 0.53}" stroke="#5B5CE2" stroke-width="${size * 0.012}" stroke-linecap="round"/>
  <path d="M${size * 0.54} ${size * 0.45} L${size * 0.66} ${size * 0.45}" stroke="#36C9A5" stroke-width="${size * 0.012}" stroke-linecap="round"/>
  <path d="M${size * 0.54} ${size * 0.53} L${size * 0.64} ${size * 0.53}" stroke="#36C9A5" stroke-width="${size * 0.012}" stroke-linecap="round"/>
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.105}" fill="#FFB547" opacity="0.95"/>
  <text x="${size * 0.75}" y="${size * 0.285}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.14}" font-weight="800" fill="#1F245D">L</text>
</svg>`

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outputDir = path.join(process.cwd(), 'public', 'icons')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('Generating PWA PNG icons...')

for (const size of sizes) {
  const svgContent = svgTemplate(size)
  const svgPath = path.join(outputDir, `icon-${size}x${size}.svg`)
  const pngPath = path.join(outputDir, `icon-${size}x${size}.png`)
  fs.writeFileSync(svgPath, svgContent)
  await sharp(Buffer.from(svgContent)).png().resize(size, size).toFile(pngPath)
  console.log(`Created ${pngPath}`)
}

const faviconSvg = svgTemplate(32)
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), faviconSvg)
await sharp(Buffer.from(faviconSvg)).png().resize(32, 32).toFile(path.join(process.cwd(), 'public', 'favicon.png'))

console.log('Production PWA icons generated successfully.')