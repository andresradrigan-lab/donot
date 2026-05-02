import { createHash } from 'node:crypto'
import type { Order, OrderItem } from '@prisma/client'
import { getStringSetting } from '@/lib/settings'

/**
 * Conversions API de Meta (server-side). Se llama después de confirmar
 * un pago para deduplicar contra el evento Purchase del Pixel del cliente.
 *
 * Si faltan META_PIXEL_ID o META_CAPI_ACCESS_TOKEN, no hace nada y
 * retorna { sent: false, reason: 'not-configured' }. Un fallo del envío
 * NO debe romper el flujo de pago.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

interface FlavorLine {
  qty: number
  flavorSlug: string
  flavorName: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendMetaPurchase(
  order: Order & { items: OrderItem[] },
  appUrl: string,
): Promise<{ sent: boolean; reason?: string }> {
  // Preferimos los valores de SiteSetting (editables desde /admin/config)
  // y solo caemos a env si no hay nada configurado en BD.
  const [pixelFromDb, capiFromDb] = await Promise.all([
    getStringSetting('analytics_meta_pixel_id'),
    getStringSetting('analytics_meta_capi_token'),
  ])
  const pixelId = pixelFromDb || process.env.META_PIXEL_ID
  const accessToken = capiFromDb || process.env.META_CAPI_ACCESS_TOKEN
  if (!pixelId || !accessToken || pixelId === '000000000000000') {
    return { sent: false, reason: 'not-configured' }
  }

  const contents = order.items.map((it) => {
    const flavors = (it.flavors as FlavorLine[] | null) ?? []
    const slotsByFlavor = flavors.map((f) => f.flavorSlug).join('|') || it.boxNameSnapshot
    return {
      id: slotsByFlavor,
      quantity: it.quantity,
      item_price: it.boxPriceSnapshot,
    }
  })

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor((order.paidAt ?? new Date()).getTime() / 1000),
        event_id: order.id, // dedup contra el Pixel browser
        action_source: 'website',
        event_source_url: `${appUrl}/checkout/exito?token=${order.publicToken}`,
        user_data: {
          em: [sha256(order.customerEmail)],
          ph: [sha256(order.customerPhone.replace(/[^\d]/g, ''))],
          fn: [sha256(order.customerName.split(' ')[0] ?? order.customerName)],
        },
        custom_data: {
          currency: 'CLP',
          value: order.totalClp,
          contents,
          content_type: 'product',
          order_id: order.orderNumber,
        },
      },
    ],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('Meta CAPI failed:', res.status, text.slice(0, 200))
      return { sent: false, reason: `http-${res.status}` }
    }
    return { sent: true }
  } catch (err) {
    console.warn('Meta CAPI threw:', (err as Error).message)
    return { sent: false, reason: 'network' }
  }
}
