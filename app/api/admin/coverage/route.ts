import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { coverageZoneSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const zones = await prisma.coverageZone.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ zones })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = coverageZoneSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const zone = await prisma.coverageZone.create({
    data: {
      commune: payload.commune,
      region: payload.region,
      shippingClp: payload.shippingClp,
      freeShippingThresholdClp: payload.freeShippingThresholdClp ?? null,
      freeShippingMinBoxes: payload.freeShippingMinBoxes ?? null,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder,
    },
  })
  return NextResponse.json({ ok: true, zone })
}
