'use client'

import { useEffect } from 'react'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getApps } from 'firebase/app'

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export default function AnalyticsProvider() {
  useEffect(() => {
    isSupported().then(supported => {
      if (supported && getApps().length > 0) getAnalytics(getApps()[0])
    })

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (pixelId && !window.fbq) {
      const s = document.createElement('script')
      s.async = true
      s.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(s)
      s.onload = () => {
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
        }
      }
    }
  }, [])

  return null
}
