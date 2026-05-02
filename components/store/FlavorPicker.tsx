'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Check } from 'lucide-react'
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
  const router = useRouter()
  const [selection, setSelection] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)

  // Recuperar progreso del configurador desde localStorage al montar.
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

  // Persistir cambios mientras el usuario configura.
  useEffect(() => {
    if (!hydrated) return
    writeInProgress(box.slug, selection)
  }, [box.slug, selection, hydrated])

  const total = totalSlotsSelected(selection)
  const remaining = box.slotCount - total
  const isComplete = total === box.slotCount

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
    router.push('/carrito')
  }

  return (
    <section className="px-6 md:px-10 pt-8 md:pt-12 pb-32 md:pb-24 max-w-8xl mx-auto">
      <ol className="flex items-center gap-3 text-sm text-donot-muted mb-6">
        <li className="flex items-center gap-2 text-donot-verde font-semibold">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-donot-verde text-donot-crema text-xs">
            <Check size={14} />
          </span>
          Caja elegida
        </li>
        <li>·</li>
        <li className="flex items-center gap-2 text-donot-verde font-semibold">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-donot-naranjo text-white text-xs font-bold">
            2
          </span>
          Elige tus sabores
        </li>
      </ol>

      <header className="bg-donot-rowAlt rounded-3xl border border-donot-border p-5 md:p-7 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
            {box.name}
          </h1>
          <p className="text-donot-muted">
            {box.slotCount} donas · {formatClp(box.priceClp)}
          </p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-display text-2xl border-2 transition',
            isComplete
              ? 'bg-donot-verde text-donot-crema border-donot-verde'
              : 'bg-white text-donot-verde border-donot-border',
          )}
          aria-live="polite"
        >
          {total}/{box.slotCount}
          {isComplete && <Check size={20} />}
        </div>
      </header>

      {flavors.length === 0 ? (
        <div className="text-center py-20 text-donot-muted">
          Hoy no hay sabores disponibles para esta cajita. Vuelve más rato.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {flavors.map((flavor) => {
            const qty = selection[flavor.slug] ?? 0
            const canAdd = total < box.slotCount
            return (
              <article
                key={flavor.id}
                className={cn(
                  'bg-white rounded-2xl border border-donot-border shadow-soft overflow-hidden flex flex-col',
                  qty > 0 && 'ring-2 ring-donot-naranjo border-donot-naranjo',
                )}
              >
                <div className="relative aspect-square bg-donot-rowAlt">
                  <Image
                    src={flavor.imageUrl}
                    alt={flavor.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {qty > 0 && (
                    <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-donot-naranjo text-white font-display text-sm">
                      ×{qty}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="font-display text-lg text-donot-verde leading-tight">
                    {flavor.name}
                  </h3>
                  <p className="text-donot-muted text-xs leading-relaxed line-clamp-3">
                    {flavor.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => dec(flavor.slug)}
                      disabled={qty === 0}
                      aria-label={`Quitar una ${flavor.name}`}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-donot-verde text-donot-verde hover:bg-donot-verde hover:text-donot-crema transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-donot-verde"
                    >
                      <Minus size={18} />
                    </button>
                    <span
                      aria-live="polite"
                      className="font-display text-xl text-donot-verde min-w-[2ch] text-center"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => inc(flavor.slug)}
                      disabled={!canAdd}
                      aria-label={`Agregar una ${flavor.name}`}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-donot-naranjo text-white hover:bg-donot-naranjo/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* CTA sticky en mobile, normal en desktop */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-donot-crema/95 backdrop-blur border-t border-donot-border md:static md:bg-transparent md:border-0 md:mt-10 md:flex md:justify-end">
        <div className="max-w-8xl mx-auto px-6 py-4 md:px-0 md:py-0 flex items-center justify-between gap-4 md:justify-end md:gap-6">
          <p className="text-donot-muted text-sm md:hidden">
            {isComplete
              ? '¡Listo! Confirma tu cajita.'
              : `Te ${remaining === 1 ? 'falta 1' : `faltan ${remaining}`}.`}
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={!isComplete}
            className={cn(
              'inline-flex items-center justify-center px-6 py-3.5 rounded-full font-display text-lg transition',
              isComplete
                ? 'bg-donot-naranjo text-white hover:bg-donot-naranjo/90'
                : 'bg-donot-border/60 text-donot-muted cursor-not-allowed',
            )}
          >
            Quiero estas donas
          </button>
        </div>
      </div>
    </section>
  )
}
