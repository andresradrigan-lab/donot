'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Plus } from 'lucide-react'
import type { Box, BoxCategory } from '@prisma/client'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { WeekdayPicker } from '@/components/admin/WeekdayPicker'
import { Button } from '@/components/ui/Button'
import { formatClp } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  boxes: Box[]
}

interface Draft {
  id?: string
  slug: string
  name: string
  category: BoxCategory
  slotCount: number
  priceClp: number
  images: string[]
  isActive: boolean
  availableWeekdays: number[]
  availableFrom: string
  availableTo: string
  sortOrder: number
}

const EMPTY: Draft = {
  slug: '',
  name: '',
  category: 'PREMIUM',
  slotCount: 6,
  priceClp: 0,
  images: [],
  isActive: true,
  availableWeekdays: [0, 1, 2, 3, 4, 5, 6],
  availableFrom: '',
  availableTo: '',
  sortOrder: 0,
}

function toDraft(b: Box): Draft {
  const images = Array.isArray(b.images) ? (b.images as string[]) : []
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    category: b.category,
    slotCount: b.slotCount,
    priceClp: b.priceClp,
    images,
    isActive: b.isActive,
    availableWeekdays: b.availableWeekdays,
    availableFrom: b.availableFrom ? b.availableFrom.toISOString().slice(0, 10) : '',
    availableTo: b.availableTo ? b.availableTo.toISOString().slice(0, 10) : '',
    sortOrder: b.sortOrder,
  }
}

export function BoxesManager({ boxes }: Props) {
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
      sortOrder: Number(draft.sortOrder) || 0,
      slotCount: Number(draft.slotCount) || 1,
      priceClp: Number(draft.priceClp) || 0,
      availableFrom: draft.availableFrom || null,
      availableTo: draft.availableTo || null,
    }
    try {
      const res = await fetch(
        draft.id ? `/api/admin/boxes/${draft.id}` : '/api/admin/boxes',
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
    if (!window.confirm('¿Borrar esta caja?')) return
    const res = await fetch(`/api/admin/boxes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (draft.id === id) setDraft(EMPTY)
      router.refresh()
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <form
        onSubmit={save}
        className="bg-white border border-donot-border rounded-3xl shadow-soft p-6 flex flex-col gap-4 self-start"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-donot-verde">
            {draft.id ? 'Editar caja' : 'Nueva caja'}
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
          <Field label="Slug">
            <input
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Nombre">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Categoría">
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as BoxCategory })}
              className={inputClass}
            >
              <option value="PREMIUM">Premium</option>
              <option value="AZUCARADA">Azucarada</option>
              <option value="MIX">Mix</option>
              <option value="COLAB">Colab</option>
            </select>
          </Field>
          <Field label="Slots">
            <input
              type="number"
              min={1}
              max={24}
              value={draft.slotCount}
              onChange={(e) => setDraft({ ...draft, slotCount: Number(e.target.value) })}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Precio CLP">
            <input
              type="number"
              min={0}
              value={draft.priceClp}
              onChange={(e) => setDraft({ ...draft, priceClp: Number(e.target.value) })}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <ImageUploader
          label="Imagen principal"
          value={draft.images[0] ?? ''}
          onChange={(url) => setDraft({ ...draft, images: url ? [url] : [] })}
        />

        <WeekdayPicker
          value={draft.availableWeekdays}
          onChange={(next) => setDraft({ ...draft, availableWeekdays: next })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Disponible desde">
            <input
              type="date"
              value={draft.availableFrom}
              onChange={(e) => setDraft({ ...draft, availableFrom: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Disponible hasta">
            <input
              type="date"
              value={draft.availableTo}
              onChange={(e) => setDraft({ ...draft, availableTo: e.target.value })}
              className={inputClass}
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
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Crear caja</span>
          )}
        </Button>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-donot-border">
          <h2 className="font-display text-xl text-donot-verde">
            Cajas ({boxes.length})
          </h2>
        </div>
        {boxes.length === 0 ? (
          <p className="p-6 text-donot-muted">Aún no hay cajas.</p>
        ) : (
          <ul className="divide-y divide-donot-border">
            {boxes.map((b) => (
              <li
                key={b.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-donot-rowAlt/40 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-donot-verde">{b.name}</p>
                    {!b.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-donot-muted text-sm truncate">
                    {b.slug} · {b.slotCount} donas · {formatClp(b.priceClp)} ·{' '}
                    {b.category.toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(toDraft(b))}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-verde hover:bg-donot-verde/10"
                    aria-label="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10"
                    aria-label="Borrar"
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
      <span className="text-xs font-semibold text-donot-verde uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  )
}
