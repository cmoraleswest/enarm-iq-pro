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
  description: "Banco de 2,000 preguntas reales para el ENARM. 5 tipos de simulador, flashcards y perfil académico.",
  manifest: "/manifest.json",
  themeColor: "#00d9ff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Simula ENARM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
          }
        `}} />
      </body>
    </html>
  );
}
