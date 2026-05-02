'use client'

import { useEffect, useRef } from 'react'
import { CART_STORAGE_KEY } from '@/lib/cart'
import { analytics } from '@/lib/analytics'

interface Props {
  token: string
}

interface OrderItemDto {
  boxNameSnapshot: string
  quantity: number
  lineTotalClp: number
  flavors: { flavorSlug: string; flavorName: string; qty: number }[]
}

interface OrderDto {
  orderNumber: string
  status: string
  totalClp: number
  shippingClp: number
  items: OrderItemDto[]
}

/**
 * Limpia el carrito local cuando un pedido fue confirmado, ya sea porque
 * el redirect de la pasarela trae el token o porque el webhook lo marcó como
 * PAID antes que el redirect (consultando /api/orders/[token]).
 */
export function CheckoutSuccessRefresher({ token }: Props) {
  const purchaseFired = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    async function refresh() {
      try {
        await fetch(`/api/orders/${token}/refresh`, { method: 'POST' })
      } catch {
        // continúa
      }
      try {
        const res = await fetch(`/api/orders/${token}`)
        if (!res.ok) return
        const data = (await res.json()) as { order?: OrderDto }
        if (cancelled) return
        const order = data.order
        if (!order) return
        if (order.status !== 'PENDING') {
          window.localStorage.removeItem(CART_STORAGE_KEY)
          window.dispatchEvent(new CustomEvent('donot:cart-updated'))

          if (!purchaseFired.current && order.status === 'PAID') {
            purchaseFired.current = true
            analytics.purchase({
              currency: 'CLP',
              value: order.totalClp,
              transaction_id: order.orderNumber,
              shipping: order.shippingClp,
              items: order.items.map((it) => ({
                item_id: it.boxNameSnapshot,
                item_name: it.boxNameSnapshot,
                price: Math.round(it.lineTotalClp / Math.max(it.quantity, 1)),
                quantity: it.quantity,
              })),
            })
          }
        }
      } catch {
        // ignorar
      }
    }

    refresh()
    const interval = window.setInterval(refresh, 5000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [token])

  return null
}
