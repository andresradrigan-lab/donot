import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { couponSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Métricas: ingresos generados por cada cupón.
  const codes = coupons.map((c) => c.code)
  const revenueByCoupon = codes.length
    ? await prisma.order.groupBy({
        by: ['couponCode'],
        where: { couponCode: { in: codes }, status: { in: ['PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] } },
        _sum: { totalClp: true, discountClp: true },
        _count: { _all: true },
      })
    : []
  const metrics = new Map(
    revenueByCoupon.map((r) => [
      r.couponCode,
      {
        revenueClp: r._sum.totalClp ?? 0,
        discountTotalClp: r._sum.discountClp ?? 0,
        ordersCount: r._count._all,
      },
    ]),
  )

  return NextResponse.json({
    coupons: coupons.map((c) => ({
      ...c,
      metrics: metrics.get(c.code) ?? { revenueClp: 0, discountTotalClp: 0, ordersCount: 0 },
    })),
  })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = couponSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: payload.code.toUpperCase(),
      type: payload.type,
      value: payload.value,
      minOrderClp: payload.minOrderClp ?? null,
      maxUses: payload.maxUses ?? null,
      maxUsesPerUser: payload.maxUsesPerUser ?? null,
      validFrom: new Date(payload.validFrom),
      validTo: payload.validTo ? new Date(payload.validTo) : null,
      isActive: payload.isActive,
    },
  })

  return NextResponse.json({ ok: true, coupon })
}
