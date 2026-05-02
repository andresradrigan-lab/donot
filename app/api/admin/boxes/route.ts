import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { boxSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const boxes = await prisma.box.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ boxes })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = boxSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const box = await prisma.box.create({
    data: {
      slug: payload.slug,
      name: payload.name,
      category: payload.category,
      slotCount: payload.slotCount,
      priceClp: payload.priceClp,
      images: payload.images,
      isActive: payload.isActive,
      availableWeekdays: payload.availableWeekdays,
      availableFrom: payload.availableFrom ? new Date(payload.availableFrom) : null,
      availableTo: payload.availableTo ? new Date(payload.availableTo) : null,
      sortOrder: payload.sortOrder,
    },
  })

  return NextResponse.json({ ok: true, box })
}
