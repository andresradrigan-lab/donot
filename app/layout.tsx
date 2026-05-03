import type { Metadata } from 'next'
import { Sniglet, DM_Sans } from 'next/font/google'
import './globals.css'
import { GtmScript } from '@/components/store/GtmScript'
import { MetaPixelScript } from '@/components/store/MetaPixelScript'
import { StructuredData } from '@/components/store/StructuredData'
import { getPublicLayoutSettings } from '@/lib/settings'

// Forzar render dinámico: el layout y la metadata se construyen leyendo
// SiteSetting de la BD, así que no tiene sentido cachear estáticamente.
export const dynamic = 'force-dynamic'

// Display: Sniglet — rounded jovial, la tipografía de marca original
// que el cliente validó (mascota + paleta cálida + donas ⇒ rounded).
const sniglet = Sniglet({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-display',
  display: 'swap',
})

// Sans: DM Sans — humanista limpia con un toque cálido. Reemplaza
// Inter (genérica) y Manrope (muy fría) para body, copy y menú.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const DEFAULT_TITLE = 'donot.'
const DEFAULT_DESCRIPTION =
  'Donutería boutique de Concón–Reñaca. Cajas de donas premium hechas a mano.'

function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000'
}

function absoluteUrl(maybeRelative: string | undefined, base: string): string | undefined {
  if (!maybeRelative) return undefined
  if (/^https?:\/\//.test(maybeRelative)) return maybeRelative
  return `${base.replace(/\/$/, '')}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`
}

export async function generateMetadata(): Promise<Metadata> {
  const s: Record<string, string> = await getPublicLayoutSettings().catch(
    () => ({}) as Record<string, string>,
  )
  const base = appUrl()
  const title = s.seo_site_title?.trim() || DEFAULT_TITLE
  const description = s.seo_site_description?.trim() || DEFAULT_DESCRIPTION
  const ogImage = absoluteUrl(s.seo_og_image, base)
  const keywords = s.seo_keywords?.split(',').map((k) => k.trim()).filter(Boolean)
  const verification = s.analytics_search_console_verification?.trim() || undefined

  return {
    metadataBase: new URL(base),
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    keywords,
    openGraph: {
      type: 'website',
      title,
      description,
      url: base,
      siteName: title,
      locale: 'es_CL',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    verification: verification ? { google: verification } : undefined,
    robots: { index: true, follow: true },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const s: Record<string, string> = await getPublicLayoutSettings().catch(
    () => ({}) as Record<string, string>,
  )
  const base = appUrl()

  return (
    <html lang="es-CL" className={`${sniglet.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <GtmScript gtmId={s.analytics_gtm_id} />
        <MetaPixelScript pixelId={s.analytics_meta_pixel_id} />
        <StructuredData
          appUrl={base}
          logoUrl={`${base}/brand/do-not-verde-fondo-crema.png`}
          description={s.seo_site_description}
          business={{
            name: s.business_name,
            address: s.business_address,
            phone: s.business_phone,
            lat: s.business_lat,
            lng: s.business_lng,
            instagram: s.contact_instagram,
            email: s.contact_email,
          }}
        />
        {children}
      </body>
    </html>
  )
}
