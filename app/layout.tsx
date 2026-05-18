import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Lato, Playfair_Display } from 'next/font/google'
import './globals.css'

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Capture Memories',
    template: '%s | Capture Memories',
  },
  description: 'Capture Memories is a wedding photography and cinematography studio from Bangladesh.',
  applicationName: 'Capture Memories',
  icons: {
    icon: '/capture-memories-logo.png',
    shortcut: '/capture-memories-logo.png',
    apple: '/capture-memories-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${lato.variable} ${playfairDisplay.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
