import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { couponValidateSchema } from '@/lib/schemas'
import { evaluateCoupon } from '@/lib/totals'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let payload
  try {
    payload = couponValidateSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'Datos inválidos', issues: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, reason: 'Body inválido' },
      { status: 400 },
    )
  }

  const code = payload.code.trim().toUpperCase()
  const coupon = await prisma.coupon.findFirst({
    where: { code, isActive: true },
  })

  if (!coupon) {
    return NextResponse.json({
      ok: false,
      reason: 'Ese código no anda. Prueba otro.',
      discountClp: 0,
      freeShipping: false,
    })
  }

  const result = evaluateCoupon(coupon, payload.cart)
  return NextResponse.json({
    ...result,
    code: coupon.code,
    type: coupon.type,
  })
}
