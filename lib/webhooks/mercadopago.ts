import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Valida la firma `x-signature` que envía Mercado Pago en webhooks.
 *
 * Formato del header: `ts=1700000000,v1=abcdef...`
 * Manifest: `id:<dataId>;request-id:<requestId>;ts:<ts>;`
 * HMAC-SHA256(secret, manifest) → debe coincidir con v1.
 *
 * Si MP_WEBHOOK_SECRET no está configurado, retorna `skipped: true` para
 * permitir testing en sandbox antes de configurar el secret real.
 *
 * Docs: https://www.mercadopago.com.cl/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoSignature(args: {
  signatureHeader: string | null
  requestIdHeader: string | null
  dataId: string
}): { ok: boolean; skipped?: boolean; reason?: string } {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    return { ok: true, skipped: true }
  }
  if (!args.signatureHeader) {
    return { ok: false, reason: 'falta header x-signature' }
  }

  // Parsear "ts=...,v1=..."
  const parts = args.signatureHeader.split(',').map((s) => s.trim())
  const ts = parts.find((p) => p.startsWith('ts='))?.slice(3)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)
  if (!ts || !v1) {
    return { ok: false, reason: 'header x-signature malformado' }
  }

  const requestId = args.requestIdHeader ?? ''
  const manifest = `id:${args.dataId};request-id:${requestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(v1, 'hex')
  if (a.length !== b.length) return { ok: false, reason: 'firma no coincide' }

  const equal = timingSafeEqual(a, b)
  return equal ? { ok: true } : { ok: false, reason: 'firma no coincide' }
}
