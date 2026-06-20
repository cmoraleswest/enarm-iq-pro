'use client'

import { getAnalytics, logEvent as fbLogEvent, type Analytics } from 'firebase/analytics'

let _analytics: Analytics | null = null

function getFA(): Analytics | null {
  if (typeof window === 'undefined') return null
  if (_analytics) return _analytics
  try {
    const { getApps } = require('firebase/app')
    const apps = getApps()
    if (apps.length === 0) return null
    _analytics = getAnalytics(apps[0])
    return _analytics
  } catch { return null }
}

export function trackEvent(name: string, params?: Record<string, string | number>) {
  // Firebase Analytics
  const fa = getFA()
  if (fa) fbLogEvent(fa, name, params)

  // Meta Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', name, params)
  }
}

// Eventos predefinidos
export const track = {
  examCompleted: (score: number, total: number, type: string) =>
    trackEvent('exam_completed', { score, total, exam_type: type }),
  upgradeView: () =>
    trackEvent('upgrade_view'),
  purchase: (plan: string, amount: number) =>
    trackEvent('purchase', { plan, value: amount, currency: 'MXN' }),
  signup: () =>
    trackEvent('sign_up'),
  login: () =>
    trackEvent('login'),
}
