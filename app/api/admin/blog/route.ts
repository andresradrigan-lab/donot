import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { blogPostSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const posts = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      author: true,
      tags: true,
      isPublished: true,
      publishedAt: true,
      updatedAt: true,
    },
  })
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = blogPostSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'Datos inválidos', issues: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const publishedAt =
    payload.isPublished
      ? payload.publishedAt
        ? new Date(payload.publishedAt)
        : new Date()
      : payload.publishedAt
        ? new Date(payload.publishedAt)
        : null

  const post = await prisma.blogPost.create({
    data: {
      slug: payload.slug,
      title: payload.title,
      excerpt: payload.excerpt,
      content: payload.content,
      coverImage: payload.coverImage ?? null,
      author: payload.author,
      tags: payload.tags,
      seoTitle: payload.seoTitle ?? null,
      seoDescription: payload.seoDescription ?? null,
      ogImage: payload.ogImage ?? null,
      isPublished: payload.isPublished,
      publishedAt,
    },
  })
  return NextResponse.json({ ok: true, post })
}
