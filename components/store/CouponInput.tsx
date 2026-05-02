'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Cart } from '@/lib/cart'
import { cn } from '@/lib/utils'

export interface AppliedCoupon {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  discountClp: number
  freeShipping: boolean
}

interface Props {
  cart: Cart
  applied: AppliedCoupon | null
  onChange: (coupon: AppliedCoupon | null) => void
}

export function CouponInput({ cart, applied, onChange }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), cart }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.reason ?? 'Ese código no anda.')
        onChange(null)
      } else {
        onChange({
          code: data.code,
          type: data.type,
          discountClp: data.discountClp,
          freeShipping: data.freeShipping,
        })
        setCode('')
      }
    } catch {
      setError('No pudimos validar el cupón. Reintenta.')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    onChange(null)
    setError(null)
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-donot-verde/10 border border-donot-verde/20">
        <div className="flex items-center gap-2 text-donot-verde">
          <Check size={18} />
          <span className="font-display">{applied.code}</span>
          <span className="text-donot-muted text-sm">aplicado</span>
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label="Quitar cupón"
          className="text-donot-muted hover:text-donot-naranjo transition"
        >
          <X size={18} />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="¿Tienes un código?"
          className="flex-1 px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde uppercase"
          maxLength={40}
        />
        <button
          type="submit"
          disabled={loading || code.trim().length === 0}
          className={cn(
            'inline-flex items-center justify-center px-5 py-3 rounded-xl font-display transition',
            loading || code.trim().length === 0
              ? 'bg-donot-border/60 text-donot-muted cursor-not-allowed'
              : 'bg-donot-verde text-donot-crema hover:bg-donot-verde/90',
          )}
        >
          {loading ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && <p className="text-sm text-donot-naranjo">{error}</p>}
    </form>
  )
}
