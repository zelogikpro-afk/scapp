import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'

if (!existsSync('public/icons')) mkdirSync('public/icons')

const src = 'public/logo.png'
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(src).resize(size, size, { fit: 'contain', background: { r: 29, g: 52, b: 98, alpha: 1 } })
    .png().toFile(`public/icons/icon-${size}x${size}.png`)
  console.log(`✓ icon-${size}x${size}.png`)
}

// Apple touch icon (180x180)
await sharp(src).resize(180, 180, { fit: 'contain', background: { r: 29, g: 52, b: 98, alpha: 1 } })
  .png().toFile('public/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')
