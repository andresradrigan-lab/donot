'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Plus } from 'lucide-react'
import type { Coupon, CouponType } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { formatClp } from '@/lib/format'
import { cn } from '@/lib/utils'

export type CouponWithMetrics = Coupon & {
  metrics: { revenueClp: number; discountTotalClp: number; ordersCount: number }
}

interface Props {
  coupons: CouponWithMetrics[]
}

interface Draft {
  id?: string
  code: string
  type: CouponType
  value: number
  minOrderClp: number | ''
  maxUses: number | ''
  validFrom: string
  validTo: string
  isActive: boolean
}

const EMPTY: Draft = {
  code: '',
  type: 'PERCENTAGE',
  value: 10,
  minOrderClp: '',
  maxUses: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: '',
  isActive: true,
}

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENTAGE: 'Porcentaje (%)',
  FIXED_AMOUNT: 'Monto fijo (CLP)',
  FREE_SHIPPING: 'Envío gratis',
}

function toDraft(c: Coupon): Draft {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrderClp: c.minOrderClp ?? '',
    maxUses: c.maxUses ?? '',
    validFrom: c.validFrom.toISOString().slice(0, 10),
    validTo: c.validTo ? c.validTo.toISOString().slice(0, 10) : '',
    isActive: c.isActive,
  }
}

export function CouponsManager({ coupons }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const body = {
      ...draft,
      value: Number(draft.value) || 0,
      minOrderClp: draft.minOrderClp === '' ? null : Number(draft.minOrderClp),
      maxUses: draft.maxUses === '' ? null : Number(draft.maxUses),
      validTo: draft.validTo || null,
    }
    try {
      const res = await fetch(
        draft.id ? `/api/admin/coupons/${draft.id}` : '/api/admin/coupons',
        {
          method: draft.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos guardar.')
        return
      }
      setDraft(EMPTY)
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Desactivar este cupón?')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (draft.id === id) setDraft(EMPTY)
      router.refresh()
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form
        onSubmit={save}
        className="bg-white border border-donot-border rounded-3xl shadow-soft p-6 flex flex-col gap-4 self-start"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-donot-verde">
            {draft.id ? 'Editar cupón' : 'Nuevo cupón'}
          </h2>
          {draft.id && (
            <button
              type="button"
              onClick={() => setDraft(EMPTY)}
              className="text-sm text-donot-muted hover:text-donot-naranjo"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <Field label="Código">
          <input
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            required
            className={inputClass}
            placeholder="MAYO25"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as CouponType })}
              className={inputClass}
            >
              {Object.entries(TYPE_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </Field>
          <Field
            label={
              draft.type === 'PERCENTAGE'
                ? 'Valor (%)'
                : draft.type === 'FIXED_AMOUNT'
                  ? 'Valor (CLP)'
                  : 'Valor (no aplica)'
            }
          >
            <input
              type="number"
              min={0}
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
              required
              disabled={draft.type === 'FREE_SHIPPING'}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mínimo de pedido (CLP)">
            <input
              type="number"
              min={0}
              value={draft.minOrderClp}
              onChange={(e) =>
                setDraft({ ...draft, minOrderClp: e.target.value === '' ? '' : Number(e.target.value) })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Usos máximos">
            <input
              type="number"
              min={0}
              value={draft.maxUses}
              onChange={(e) =>
                setDraft({ ...draft, maxUses: e.target.value === '' ? '' : Number(e.target.value) })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Vigente desde">
            <input
              type="date"
              value={draft.validFrom}
              onChange={(e) => setDraft({ ...draft, validFrom: e.target.value })}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Vigente hasta">
            <input
              type="date"
              value={draft.validTo}
              onChange={(e) => setDraft({ ...draft, validTo: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-donot-border bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            className="w-4 h-4 accent-donot-verde"
          />
          <span className="text-sm text-donot-verde font-semibold">Activo</span>
        </label>

        {error && <p className="text-sm text-donot-naranjo">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Guardando…' : draft.id ? 'Guardar cambios' : (
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Crear cupón</span>
          )}
        </Button>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-donot-border">
          <h2 className="font-display text-xl text-donot-verde">
            Cupones ({coupons.length})
          </h2>
        </div>
        {coupons.length === 0 ? (
          <p className="p-6 text-donot-muted">Aún no hay cupones.</p>
        ) : (
          <ul className="divide-y divide-donot-border">
            {coupons.map((c) => (
              <li
                key={c.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-donot-rowAlt/40 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-donot-verde">{c.code}</p>
                    {!c.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-donot-muted text-sm">
                    {TYPE_LABEL[c.type]}
                    {c.type === 'PERCENTAGE' && ` ${c.value}%`}
                    {c.type === 'FIXED_AMOUNT' && ` ${formatClp(c.value)}`}
                    {' · usos: '}
                    {c.usesCount}
                    {c.maxUses != null && ` / ${c.maxUses}`}
                  </p>
                  <p className="text-donot-muted text-xs">
                    {c.metrics.ordersCount} pedidos · {formatClp(c.metrics.revenueClp)} en ventas · {formatClp(c.metrics.discountTotalClp)} descontados
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDraft(toDraft(c))}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-verde hover:bg-donot-verde/10"
                    aria-label="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10"
                    aria-label="Desactivar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde disabled:bg-donot-rowAlt'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1.5')}>
      <span className="text-xs font-semibold text-donot-verde uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  )
}
