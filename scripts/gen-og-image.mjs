import sharp from 'sharp'

const W = 1200, H = 630
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0f0f1a"/>
  <rect x="40" y="40" width="${W-80}" height="${H-80}" rx="24" fill="none" stroke="#D4AF37" stroke-width="3"/>

  <!-- Cruz médica -->
  <rect x="565" y="120" width="70" height="20" rx="4" fill="#4ade80"/>
  <rect x="590" y="95" width="20" height="70" rx="4" fill="#4ade80"/>

  <!-- Título -->
  <text x="600" y="240" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="64" fill="#D4AF37">Simula ENARM</text>

  <!-- Subtítulo -->
  <text x="600" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#94a3b8">Simulador de Casos Clínicos</text>

  <!-- Stats -->
  <text x="200" y="420" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#00d9ff" font-weight="bold">2,000+</text>
  <text x="200" y="460" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#64748b">preguntas reales</text>

  <text x="600" y="420" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#4ade80" font-weight="bold">280</text>
  <text x="600" y="460" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#64748b">reactivos CIFRHS 2025</text>

  <text x="1000" y="420" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#D4AF37" font-weight="bold">18,515</text>
  <text x="1000" y="460" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#64748b">plazas disponibles</text>

  <!-- CTA -->
  <rect x="400" y="500" width="400" height="56" rx="12" fill="#D4AF37"/>
  <text x="600" y="536" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="22" fill="#0f0f1a">simulaenarm.com</text>
</svg>`

await sharp(Buffer.from(svg)).png().toFile('public/og-image.png')
console.log('og-image.png ✓')
