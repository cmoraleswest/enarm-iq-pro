import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import AnalyticsProvider from "@/components/AnalyticsProvider"
import NotificationPrompt from "@/components/NotificationPrompt"
import CookieConsent from "@/components/CookieConsent"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Simula ENARM — Simulador de Casos Clínicos",
  description: "Simulador ENARM con formato CIFRHS 2025. 280 reactivos, 5 horas, 18,515 plazas. Prepárate con casos clínicos reales.",
  metadataBase: new URL("https://simulaenarm.com"),
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  themeColor: "#D4AF37",
  openGraph: {
    title: "Simula ENARM — Simulador CIFRHS 2025",
    description: "2,000+ preguntas reales, 280 reactivos, 5 horas. Prepárate para el ENARM con simuladores calibrados.",
    url: "https://simulaenarm.com",
    siteName: "Simula ENARM",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Simula ENARM" }],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simula ENARM — Simulador CIFRHS 2025",
    description: "2,000+ preguntas reales. Prepárate para el ENARM.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Simula ENARM",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider />
        {children}
        <NotificationPrompt />
        <CookieConsent />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
          }
        `}} />
      </body>
    </html>
  )
}
