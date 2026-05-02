import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { couponSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const coupon = await prisma.coupon.update({
    where: { id: params.id },
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  await prisma.coupon.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
