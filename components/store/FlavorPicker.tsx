'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, Check, ArrowRight, Sparkles } from 'lucide-react'
import type { Flavor, Box } from '@prisma/client'
import { cn } from '@/lib/utils'
import { formatClp } from '@/lib/format'
import {
  addItem,
  clearInProgress,
  readInProgress,
  totalSlotsSelected,
  writeInProgress,
  type CartItem,
} from '@/lib/cart'
import { analytics } from '@/lib/analytics'
import { openMiniCart } from '@/components/store/MiniCart'

interface Props {
  box: Box
  flavors: Flavor[]
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function FlavorPicker({ box, flavors }: Props) {
  const [selection, setSelection] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const validSlugs = new Set(flavors.map((f) => f.slug))
    const raw = readInProgress(box.slug)
    const sanitized: Record<string, number> = {}
    let total = 0
    for (const [slug, qty] of Object.entries(raw)) {
      if (!validSlugs.has(slug)) continue
      const n = Math.max(0, Math.min(box.slotCount - total, Number(qty) || 0))
      if (n > 0) {
        sanitized[slug] = n
        total += n
      }
    }
    setSelection(sanitized)
    setHydrated(true)
  }, [box.slug, box.slotCount, flavors])

  useEffect(() => {
    if (!hydrated) return
    writeInProgress(box.slug, selection)
  }, [box.slug, selection, hydrated])

  const total = totalSlotsSelected(selection)
  const remaining = box.slotCount - total
  const isComplete = total === box.slotCount
  const progress = (total / box.slotCount) * 100

  function inc(slug: string) {
    if (total >= box.slotCount) return
    setSelection((s) => ({ ...s, [slug]: (s[slug] ?? 0) + 1 }))
  }

  function dec(slug: string) {
    setSelection((s) => {
      const cur = s[slug] ?? 0
      if (cur <= 0) return s
      const next = { ...s, [slug]: cur - 1 }
      if (next[slug] === 0) delete next[slug]
      return next
    })
  }

  function confirm() {
    if (!isComplete) return

    const flavorNames: Record<string, string> = {}
    for (const slug of Object.keys(selection)) {
      const flavor = flavors.find((f) => f.slug === slug)
      if (flavor) flavorNames[slug] = flavor.name
    }

    const item: CartItem = {
      lineId: uuid(),
      boxSlug: box.slug,
      boxName: box.name,
      boxPriceClp: box.priceClp,
      slotCount: box.slotCount,
      flavors: { ...selection },
      flavorNames,
      quantity: 1,
    }
    addItem(item)
    clearInProgress(box.slug)

    analytics.addToCart({
      currency: 'CLP',
      value: box.priceClp,
      items: [
        {
          item_id: box.slug,
          item_name: box.name,
          price: box.priceClp,
          quantity: 1,
          item_category: box.category,
        },
      ],
    })

    openMiniCart()
  }

  return (
    <section className="relative px-6 md:px-10 pt-8 md:pt-12 pb-32 md:pb-24 max-w-8xl mx-auto overflow-hidden">
      {/* Decoración */}
      <div
        aria-hidden
        className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-donot-rosado/10 blur-3xl pointer-events-none"
      />

      {/* Stepper */}
      <ol className="relative flex items-center gap-3 text-sm mb-6">
        <li className="flex items-center gap-2 text-donot-verde font-semibold">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-donot-verde text-donot-crema">
            <Check size={14} />
          </span>
          Caja
        </li>
        <li className="flex-1 h-[2px] bg-donot-verde/30 max-w-[3rem]" />
        <li className="flex items-center gap-2 text-donot-verde font-semibold">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-donot-naranjo text-white text-xs font-bold">
            2
          </span>
          Sabores
        </li>
      </ol>

      {/* Header sticky con progreso */}
      <header className="relative bg-white rounded-[2rem] border border-donot-border shadow-soft p-5 md:p-7 mb-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2.5 py-1 rounded-full bg-donot-rosado/15 text-donot-rosado text-[10px] font-bold uppercase tracking-[0.15em] mb-2">
              Armando tu cajita
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-donot-verde leading-tight">
              {box.name.replace('Cajita ', '')}
            </h1>
            <p className="text-donot-muted mt-1">
              {box.slotCount} donas · {formatClp(box.priceClp)}
            </p>
          </div>

          <div
            className={cn(
              'inline-flex items-center gap-2 px-5 py-3 rounded-full font-display text-2xl border-2 transition shrink-0',
              isComplete
                ? 'bg-donot-verde text-donot-crema border-donot-verde shadow-pop'
                : 'bg-donot-crema text-donot-verde border-donot-border',
            )}
            aria-live="polite"
          >
            {total}/{box.slotCount}
            {isComplete && <Check size={20} />}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 h-2 bg-donot-rowAlt rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              isComplete ? 'bg-donot-verde' : 'bg-donot-naranjo',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-donot-muted mt-3">
          {isComplete ? (
            <>
              <Sparkles size={14} className="inline text-donot-naranjo mr-1" />
              ¡Cajita completa! Confirmá abajo para sumarla al carrito.
            </>
          ) : (
            <>
              Te {remaining === 1 ? 'falta 1 sabor' : `faltan ${remaining} sabores`}. Podés repetir los que quieras.
            </>
          )}
        </p>
      </header>

      {flavors.length === 0 ? (
        <div className="text-center py-20 text-donot-muted">
          Hoy no hay sabores disponibles para esta cajita. Vuelve más rato.
        </div>
      ) : (
        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {flavors.map((flavor) => {
            const qty = selection[flavor.slug] ?? 0
            const canAdd = total < box.slotCount
            return (
              <article
                key={flavor.id}
                className={cn(
                  'group bg-white rounded-2xl border-2 shadow-soft overflow-hidden flex flex-col transition-all duration-200',
                  qty > 0
                    ? 'border-donot-naranjo shadow-pop -translate-y-1'
                    : 'border-donot-border hover:shadow-pop hover:-translate-y-0.5',
                )}
              >
                <div className="relative aspect-square bg-donot-rowAlt overflow-hidden">
                  <Image
                    src={flavor.imageUrl}
                    alt={flavor.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={cn(
                      'object-cover transition-transform duration-500',
                      qty === 0 && 'group-hover:scale-105',
                    )}
                  />
                  {qty > 0 && (
                    <>
                      <div className="absolute inset-0 bg-donot-naranjo/10 pointer-events-none" />
                      <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-full bg-donot-naranjo text-white font-display text-base shadow-pop">
                        ×{qty}
                      </span>
                    </>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-display text-lg md:text-xl text-donot-verde leading-tight">
                    {flavor.name}
                  </h3>
                  <p className="text-donot-muted text-xs leading-relaxed line-clamp-3">
                    {flavor.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => dec(flavor.slug)}
                      disabled={qty === 0}
                      aria-label={`Quitar una ${flavor.name}`}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-donot-verde text-donot-verde hover:bg-donot-verde hover:text-donot-crema transition disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-donot-verde"
                    >
                      <Minus size={18} />
                    </button>
                    <span
                      aria-live="polite"
                      className="font-display text-2xl text-donot-verde min-w-[2ch] text-center"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => inc(flavor.slug)}
                      disabled={!canAdd}
                      aria-label={`Agregar una ${flavor.name}`}
                      className={cn(
                        'inline-flex items-center justify-center w-11 h-11 rounded-full transition shadow-soft',
                        canAdd
                          ? 'bg-donot-naranjo text-white hover:bg-donot-naranjo/90'
                          : 'bg-donot-border/50 text-donot-muted cursor-not-allowed',
                      )}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* CTA sticky bottom — visible siempre en mobile y arriba del fold en desktop cuando complete */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-donot-crema/95 backdrop-blur border-t border-donot-border md:static md:bg-transparent md:border-0 md:mt-12 md:flex md:justify-end">
        <div className="max-w-8xl mx-auto px-6 py-4 md:px-0 md:py-0 w-full flex items-center justify-between gap-4 md:justify-end md:gap-6">
          <div className="md:hidden flex-1">
            <p className="text-xs text-donot-muted leading-tight">
              {isComplete ? '¡Cajita lista!' : `Te ${remaining === 1 ? 'falta 1' : `faltan ${remaining}`}`}
            </p>
            <p className="font-sans font-bold text-donot-naranjo">
              {formatClp(box.priceClp)}
            </p>
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={!isComplete}
            className={cn(
              'inline-flex items-center gap-2 px-6 md:px-8 py-3.5 rounded-full font-bold text-base md:text-lg transition shadow-soft',
              isComplete
                ? 'bg-donot-naranjo text-white hover:bg-donot-naranjo/90 hover:shadow-pop'
                : 'bg-donot-border/60 text-donot-muted cursor-not-allowed',
            )}
          >
            {isComplete ? 'Sumar al carrito' : 'Sigue eligiendo'}
            {isComplete && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </section>
  )
}
