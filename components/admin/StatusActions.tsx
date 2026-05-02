'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OrderStatus } from '@prisma/client'
import { cn } from '@/lib/utils'

const NEXT_OPTIONS: Partial<Record<OrderStatus, { value: OrderStatus; label: string; tone: 'primary' | 'danger' }[]>> = {
  PAID: [
    { value: 'PREPARING', label: 'Empezar a preparar', tone: 'primary' },
    { value: 'CANCELLED', label: 'Cancelar pedido', tone: 'danger' },
  ],
  PREPARING: [
    { value: 'IN_TRANSIT', label: 'Listo para despacho', tone: 'primary' },
    { value: 'CANCELLED', label: 'Cancelar pedido', tone: 'danger' },
  ],
  IN_TRANSIT: [
    { value: 'DELIVERED', label: 'Marcar entregado', tone: 'primary' },
    { value: 'CANCELLED', label: 'Cancelar pedido', tone: 'danger' },
  ],
  PENDING: [{ value: 'CANCELLED', label: 'Cancelar pedido', tone: 'danger' }],
}

interface Props {
  orderId: string
  currentStatus: OrderStatus
}

export function StatusActions({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const options = NEXT_OPTIONS[currentStatus] ?? []
  if (options.length === 0) {
    return (
      <p className="text-sm text-donot-muted">
        Este pedido ya cerró su flujo. No hay transiciones disponibles.
      </p>
    )
  }

  async function transition(next: OrderStatus, label: string) {
    if (next === 'CANCELLED' && !window.confirm(`¿Cancelar este pedido?`)) return
    setSubmitting(next)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
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
      setSubmitting(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => transition(opt.value, opt.label)}
            disabled={submitting !== null}
            className={cn(
              'px-5 py-3 rounded-full font-display transition disabled:opacity-50',
              opt.tone === 'primary'
                ? 'bg-donot-naranjo text-white hover:bg-donot-naranjo/90'
                : 'border-2 border-donot-naranjo text-donot-naranjo hover:bg-donot-naranjo/10',
            )}
          >
            {submitting === opt.value ? '…' : opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-donot-naranjo">{error}</p>}
    </div>
  )
}
