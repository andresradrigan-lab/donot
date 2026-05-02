interface Props {
  appUrl: string
  business: {
    name?: string
    address?: string
    phone?: string
    lat?: string
    lng?: string
    instagram?: string
    email?: string
  }
  description?: string
  logoUrl: string
}

/**
 * Inserta JSON-LD Schema.org/LocalBusiness para SEO local.
 * Solo se renderiza si hay al menos un nombre de negocio configurado.
 */
export function StructuredData({ appUrl, business, description, logoUrl }: Props) {
  if (!business.name) return null

  const sameAs: string[] = []
  if (business.instagram) {
    const handle = business.instagram.replace(/^@/, '')
    sameAs.push(`https://instagram.com/${handle}`)
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: business.name,
    url: appUrl,
    image: logoUrl,
    description: description ?? undefined,
    telephone: business.phone || undefined,
    email: business.email || undefined,
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressRegion: 'Valparaíso',
          addressCountry: 'CL',
        }
      : undefined,
    geo:
      business.lat && business.lng
        ? {
            '@type': 'GeoCoordinates',
            latitude: business.lat,
            longitude: business.lng,
          }
        : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }

  // Limpiar campos undefined.
  for (const k of Object.keys(data)) {
    if (data[k] === undefined) delete data[k]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
