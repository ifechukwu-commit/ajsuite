import type { Metadata } from 'next'
import { Libre_Baskerville, Inter } from 'next/font/google'
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${libreBaskerville.variable} ${inter.variable} font-inter bg-warm-white`}>
        {children}
      </body>
    </html>
  )
}
