import sharp from 'sharp'

function makeSvg(size) {
  const s = size
  const r = s * 0.18
  const bw = s * 0.02
  const cx = s / 2
  const fs1 = s * 0.3
  const fs2 = s * 0.065
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${r}" fill="#0f0f1a"/>
  <rect x="${s*0.04}" y="${s*0.04}" width="${s*0.92}" height="${s*0.92}" rx="${s*0.15}" fill="none" stroke="#D4AF37" stroke-width="${bw}"/>
  <rect x="${cx - s*0.027}" y="${s*0.28}" width="${s*0.054}" height="${s*0.16}" rx="2" fill="#4ade80"/>
  <rect x="${cx - s*0.08}" y="${s*0.33}" width="${s*0.16}" height="${s*0.054}" rx="2" fill="#4ade80"/>
  <text x="${cx}" y="${s*0.58}" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="${fs1}" fill="#D4AF37">SE</text>
  <text x="${cx}" y="${s*0.76}" text-anchor="middle" font-family="Georgia,serif" font-size="${fs2}" fill="#94a3b8">SIMULA ENARM</text>
</svg>`
}

for (const size of [192, 512]) {
  await sharp(Buffer.from(makeSvg(size)))
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`icon-${size}.png ✓`)
}
