import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { getCurrentAdmin } from '@/lib/auth/session'
import { transitionOrder, TransitionError } from '@/lib/orders/transitions'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  status: z.enum(['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const admin = getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ ok: false, reason: 'No autenticado' }, { status: 401 })
  }
  if (admin.role === 'VIEWER') {
    return NextResponse.json({ ok: false, reason: 'Sin permisos' }, { status: 403 })
  }

  let payload
  try {
    payload = bodySchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Estado inválido' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  try {
    await transitionOrder(params.id, payload.status)
    return NextResponse.json({ ok: true, status: payload.status })
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json(
        { ok: false, reason: err.message },
        { status: err.status },
      )
    }
    console.error('transitionOrder failed:', err)
    return NextResponse.json({ ok: false, reason: 'Error al actualizar' }, { status: 500 })
  }
}
