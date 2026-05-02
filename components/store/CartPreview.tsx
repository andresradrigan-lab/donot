'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readCart, type Cart } from '@/lib/cart'
import { formatClp } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { MascotaEmpty } from '@/components/store/MascotaEmpty'

export function CartPreview() {
  const [cart, setCart] = useState<Cart | null>(null)

  useEffect(() => {
    setCart(readCart())
    const onUpdate = () => setCart(readCart())
    window.addEventListener('donot:cart-updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('donot:cart-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  if (!cart) {
    return <p className="text-donot-muted">Cargando…</p>
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-6">
        <MascotaEmpty
          title="Tu cajita está vacía. Y eso está mal."
          message="Pásate al drop activo y arma una cajita."
        />
        <Link href="/droop/droop_001">
          <Button>Ver el drop</Button>
        </Link>
      </div>
    )
  }

  const subtotal = cart.items.reduce(
    (sum, it) => sum + it.boxPriceClp * it.quantity,
    0,
  )

  return (
    <div className="flex flex-col gap-5">
      {cart.items.map((it) => (
        <article
          key={it.lineId}
          className="bg-white border border-donot-border rounded-2xl p-5 shadow-soft"
        >
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-xl text-donot-verde">
              {it.boxName}
              {it.quantity > 1 && (
                <span className="text-donot-muted font-sans text-base ml-2">
                  × {it.quantity}
                </span>
              )}
            </h3>
            <span className="font-display text-donot-naranjo">
              {formatClp(it.boxPriceClp * it.quantity)}
            </span>
          </div>
          <ul className="text-donot-ink/85 text-sm space-y-1">
            {Object.entries(it.flavors).map(([slug, qty]) => (
              <li key={slug}>
                <span className="text-donot-muted">{qty} ×</span>{' '}
                {it.flavorNames[slug] ?? slug}
              </li>
            ))}
          </ul>
        </article>
      ))}

      <div className="bg-donot-verde text-donot-crema rounded-2xl p-5 mt-2 flex items-baseline justify-between">
        <span className="font-display text-xl">Subtotal</span>
        <span className="font-display text-2xl">{formatClp(subtotal)}</span>
      </div>

      <p className="text-donot-muted text-sm">
        El descuento, despacho y pago se calculan en el siguiente sprint.
      </p>
    </div>
  )
}
