'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Plus } from 'lucide-react'
import type { CoverageZone } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { formatClp } from '@/lib/format'

interface Props {
  zones: CoverageZone[]
}

interface Draft {
  id?: string
  commune: string
  region: string
  shippingClp: number
  freeShippingThresholdClp: number | ''
  freeShippingMinBoxes: number | ''
  isActive: boolean
  sortOrder: number
}

const EMPTY: Draft = {
  commune: '',
  region: 'Valparaíso',
  shippingClp: 0,
  freeShippingThresholdClp: '',
  freeShippingMinBoxes: '',
  isActive: true,
  sortOrder: 0,
}

function toDraft(z: CoverageZone): Draft {
  return {
    id: z.id,
    commune: z.commune,
    region: z.region,
    shippingClp: z.shippingClp,
    freeShippingThresholdClp: z.freeShippingThresholdClp ?? '',
    freeShippingMinBoxes: z.freeShippingMinBoxes ?? '',
    isActive: z.isActive,
    sortOrder: z.sortOrder,
  }
}

export function CoverageManager({ zones }: Props) {
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
      shippingClp: Number(draft.shippingClp) || 0,
      sortOrder: Number(draft.sortOrder) || 0,
      freeShippingThresholdClp:
        draft.freeShippingThresholdClp === '' ? null : Number(draft.freeShippingThresholdClp),
      freeShippingMinBoxes:
        draft.freeShippingMinBoxes === '' ? null : Number(draft.freeShippingMinBoxes),
    }
    try {
      const res = await fetch(
        draft.id ? `/api/admin/coverage/${draft.id}` : '/api/admin/coverage',
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
    if (!window.confirm('¿Desactivar esta zona?')) return
    const res = await fetch(`/api/admin/coverage/${id}`, { method: 'DELETE' })
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
            {draft.id ? 'Editar zona' : 'Nueva zona'}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Comuna">
            <input
              value={draft.commune}
              onChange={(e) => setDraft({ ...draft, commune: e.target.value })}
              required
              className={inputClass}
              placeholder="Concón"
            />
          </Field>
          <Field label="Región">
            <input
              value={draft.region}
              onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Tarifa de envío (CLP)">
          <input
            type="number"
            min={0}
            value={draft.shippingClp}
            onChange={(e) => setDraft({ ...draft, shippingClp: Number(e.target.value) })}
            required
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Envío gratis sobre (CLP)">
            <input
              type="number"
              min={0}
              value={draft.freeShippingThresholdClp}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  freeShippingThresholdClp:
                    e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className={inputClass}
              placeholder="opcional"
            />
          </Field>
          <Field label="Envío gratis con N cajas">
            <input
              type="number"
              min={0}
              value={draft.freeShippingMinBoxes}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  freeShippingMinBoxes: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className={inputClass}
              placeholder="opcional"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <Field label="Orden">
            <input
              type="number"
              value={draft.sortOrder}
              onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-donot-border bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="w-4 h-4 accent-donot-verde"
            />
            <span className="text-sm text-donot-verde font-semibold">Activa</span>
          </label>
        </div>

        {error && <p className="text-sm text-donot-naranjo">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Guardando…' : draft.id ? 'Guardar cambios' : (
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Agregar zona</span>
          )}
        </Button>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-donot-border">
          <h2 className="font-display text-xl text-donot-verde">
            Zonas ({zones.filter((z) => z.isActive).length} activas / {zones.length} totales)
          </h2>
        </div>
        {zones.length === 0 ? (
          <p className="p-6 text-donot-muted">Sin zonas todavía.</p>
        ) : (
          <ul className="divide-y divide-donot-border">
            {zones.map((z) => (
              <li
                key={z.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-donot-rowAlt/40 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-donot-verde">{z.commune}</p>
                    {!z.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-donot-muted text-sm">
                    {z.region} · {formatClp(z.shippingClp)}
                    {z.freeShippingThresholdClp != null &&
                      ` · gratis sobre ${formatClp(z.freeShippingThresholdClp)}`}
                    {z.freeShippingMinBoxes != null &&
                      ` · gratis con ${z.freeShippingMinBoxes} cajas`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDraft(toDraft(z))}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-verde hover:bg-donot-verde/10"
                    aria-label="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(z.id)}
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
  'w-full px-3 py-2 rounded-xl border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-donot-verde uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}
