'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ArrowRight, Truck, Sparkles } from 'lucide-react'
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

  if (!cart) {
    return (
      <p className="text-donot-muted py-20 text-center">Cargando…</p>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-6">
        <MascotaEmpty
          title="Tu cajita está vacía. Y eso está mal."
          message="Pásate al drop activo y arma una cajita."
        />
        <Link href="/droop/droop_001">
          <Button>Ver el drop activo →</Button>
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
  let freeShippingBanner: { text: string; success: boolean } | null = null
  if (freeShipping) {
    const { thresholdClp, minBoxes } = freeShipping
    const fitsByBoxes = minBoxes != null && boxCount >= minBoxes
    const fitsBySubtotal = thresholdClp != null && subtotal - discount >= thresholdClp
    if (!fitsByBoxes && !fitsBySubtotal) {
      if (thresholdClp != null) {
        const missing = thresholdClp - (subtotal - discount)
        if (missing > 0 && missing <= thresholdClp) {
          freeShippingBanner = {
            text: `Te faltan ${formatClp(missing)} para envío gratis.`,
            success: false,
          }
        }
      }
      if (!freeShippingBanner && minBoxes != null && minBoxes - boxCount > 0) {
        const missingBoxes = minBoxes - boxCount
        freeShippingBanner = {
          text: `Te ${
            missingBoxes === 1 ? 'falta 1 caja' : `faltan ${missingBoxes} cajas`
          } para envío gratis.`,
          success: false,
        }
      }
    } else {
      freeShippingBanner = { text: '¡Listo! Tu envío va por la casa.', success: true }
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] items-start">
      {/* Items */}
      <div className="flex flex-col gap-5">
        {cart.items.map((it) => {
          const flavorEntries = Object.entries(it.flavors)
          return (
            <article
              key={it.lineId}
              className="bg-white border border-donot-border rounded-[1.75rem] p-5 md:p-6 shadow-soft hover:shadow-pop transition-shadow"
            >
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-donot-rosado/15 text-donot-rosado text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">
                    {it.slotCount} donas
                  </span>
                  <h3 className="font-display text-2xl text-donot-verde leading-tight">
                    {it.boxName.replace('Cajita ', '')}
                  </h3>
                </div>
                <span className="font-sans font-bold text-xl text-donot-naranjo whitespace-nowrap">
                  {formatClp(it.boxPriceClp * it.quantity)}
                </span>
              </div>

              {/* Thumbs de sabores */}
              <div className="flex flex-wrap gap-2 mb-4">
                {flavorEntries.map(([slug, qty]) => (
                  <div
                    key={slug}
                    className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-donot-crema bg-donot-rowAlt shrink-0 shadow-sm"
                    title={`${qty} × ${it.flavorNames[slug] ?? slug}`}
                  >
                    <Image
                      src={`/menu/${slug}.png`}
                      alt={it.flavorNames[slug] ?? slug}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                    {qty > 1 && (
                      <span className="absolute -bottom-0 -right-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-donot-verde text-donot-crema text-[10px] font-bold border-2 border-white">
                        {qty}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-donot-muted text-xs mb-4 leading-relaxed">
                {flavorEntries
                  .map(([slug, qty]) => `${qty}× ${it.flavorNames[slug] ?? slug}`)
                  .join(' · ')}
              </p>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-donot-border">
                <div className="inline-flex items-center gap-1 bg-donot-crema rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => modifyQty(it.lineId, -1)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white transition"
                    aria-label="Restar una caja"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-display text-lg min-w-[1.5ch] text-center text-donot-verde">
                    {it.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => modifyQty(it.lineId, +1)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white transition"
                    aria-label="Sumar una caja"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/caja/${it.boxSlug}`}
                    className="text-sm text-donot-verde font-semibold hover:text-donot-naranjo transition px-3 py-2"
                  >
                    Editar sabores
                  </Link>
                  <button
                    type="button"
                    onClick={() => drop(it.lineId)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10 transition"
                    aria-label="Quitar del carrito"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        <Link
          href="/droop/droop_001"
          className="inline-flex items-center gap-2 text-donot-naranjo font-bold hover:gap-3 transition-all self-start mt-2"
        >
          <Plus size={18} />
          Sumar otra cajita
        </Link>
      </div>

      {/* Resumen sticky */}
      <aside className="bg-white border border-donot-border rounded-[1.75rem] p-6 md:p-7 lg:sticky lg:top-24 flex flex-col gap-5 shadow-soft">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-donot-verde/10 text-donot-verde text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">
            Resumen
          </span>
          <h2 className="font-display text-3xl text-donot-verde leading-tight">
            Total <span className="italic text-donot-naranjo">parcial</span>
          </h2>
        </div>

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

        <dl className="text-donot-ink space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-donot-muted">Subtotal ({boxCount} {boxCount === 1 ? 'cajita' : 'cajitas'})</dt>
            <dd className="font-semibold">{formatClp(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-donot-naranjo">
              <dt className="font-bold">Descuento {coupon?.code && `· ${coupon.code}`}</dt>
              <dd className="font-bold">−{formatClp(discount)}</dd>
            </div>
          )}
          {coupon?.freeShipping && (
            <div className="flex justify-between text-donot-naranjo text-sm">
              <dt className="font-bold">Envío</dt>
              <dd className="font-bold">Por la casa</dd>
            </div>
          )}
        </dl>

        {freeShippingBanner && (
          <div
            className={`flex items-start gap-2.5 text-sm rounded-2xl px-4 py-3 ${
              freeShippingBanner.success
                ? 'bg-donot-verde/10 text-donot-verde'
                : 'bg-donot-azulPastel/30 text-donot-verde'
            }`}
          >
            {freeShippingBanner.success ? (
              <Sparkles size={16} className="mt-0.5 shrink-0" />
            ) : (
              <Truck size={16} className="mt-0.5 shrink-0" />
            )}
            <span className="font-semibold leading-snug">{freeShippingBanner.text}</span>
          </div>
        )}

        <div className="border-t-2 border-dashed border-donot-border pt-4 flex justify-between items-baseline">
          <span className="font-display text-xl text-donot-verde">Total</span>
          <span className="font-display text-3xl text-donot-verde">
            {formatClp(subtotal - discount)}
          </span>
        </div>

        <p className="text-xs text-donot-muted leading-relaxed">
          El envío se calcula al ingresar tu comuna en el siguiente paso.
        </p>

        <Link
          href={`/checkout${coupon ? `?cupon=${coupon.code}` : ''}`}
          className="block"
        >
          <Button size="lg" className="w-full inline-flex items-center justify-center gap-2">
            Ir a pagar
            <ArrowRight size={18} />
          </Button>
        </Link>
      </aside>
    </div>
  )
}
