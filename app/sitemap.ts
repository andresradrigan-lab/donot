import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  const now = new Date()

  const [droops, boxes] = await Promise.all([
    prisma.droop.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { code: true, updatedAt: true },
    }),
    prisma.box.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/sobre-nosotros`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const droopRoutes: MetadataRoute.Sitemap = droops.map((d) => ({
    url: `${base}/droop/${d.code}`,
    lastModified: d.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const boxRoutes: MetadataRoute.Sitemap = boxes.map((b) => ({
    url: `${base}/caja/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...droopRoutes, ...boxRoutes]
}
