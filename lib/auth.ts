export interface SessionData {
  user: string
  isDemo: boolean
  loginAt: number
}

export const DEMO_DAYS = 20

// Credenciales hardcoded — reemplazar con BD cuando se escale
const CREDENTIALS: Record<string, { password: string; isDemo: boolean }> = {
  demo: { password: 'enarm2025', isDemo: true },
  admin: { password: 'enarmAdmin2026', isDemo: false },
}

export function validateCredentials(user: string, pass: string): SessionData | null {
  const cred = CREDENTIALS[user.toLowerCase()]
  if (!cred || cred.password !== pass) return null
  return { user: user.toLowerCase(), isDemo: cred.isDemo, loginAt: Date.now() }
}

export function getCookieMaxAge(isDemo: boolean): number {
  return isDemo ? DEMO_DAYS * 24 * 60 * 60 : 365 * 24 * 60 * 60
}

export function getDemoExpiryInfo(loginAt: number): { daysLeft: number; expired: boolean } {
  const expiresAt = loginAt + DEMO_DAYS * 24 * 60 * 60 * 1000
  const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
  return { daysLeft: Math.max(0, daysLeft), expired: daysLeft <= 0 }
}
