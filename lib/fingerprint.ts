'use client'

/** Genera un identificador único del dispositivo basado en propiedades del browser. */
export function generateFingerprint(): string {
  if (typeof window === 'undefined') return 'server'

  const parts = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') ?? '',
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? 0),
    String(navigator.maxTouchPoints ?? 0),
    String(window.devicePixelRatio ?? 1),
  ]

  const raw = parts.join('||')

  // Hash djb2
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
    hash = hash >>> 0 // unsigned 32-bit
  }

  return hash.toString(36)
}

export async function getClientIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
    const data = await res.json() as { ip: string }
    return data.ip
  } catch {
    return 'unknown'
  }
}
