import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { galleryImageSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const images = await prisma.galleryImage.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ images })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = galleryImageSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'Datos inválidos', issues: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const image = await prisma.galleryImage.create({
    data: {
      imageUrl: payload.imageUrl,
      caption: payload.caption ?? null,
      alt: payload.alt ?? null,
      sortOrder: payload.sortOrder,
      isPublished: payload.isPublished,
    },
  })
  return NextResponse.json({ ok: true, image })
}
