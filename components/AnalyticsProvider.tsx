'use client'

import { useEffect } from 'react'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getApps } from 'firebase/app'

export default function AnalyticsProvider() {
  useEffect(() => {
    isSupported().then(supported => {
      if (supported && getApps().length > 0) getAnalytics(getApps()[0])
    })

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (pixelId && !(window as any).fbq) {
      const s = document.createElement('script')
      s.async = true
      s.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(s)
      s.onload = () => {
        const fbq = (window as any).fbq as (...args: unknown[]) => void
        if (fbq) {
          fbq('init', pixelId)
          fbq('track', 'PageView')
        }
      }
    }
  }, [])

  return null
}
