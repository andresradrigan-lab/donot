'use client'

import { useEffect, useState } from 'react'
import { Check, Clock, Package, Truck, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

interface Timestamps {
  paidAt: string | null
  preparingAt: string | null
  inTransitAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}

interface Props {
  token: string
  initialStatus: OrderStatus
  initialTimestamps: Timestamps
}

const FLOW = [
  { key: 'PAID', label: 'Pagado', icon: Check, ts: 'paidAt' as const },
  { key: 'PREPARING', label: 'Preparando', icon: Clock, ts: 'preparingAt' as const },
  { key: 'IN_TRANSIT', label: 'En camino', icon: Truck, ts: 'inTransitAt' as const },
  { key: 'DELIVERED', label: 'Entregado', icon: Package, ts: 'deliveredAt' as const },
] as const

const POLL_MS = 15_000

function formatRelative(iso: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMin = Math.floor((now - then) / 60_000)
  if (diffMin < 1) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const d = Math.floor(diffH / 24)
  return `hace ${d}d`
}

export function OrderTimeline({ token, initialStatus, initialTimestamps }: Props) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [timestamps, setTimestamps] = useState<Timestamps>(initialTimestamps)
  // Re-render cada minuto para que los "hace X min" se actualicen.
  const [, setTick] = useState(0)

  useEffect(() => {
    const tickInt = setInterval(() => setTick((t) => t + 1), 60_000)
    const pollInt = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${token}`, { cache: 'no-store' })
        if (!res.ok) return
        const { order } = await res.json()
        if (!order) return
        setStatus(order.status)
        setTimestamps({
          paidAt: order.paidAt,
          preparingAt: order.preparingAt,
          inTransitAt: order.inTransitAt,
          deliveredAt: order.deliveredAt,
          cancelledAt: order.cancelledAt,
        })
      } catch {
        /* network blip — siguiente intento */
      }
    }, POLL_MS)

    return () => {
      clearInterval(tickInt)
      clearInterval(pollInt)
    }
  }, [token])

  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED'
  const isPending = status === 'PENDING'

  if (isPending) {
    return (
      <div className="mb-8 px-5 py-4 bg-donot-azulPastel/30 rounded-2xl text-donot-verde">
        <p className="font-semibold">Esperando confirmación de pago.</p>
        <p className="text-sm text-donot-muted">
          Si pagaste hace un momento, dale unos segundos. La página se actualiza sola.
        </p>
      </div>
    )
  }

  if (isCancelled) {
    const when = formatRelative(timestamps.cancelledAt)
    return (
      <div className="mb-8 px-5 py-4 bg-donot-naranjo/10 rounded-2xl text-donot-naranjo flex items-start gap-3">
        <X size={20} className="mt-0.5" />
        <div>
          <p className="font-semibold">
            {status === 'CANCELLED' ? 'Pedido cancelado' : 'Pedido reembolsado'}
            {when && <span className="text-donot-muted font-normal text-sm ml-2">{when}</span>}
          </p>
          <p className="text-sm text-donot-muted">
            Si necesitas ayuda, escríbenos a hola@donot.cl.
          </p>
        </div>
      </div>
    )
  }

  const currentIdx = FLOW.findIndex((s) => s.key === status)

  return (
    <ol className="grid gap-3 mb-8">
      {FLOW.map((step, idx) => {
        const Icon = step.icon
        const reached = idx <= currentIdx
        const isCurrent = idx === currentIdx
        const when = formatRelative(timestamps[step.ts])
        return (
          <li
            key={step.key}
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-2xl border transition-colors',
              reached
                ? 'border-donot-verde bg-donot-verde/5 text-donot-verde'
                : 'border-donot-border text-donot-muted',
              isCurrent && 'ring-2 ring-donot-verde/30',
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                reached ? 'bg-donot-verde text-donot-crema' : 'bg-donot-rowAlt',
              )}
            >
              <Icon size={16} />
            </span>
            <span className="font-display text-lg flex-1">{step.label}</span>
            {when && (
              <span className="text-xs text-donot-muted font-normal whitespace-nowrap">
                {when}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
