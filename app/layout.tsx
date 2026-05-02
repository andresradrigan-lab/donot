import type { Metadata } from 'next'
import { Sniglet, Inter } from 'next/font/google'
import './globals.css'

const sniglet = Sniglet({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'donot.',
  description:
    'Donutería boutique de Concón–Reñaca. Cajas de donas premium hechas a mano.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-CL" className={`${sniglet.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
