import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { flavorSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const flavors = await prisma.flavor.findMany({
    where: { deletedAt: null },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    include: { droop: { select: { code: true, name: true } } },
  })
  return NextResponse.json({ flavors })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = flavorSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const flavor = await prisma.flavor.create({
    data: {
      slug: payload.slug,
      name: payload.name,
      category: payload.category,
      description: payload.description,
      imageUrl: payload.imageUrl,
      droopId: payload.droopId ?? null,
      stock: payload.stock,
      stockResetDaily: payload.stockResetDaily,
      dailyCapacity: payload.dailyCapacity ?? null,
      isActive: payload.isActive,
      availableWeekdays: payload.availableWeekdays,
      sortOrder: payload.sortOrder,
    },
  })

  return NextResponse.json({ ok: true, flavor })
}
