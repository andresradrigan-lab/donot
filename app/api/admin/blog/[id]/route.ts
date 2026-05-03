import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { blogPostSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } })
  if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = blogPostSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const existing = await prisma.blogPost.findUnique({
    where: { id: params.id },
    select: { isPublished: true, publishedAt: true },
  })
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Si se publica por primera vez (transición no→sí) y no se pasó publishedAt,
  // se setea ahora.
  let publishedAt = existing.publishedAt
  if (payload.publishedAt) {
    publishedAt = new Date(payload.publishedAt)
  } else if (payload.isPublished && !existing.isPublished && !existing.publishedAt) {
    publishedAt = new Date()
  }

  const post = await prisma.blogPost.update({
    where: { id: params.id },
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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  await prisma.blogPost.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isPublished: false },
  })
  return NextResponse.json({ ok: true })
}
