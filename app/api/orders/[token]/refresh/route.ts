import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { markOrderPaid } from '@/lib/orders/finalize'

export const dynamic = 'force-dynamic'

/**
 * Consulta el estado del pago directamente en la pasarela y, si está
 * APPROVED, finaliza la orden (idempotente). Sirve como fallback cuando
 * el webhook no puede llegar (ej. desarrollo en localhost).
 */
export async function POST(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const order = await prisma.order.findUnique({
    where: { publicToken: params.token },
  })
  if (!order) {
    return NextResponse.json({ ok: false, reason: 'Pedido no encontrado' }, { status: 404 })
  }
  if (!order.paymentId) {
    return NextResponse.json({ ok: false, reason: 'Pedido sin payment_id' }, { status: 400 })
  }
  if (order.status !== 'PENDING') {
    return NextResponse.json({ ok: true, status: order.status, alreadyResolved: true })
  }

  if (order.paymentProvider !== 'MERCADO_PAGO') {
    return NextResponse.json({ ok: false, reason: 'Provider no soporta refresh aún' }, { status: 501 })
  }

  // Buscar el último Payment asociado a esta preference.
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: 'MP no configurado' }, { status: 500 })
  }

  const search = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(order.id)}&sort=date_created&criteria=desc&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!search.ok) {
    return NextResponse.json({ ok: false, reason: 'No pudimos consultar el pago' }, { status: 502 })
  }
  const data = await search.json()
  const payment = data.results?.[0]
  if (!payment) {
    return NextResponse.json({ ok: true, status: order.status, foundPayment: false })
  }

  if (payment.status === 'approved') {
    await markOrderPaid(order.id)
    return NextResponse.json({ ok: true, status: 'PAID' })
  }
  if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'REJECTED' },
    })
    return NextResponse.json({ ok: true, status: 'PENDING', paymentStatus: 'REJECTED' })
  }

  return NextResponse.json({
    ok: true,
    status: order.status,
    mpPaymentStatus: payment.status,
  })
}
