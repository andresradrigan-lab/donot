import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/exito', '/checkout/error', '/pedido/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
