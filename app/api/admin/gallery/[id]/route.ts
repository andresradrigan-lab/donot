import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { galleryImageSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = galleryImageSchema.partial().parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (payload.imageUrl !== undefined) data.imageUrl = payload.imageUrl
  if (payload.caption !== undefined) data.caption = payload.caption ?? null
  if (payload.alt !== undefined) data.alt = payload.alt ?? null
  if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder
  if (payload.isPublished !== undefined) data.isPublished = payload.isPublished

  const image = await prisma.galleryImage.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json({ ok: true, image })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  await prisma.galleryImage.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isPublished: false },
  })
  return NextResponse.json({ ok: true })
}
