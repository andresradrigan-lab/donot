import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getProvider } from '@/lib/payments'
import { markOrderPaid } from '@/lib/orders/finalize'
import { verifyMercadoPagoSignature } from '@/lib/webhooks/mercadopago'

export const dynamic = 'force-dynamic'

/**
 * Webhook de Mercado Pago.
 *
 * 1. Validar firma con HMAC (si MP_WEBHOOK_SECRET está configurado).
 * 2. Idempotencia: WebhookLog tiene unique en (provider, externalId).
 * 3. Si action = "payment.*" y el pago real está APPROVED, marcar Order
 *    como PAID, decrementar stock, incrementar uso del cupón y disparar
 *    email.
 *
 * Devuelve 200 incluso si no hay match para que MP no reintente
 * indefinidamente (los errores reales se loguean).
 */
export async function POST(request: Request) {
  const signatureHeader = request.headers.get('x-signature')
  const requestIdHeader = request.headers.get('x-request-id')

  let body: { action?: string; type?: string; data?: { id?: string | number } }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const dataId = body.data?.id != null ? String(body.data.id) : ''
  if (!dataId) {
    return NextResponse.json({ ok: false, reason: 'missing data.id' }, { status: 400 })
  }

  const sig = verifyMercadoPagoSignature({
    signatureHeader,
    requestIdHeader,
    dataId,
  })
  if (!sig.ok) {
    console.warn('MP webhook firma inválida:', sig.reason)
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  if (sig.skipped) {
    console.warn('⚠ MP webhook sin verificar firma (MP_WEBHOOK_SECRET vacío)')
  }

  const eventType = body.action ?? body.type ?? 'unknown'

  // 2) Idempotencia.
  const existing = await prisma.webhookLog.findUnique({
    where: { provider_externalId: { provider: 'MERCADO_PAGO', externalId: dataId } },
  })
  if (existing && existing.status === 'PROCESSED') {
    return NextResponse.json({ ok: true, idempotent: true })
  }

  const log = existing ?? await prisma.webhookLog.create({
    data: {
      provider: 'MERCADO_PAGO',
      eventType,
      externalId: dataId,
      payload: body as object,
      headers: {
        'x-signature': signatureHeader ?? null,
        'x-request-id': requestIdHeader ?? null,
      },
      status: 'RECEIVED',
    },
  })

  try {
    if (!eventType.startsWith('payment')) {
      // Ignoramos eventos que no son de pago.
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      })
      return NextResponse.json({ ok: true, ignored: true })
    }

    // 3) Consultar el estado real del pago en MP.
    const provider = getProvider('MERCADO_PAGO')
    const status = await provider.getStatus(dataId)

    // El external_reference contiene el order.id. Lo recuperamos vía SDK.
    const { Payment, MercadoPagoConfig } = await import('mercadopago')
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado')
    const payment = new Payment(new MercadoPagoConfig({ accessToken }))
    const detail = await payment.get({ id: dataId })
    const orderId = detail.external_reference
    if (!orderId) {
      throw new Error('payment sin external_reference')
    }

    await prisma.webhookLog.update({
      where: { id: log.id },
      data: { orderId, processedAt: new Date() },
    })

    if (status === 'APPROVED') {
      await markOrderPaid(orderId)
    } else if (status === 'REJECTED') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'REJECTED' },
      })
    }

    await prisma.webhookLog.update({
      where: { id: log.id },
      data: { status: 'PROCESSED' },
    })

    return NextResponse.json({ ok: true, paymentStatus: status })
  } catch (err) {
    console.error('MP webhook procesamiento falló:', err)
    await prisma.webhookLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        errorMessage: (err as Error).message,
        processedAt: new Date(),
      },
    })
    return NextResponse.json({ ok: false }, { status: 200 }) // 200 para que MP no reintente para siempre
  }
}
