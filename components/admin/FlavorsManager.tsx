'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Plus } from 'lucide-react'
import type { Flavor, Droop, FlavorCategory } from '@prisma/client'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { WeekdayPicker } from '@/components/admin/WeekdayPicker'
import { Button } from '@/components/ui/Button'
import { weekdaysFromJson } from '@/lib/weekdays'
import { cn } from '@/lib/utils'

type FlavorWithDroop = Flavor & { droop: { code: string; name: string } | null }

interface Props {
  flavors: FlavorWithDroop[]
  droops: Pick<Droop, 'id' | 'name' | 'code'>[]
}

interface Draft {
  id?: string
  slug: string
  name: string
  category: FlavorCategory
  description: string
  imageUrl: string
  droopId: string
  stock: number
  stockResetDaily: boolean
  dailyCapacity: number | ''
  isActive: boolean
  availableWeekdays: number[]
  sortOrder: number
}

const EMPTY: Draft = {
  slug: '',
  name: '',
  category: 'PREMIUM',
  description: '',
  imageUrl: '',
  droopId: '',
  stock: 0,
  stockResetDaily: false,
  dailyCapacity: '',
  isActive: true,
  availableWeekdays: [0, 1, 2, 3, 4, 5, 6],
  sortOrder: 0,
}

function toDraft(f: FlavorWithDroop): Draft {
  return {
    id: f.id,
    slug: f.slug,
    name: f.name,
    category: f.category,
    description: f.description,
    imageUrl: f.imageUrl,
    droopId: f.droopId ?? '',
    stock: f.stock,
    stockResetDaily: f.stockResetDaily,
    dailyCapacity: f.dailyCapacity ?? '',
    isActive: f.isActive,
    availableWeekdays: weekdaysFromJson(f.availableWeekdays),
    sortOrder: f.sortOrder,
  }
}

export function FlavorsManager({ flavors, droops }: Props) {
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
      stock: Number(draft.stock) || 0,
      dailyCapacity: draft.dailyCapacity === '' ? null : Number(draft.dailyCapacity),
      droopId: draft.droopId || null,
    }
    try {
      const res = await fetch(
        draft.id ? `/api/admin/flavors/${draft.id}` : '/api/admin/flavors',
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
    if (!window.confirm('¿Borrar este sabor?')) return
    const res = await fetch(`/api/admin/flavors/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (draft.id === id) setDraft(EMPTY)
      router.refresh()
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <form
        onSubmit={save}
        className="bg-white border border-donot-border rounded-3xl shadow-soft p-6 flex flex-col gap-4 self-start"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-donot-verde">
            {draft.id ? 'Editar sabor' : 'Nuevo sabor'}
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
              placeholder="cookies-and-cream"
            />
          </Field>
          <Field label="Nombre">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              className={inputClass}
              placeholder="Cookies & Cream"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as FlavorCategory })}
              className={inputClass}
            >
              <option value="PREMIUM">Premium</option>
              <option value="AZUCARADA">Azucarada</option>
            </select>
          </Field>
          <Field label="Droop">
            <select
              value={draft.droopId}
              onChange={(e) => setDraft({ ...draft, droopId: e.target.value })}
              className={inputClass}
            >
              <option value="">— sin droop —</option>
              {droops.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Descripción">
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            required
            rows={3}
            className={cn(inputClass, 'resize-none')}
            placeholder="Texto del cliente, palabra por palabra"
          />
        </Field>

        <ImageUploader
          label="Foto del sabor"
          value={draft.imageUrl}
          onChange={(url) => setDraft({ ...draft, imageUrl: url })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock">
            <input
              type="number"
              min={0}
              value={draft.stock}
              onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Capacidad diaria">
            <input
              type="number"
              min={0}
              value={draft.dailyCapacity}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  dailyCapacity: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-donot-border bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={draft.stockResetDaily}
            onChange={(e) => setDraft({ ...draft, stockResetDaily: e.target.checked })}
            className="w-4 h-4 accent-donot-verde"
          />
          <span className="text-sm text-donot-verde font-semibold">
            Reponer stock cada día
          </span>
        </label>

        <WeekdayPicker
          value={draft.availableWeekdays}
          onChange={(next) => setDraft({ ...draft, availableWeekdays: next })}
        />

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
            <span className="text-sm text-donot-verde font-semibold">Activo</span>
          </label>
        </div>

        {error && <p className="text-sm text-donot-naranjo">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Guardando…' : draft.id ? 'Guardar cambios' : (
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Crear sabor</span>
          )}
        </Button>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-donot-border">
          <h2 className="font-display text-xl text-donot-verde">
            Sabores ({flavors.length})
          </h2>
        </div>
        {flavors.length === 0 ? (
          <p className="p-6 text-donot-muted">Aún no hay sabores.</p>
        ) : (
          <ul className="divide-y divide-donot-border">
            {flavors.map((f) => (
              <li
                key={f.id}
                className="px-4 py-3 flex items-center gap-4 hover:bg-donot-rowAlt/40 transition"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-donot-rowAlt shrink-0">
                  {f.imageUrl && (
                    <Image src={f.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-donot-verde">{f.name}</p>
                    {!f.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-donot-muted text-xs truncate">
                    {f.category.toLowerCase()} ·{' '}
                    {f.droop?.name ?? 'sin droop'} · stock {f.stock}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDraft(toDraft(f))}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-verde hover:bg-donot-verde/10"
                    aria-label="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
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
