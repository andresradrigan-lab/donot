'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react'
import {
  readCart,
  removeItem,
  updateQuantity,
  type Cart,
} from '@/lib/cart'
import { formatClp } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { MascotaEmpty } from '@/components/store/MascotaEmpty'
import { cn } from '@/lib/utils'

interface FreeShipping {
  thresholdClp: number | null
  minBoxes: number | null
}

const OPEN_EVENT = 'donot:cart-open'
const CART_EVENT = 'donot:cart-updated'

/** Helper para que cualquier botón pueda abrir/cerrar el drawer. */
export function openMiniCart() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { open: true } }))
}

export function MiniCart() {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<Cart | null>(null)
  const [freeShipping, setFreeShipping] = useState<FreeShipping | null>(null)

  // Cargar cart inicial + escuchar cambios
  useEffect(() => {
    setCart(readCart())
    const onUpdate = () => setCart(readCart())
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { open?: boolean } | undefined
      setOpen(detail?.open ?? true)
    }
    window.addEventListener(CART_EVENT, onUpdate)
    window.addEventListener('storage', onUpdate)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener(CART_EVENT, onUpdate)
      window.removeEventListener('storage', onUpdate)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  // Cobertura para el threshold global
  useEffect(() => {
    fetch('/api/coverage')
      .then((r) => r.json())
      .then((d) => setFreeShipping(d.freeShipping))
      .catch(() => null)
  }, [])

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Esc para cerrar
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const items = cart?.items ?? []
  const subtotal = items.reduce((s, it) => s + it.boxPriceClp * it.quantity, 0)
  const boxCount = items.reduce((s, it) => s + it.quantity, 0)

  // Cálculo de progreso hacia envío gratis
  let progressPct = 0
  let progressLabel: string | null = null
  if (freeShipping && (freeShipping.thresholdClp != null || freeShipping.minBoxes != null)) {
    const byMoney = freeShipping.thresholdClp != null
      ? Math.min(100, Math.round((subtotal / freeShipping.thresholdClp) * 100))
      : 0
    const byBoxes = freeShipping.minBoxes != null
      ? Math.min(100, Math.round((boxCount / freeShipping.minBoxes) * 100))
      : 0
    progressPct = Math.max(byMoney, byBoxes)

    const moneyMissing = freeShipping.thresholdClp != null
      ? freeShipping.thresholdClp - subtotal
      : Infinity
    const boxesMissing = freeShipping.minBoxes != null
      ? freeShipping.minBoxes - boxCount
      : Infinity

    const fits = progressPct >= 100
    if (fits) {
      progressLabel = '¡Envío gratis desbloqueado!'
    } else if (moneyMissing <= boxesMissing * 10000) {
      progressLabel = `Te faltan ${formatClp(Math.max(0, moneyMissing))} para envío gratis`
    } else {
      const missing = Math.max(0, boxesMissing)
      progressLabel = `Te ${missing === 1 ? 'falta 1 caja' : `faltan ${missing} cajas`} para envío gratis`
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 bg-donot-verde/40 backdrop-blur-sm z-40 transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 w-full max-w-md bg-donot-crema z-50 flex flex-col shadow-pop transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
        aria-label="Tu cajita"
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-donot-border bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-donot-verde" />
            <h2 className="font-display text-xl text-donot-verde">
              Tu cajita
            </h2>
            {boxCount > 0 && (
              <span className="text-sm text-donot-muted">({boxCount})</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-donot-rowAlt transition"
          >
            <X size={18} />
          </button>
        </header>

        {/* Barra de envío gratis */}
        {progressLabel && items.length > 0 && (
          <div className="px-6 py-4 bg-donot-azulPastel/20 border-b border-donot-border">
            <p
              className={cn(
                'text-sm mb-2',
                progressPct >= 100 ? 'text-donot-verde font-semibold' : 'text-donot-ink',
              )}
            >
              {progressLabel}
            </p>
            <div className="h-2 rounded-full bg-white/70 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  progressPct >= 100 ? 'bg-donot-verde' : 'bg-donot-naranjo',
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista o empty */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-4">
              <MascotaEmpty
                title="Tu cajita está vacía. Y eso está mal."
                message="Pásate al drop activo y arma una cajita."
              />
              <Link href="/droop/droop_001" onClick={() => setOpen(false)}>
                <Button>Ver el drop</Button>
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li
                  key={it.lineId}
                  className="bg-white border border-donot-border rounded-2xl p-4"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <p className="font-display text-donot-verde text-base">
                      {it.boxName}
                    </p>
                    <p className="font-display text-donot-naranjo whitespace-nowrap">
                      {formatClp(it.boxPriceClp * it.quantity)}
                    </p>
                  </div>
                  <ul className="text-donot-muted text-xs space-y-0.5 mb-3">
                    {Object.entries(it.flavors).map(([slug, qty]) => (
                      <li key={slug}>
                        {qty} × {it.flavorNames[slug] ?? slug}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 border border-donot-border rounded-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (it.quantity <= 1) {
                            setCart(removeItem(it.lineId))
                          } else {
                            setCart(updateQuantity(it.lineId, it.quantity - 1))
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-donot-rowAlt"
                        aria-label="Restar"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-display min-w-[1.5ch] text-center text-sm">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCart(updateQuantity(it.lineId, it.quantity + 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-donot-rowAlt"
                        aria-label="Sumar"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCart(removeItem(it.lineId))}
                      className="text-donot-muted hover:text-donot-naranjo p-1"
                      aria-label="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer con subtotal + CTAs */}
        {items.length > 0 && (
          <footer className="border-t border-donot-border bg-white px-6 py-5 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-donot-ink">Subtotal</span>
              <span className="font-display text-xl text-donot-verde">
                {formatClp(subtotal)}
              </span>
            </div>
            <p className="text-xs text-donot-muted">
              Envío y descuentos se calculan en el checkout.
            </p>
            <div className="flex gap-2">
              <Link href="/carrito" onClick={() => setOpen(false)} className="flex-1">
                <Button variant="secondary" size="lg" className="w-full">
                  Ver carrito
                </Button>
              </Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className="flex-1">
                <Button size="lg" className="w-full">
                  Ir a pagar
                </Button>
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </>
  )
}
