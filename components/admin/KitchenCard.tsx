'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, MapPin, Home, ChefHat, Truck, Check, ExternalLink } from 'lucide-react'
import type { OrderStatus, DeliveryMethod } from '@prisma/client'
import { cn } from '@/lib/utils'

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

interface OrderItemLite {
  id: string
  boxNameSnapshot: string
  quantity: number
  flavors: FlavorLine[]
}

export interface KitchenOrder {
  id: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  deliveryMethod: DeliveryMethod
  deliveryCommune: string | null
  deliveryAddress: string | null
  deliveryDate: Date | null
  deliveryTimeSlot: string | null
  items: OrderItemLite[]
}

const NEXT_STATE: Partial<Record<OrderStatus, { value: OrderStatus; label: string; icon: typeof ChefHat }>> = {
  PAID: { value: 'PREPARING', label: 'Empezar a preparar', icon: ChefHat },
  PREPARING: { value: 'IN_TRANSIT', label: 'Listo para despacho', icon: Truck },
  IN_TRANSIT: { value: 'DELIVERED', label: 'Entregado', icon: Check },
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Esperando pago',
  PAID: 'Pagado',
  PREPARING: 'Preparando',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const STATUS_BG: Record<OrderStatus, string> = {
  PENDING: 'bg-donot-azulPastel/40',
  PAID: 'bg-donot-verde/10',
  PREPARING: 'bg-donot-rosado/15',
  IN_TRANSIT: 'bg-donot-naranjo/15',
  DELIVERED: 'bg-donot-verde/20',
  CANCELLED: 'bg-donot-naranjo/15',
  REFUNDED: 'bg-donot-muted/20',
}

interface Props {
  order: KitchenOrder
}

export function KitchenCard({ order }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const next = NEXT_STATE[order.status]

  async function advance() {
    if (!next) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next.value }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos cambiar el estado.')
        return
      }
      router.refresh()
    } catch {
      setError('Error de conexión. Reintenta.')
    } finally {
      setSubmitting(false)
    }
  }

  const dateLabel = order.deliveryDate
    ? new Intl.DateTimeFormat('es-CL', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      }).format(order.deliveryDate)
    : '—'

  const isDelivery = order.deliveryMethod === 'DELIVERY'

  return (
    <article className="bg-white border-2 border-donot-border rounded-3xl shadow-soft overflow-hidden">
      <header
        className={cn(
          'px-6 py-4 flex items-center justify-between gap-3',
          STATUS_BG[order.status],
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-donot-muted">
            Pedido
          </p>
          <h2 className="font-display text-2xl text-donot-verde leading-tight">
            {order.orderNumber}
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/70 text-donot-verde text-sm font-semibold">
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-donot-ink">
          <div>
            <p className="text-xs text-donot-muted uppercase tracking-wide mb-1">
              Cuándo
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-donot-verde shrink-0" />
              <span className="capitalize">
                {dateLabel}
                {order.deliveryTimeSlot && (
                  <span className="block text-donot-naranjo font-display text-base">
                    {order.deliveryTimeSlot}h
                  </span>
                )}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-donot-muted uppercase tracking-wide mb-1">
              Cómo
            </p>
            <div className="flex items-center gap-2 text-sm">
              {isDelivery ? (
                <MapPin size={16} className="text-donot-verde shrink-0" />
              ) : (
                <Home size={16} className="text-donot-verde shrink-0" />
              )}
              <span>
                {isDelivery ? (
                  <>
                    Despacho
                    <span className="block font-semibold text-donot-verde">
                      {order.deliveryCommune}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-donot-verde">
                    Retiro {order.deliveryMethod === 'PICKUP_CONCON' ? 'Concón' : 'Reñaca'}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-donot-muted uppercase tracking-wide mb-2">
            Cajita ({order.items.reduce((s, it) => s + it.quantity, 0)})
          </p>
          <ul className="space-y-2">
            {order.items.map((it) => (
              <li
                key={it.id}
                className="bg-donot-rowAlt rounded-xl px-4 py-3"
              >
                <p className="font-display text-donot-verde">
                  {it.boxNameSnapshot}
                  {it.quantity > 1 && ` × ${it.quantity}`}
                </p>
                <p className="text-donot-ink text-sm mt-1 leading-relaxed">
                  {it.flavors
                    .map((f) => `${f.qty} × ${f.flavorName}`)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm border-t border-donot-border pt-3">
          <span className="text-donot-muted">{order.customerName}</span>
          <Link
            href={`/admin/pedidos/${order.id}`}
            className="text-donot-naranjo font-semibold hover:underline inline-flex items-center gap-1"
          >
            Detalle <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {next && (
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={advance}
            disabled={submitting}
            className={cn(
              'w-full inline-flex items-center justify-center gap-3 py-5 rounded-2xl bg-donot-naranjo text-white font-display text-xl hover:bg-donot-naranjo/90 transition disabled:opacity-50',
            )}
          >
            <next.icon size={22} />
            {submitting ? 'Guardando…' : next.label}
          </button>
          {error && (
            <p className="text-sm text-donot-naranjo text-center mt-2">{error}</p>
          )}
        </div>
      )}
    </article>
  )
}
