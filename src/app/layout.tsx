import type { Metadata } from 'next'
import { Libre_Baskerville, Inter } from 'next/font/google'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import Script from 'next/script'
import './globals.css'

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-baskerville',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AJ Suite',
  description: 'Legal case management for solo lawyers and chambers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AJ Suite',
  },
}

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('aj-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1B2B4B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AJ Suite" />

        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />

        <Script id="theme-script" strategy="afterInteractive">
          {themeScript}
        </Script>
      </head>

      <body
        className={`${libreBaskerville.variable} ${inter.variable} font-inter bg-warm-white`}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}