'use client'

import { useEffect } from 'react'
import { CART_STORAGE_KEY } from '@/lib/cart'

interface Props {
  token: string
}

/**
 * Limpia el carrito local cuando un pedido fue confirmado, ya sea porque
 * el redirect de la pasarela trae el token o porque el webhook lo marcó como
 * PAID antes que el redirect (consultando /api/orders/[token]).
 */
export function CheckoutSuccessRefresher({ token }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    async function refresh() {
      // Forzar un refresh contra la pasarela para casos donde el webhook
      // no llegó todavía (ej. desarrollo en localhost).
      try {
        await fetch(`/api/orders/${token}/refresh`, { method: 'POST' })
      } catch {
        // continúa
      }
      try {
        const res = await fetch(`/api/orders/${token}`)
        if (!res.ok) return
        const { order } = await res.json()
        if (cancelled) return
        if (order?.status && order.status !== 'PENDING') {
          window.localStorage.removeItem(CART_STORAGE_KEY)
          window.dispatchEvent(new CustomEvent('donot:cart-updated'))
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
