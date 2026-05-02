'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import {
  readCart,
  removeItem,
  updateQuantity,
  type Cart,
} from '@/lib/cart'
import { formatClp } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { MascotaEmpty } from '@/components/store/MascotaEmpty'
import { CouponInput, type AppliedCoupon } from '@/components/store/CouponInput'
import { analytics } from '@/lib/analytics'

interface FreeShipping {
  thresholdClp: number | null
  minBoxes: number | null
}

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [freeShipping, setFreeShipping] = useState<FreeShipping | null>(null)

  useEffect(() => {
    const initial = readCart()
    setCart(initial)
    if (initial.items.length > 0) {
      analytics.viewCart({
        currency: 'CLP',
        value: initial.items.reduce((s, it) => s + it.boxPriceClp * it.quantity, 0),
        items: initial.items.map((it) => ({
          item_id: it.boxSlug,
          item_name: it.boxName,
          price: it.boxPriceClp,
          quantity: it.quantity,
        })),
      })
    }
    const onUpdate = () => setCart(readCart())
    window.addEventListener('donot:cart-updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('donot:cart-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  useEffect(() => {
    fetch('/api/coverage')
      .then((r) => r.json())
      .then((d) => setFreeShipping(d.freeShipping))
      .catch(() => null)
  }, [])

  const subtotal = useMemo(
    () =>
      cart?.items.reduce(
        (sum, it) => sum + it.boxPriceClp * it.quantity,
        0,
      ) ?? 0,
    [cart],
  )

  const boxCount = useMemo(
    () => cart?.items.reduce((s, it) => s + it.quantity, 0) ?? 0,
    [cart],
  )

  const discount = coupon?.discountClp ?? 0

  if (!cart) return <p className="text-donot-muted">Cargando…</p>

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

  function modifyQty(lineId: string, delta: number) {
    const current = cart!.items.find((it) => it.lineId === lineId)
    if (!current) return
    const next = current.quantity + delta
    if (next <= 0) {
      setCart(removeItem(lineId))
    } else {
      setCart(updateQuantity(lineId, next))
    }
  }

  function drop(lineId: string) {
    setCart(removeItem(lineId))
  }

  // Banner de cross-selling: cuán cerca del envío gratis.
  let freeShippingBanner: string | null = null
  if (freeShipping) {
    const { thresholdClp, minBoxes } = freeShipping
    const fitsByBoxes = minBoxes != null && boxCount >= minBoxes
    const fitsBySubtotal = thresholdClp != null && subtotal - discount >= thresholdClp
    if (!fitsByBoxes && !fitsBySubtotal) {
      if (thresholdClp != null) {
        const missing = thresholdClp - (subtotal - discount)
        if (missing > 0 && missing <= thresholdClp) {
          freeShippingBanner = `Te faltan ${formatClp(missing)} para envío gratis.`
        }
      }
      if (!freeShippingBanner && minBoxes != null && minBoxes - boxCount > 0) {
        const missingBoxes = minBoxes - boxCount
        freeShippingBanner = `Te ${
          missingBoxes === 1 ? 'falta 1 caja' : `faltan ${missingBoxes} cajas`
        } para envío gratis.`
      }
    } else {
      freeShippingBanner = '¡Listo! Tu envío va por la casa.'
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-start">
      <div className="flex flex-col gap-5">
        {cart.items.map((it) => (
          <article
            key={it.lineId}
            className="bg-white border border-donot-border rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-baseline justify-between mb-3 gap-3">
              <h3 className="font-display text-xl text-donot-verde">
                {it.boxName}
              </h3>
              <span className="font-display text-donot-naranjo whitespace-nowrap">
                {formatClp(it.boxPriceClp * it.quantity)}
              </span>
            </div>
            <ul className="text-donot-ink/85 text-sm space-y-1 mb-4">
              {Object.entries(it.flavors).map(([slug, qty]) => (
                <li key={slug}>
                  <span className="text-donot-muted">{qty} ×</span>{' '}
                  {it.flavorNames[slug] ?? slug}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 border border-donot-border rounded-full">
                <button
                  type="button"
                  onClick={() => modifyQty(it.lineId, -1)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-donot-rowAlt transition"
                  aria-label="Restar una caja"
                >
                  <Minus size={16} />
                </button>
                <span className="font-display min-w-[1.5ch] text-center">
                  {it.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => modifyQty(it.lineId, +1)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-donot-rowAlt transition"
                  aria-label="Sumar una caja"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/caja/${it.boxSlug}`}
                  className="text-sm text-donot-verde font-semibold hover:underline"
                >
                  Editar sabores
                </Link>
                <button
                  type="button"
                  onClick={() => drop(it.lineId)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10 transition"
                  aria-label="Quitar del carrito"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}

        <Link
          href="/droop/droop_001"
          className="text-donot-naranjo font-semibold hover:underline self-start"
        >
          + Sumar otra cajita
        </Link>
      </div>

      <aside className="bg-donot-rowAlt border border-donot-border rounded-3xl p-6 lg:sticky lg:top-24 flex flex-col gap-5">
        <h2 className="font-display text-2xl text-donot-verde">Resumen</h2>

        <CouponInput
          cart={cart}
          applied={coupon}
          onChange={(c) => {
            setCoupon(c)
            if (c)
              analytics.couponApplied({
                code: c.code,
                type: c.type,
                discount_clp: c.discountClp,
              })
          }}
        />

        <dl className="text-donot-ink space-y-2">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold">{formatClp(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-donot-naranjo">
              <dt>Descuento</dt>
              <dd className="font-semibold">−{formatClp(discount)}</dd>
            </div>
          )}
          {coupon?.freeShipping && (
            <div className="flex justify-between text-donot-naranjo text-sm">
              <dt>Envío</dt>
              <dd className="font-semibold">Por la casa</dd>
            </div>
          )}
        </dl>

        {freeShippingBanner && (
          <p className="text-sm text-donot-verde bg-donot-azulPastel/30 rounded-xl px-3 py-2">
            {freeShippingBanner}
          </p>
        )}

        <div className="border-t border-donot-border pt-4 flex justify-between text-lg">
          <span className="font-display text-donot-verde">Total parcial</span>
          <span className="font-display text-donot-verde">
            {formatClp(subtotal - discount)}
          </span>
        </div>
        <p className="text-xs text-donot-muted">
          El envío se calcula al ingresar tu comuna en el siguiente paso.
        </p>

        <Link href={`/checkout${coupon ? `?cupon=${coupon.code}` : ''}`}>
          <Button size="lg" className="w-full">
            Ir a pagar
          </Button>
        </Link>
      </aside>
    </div>
  )
}
