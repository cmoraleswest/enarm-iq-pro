import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Simula ENARM — Simulador de Casos Clínicos",
  description: "Prepárate para el ENARM con 2,000 preguntas reales y 5 simuladores.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={dmSans.variable} style={{ margin: 0, padding: 0, backgroundColor: "#0a0a14" }}>
        {children}
      </body>
    </html>
  )
}
