'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Plus } from 'lucide-react'
import type { Droop } from '@prisma/client'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  droops: Droop[]
}

interface Draft {
  id?: string
  code: string
  name: string
  tagline: string
  description: string
  coverImage: string
  startsAt: string
  endsAt: string
  isPublished: boolean
  sortOrder: number
}

const EMPTY: Draft = {
  code: '',
  name: '',
  tagline: '',
  description: '',
  coverImage: '',
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: '',
  isPublished: true,
  sortOrder: 0,
}

function toDraft(d: Droop): Draft {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    tagline: d.tagline ?? '',
    description: d.description ?? '',
    coverImage: d.coverImage ?? '',
    startsAt: d.startsAt.toISOString().slice(0, 10),
    endsAt: d.endsAt ? d.endsAt.toISOString().slice(0, 10) : '',
    isPublished: d.isPublished,
    sortOrder: d.sortOrder,
  }
}

export function DroopsManager({ droops }: Props) {
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
      tagline: draft.tagline || null,
      description: draft.description || null,
      coverImage: draft.coverImage || null,
      endsAt: draft.endsAt || null,
    }
    try {
      const res = await fetch(
        draft.id ? `/api/admin/droops/${draft.id}` : '/api/admin/droops',
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
    if (!window.confirm('¿Borrar este droop?')) return
    const res = await fetch(`/api/admin/droops/${id}`, { method: 'DELETE' })
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
            {draft.id ? 'Editar droop' : 'Nuevo droop'}
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
          <Field label="Code (slug)">
            <input
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              required
              className={inputClass}
              placeholder="droop_002"
            />
          </Field>
          <Field label="Nombre">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              className={inputClass}
              placeholder="Droop 002"
            />
          </Field>
        </div>

        <Field label="Tagline">
          <input
            value={draft.tagline}
            onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
            className={inputClass}
            placeholder="La segunda carga"
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className={cn(inputClass, 'resize-none')}
          />
        </Field>

        <ImageUploader
          label="Cover"
          value={draft.coverImage}
          onChange={(url) => setDraft({ ...draft, coverImage: url })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicia">
            <input
              type="date"
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Termina (opcional)">
            <input
              type="date"
              value={draft.endsAt}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
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
              checked={draft.isPublished}
              onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
              className="w-4 h-4 accent-donot-verde"
            />
            <span className="text-sm text-donot-verde font-semibold">Publicado</span>
          </label>
        </div>

        {error && <p className="text-sm text-donot-naranjo">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Guardando…' : draft.id ? 'Guardar cambios' : (
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Crear droop</span>
          )}
        </Button>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-donot-border">
          <h2 className="font-display text-xl text-donot-verde">
            Droops ({droops.length})
          </h2>
        </div>
        {droops.length === 0 ? (
          <p className="p-6 text-donot-muted">Aún no hay droops. Crea el primero a la izquierda.</p>
        ) : (
          <ul className="divide-y divide-donot-border">
            {droops.map((d) => (
              <li
                key={d.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-donot-rowAlt/40 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-donot-verde">{d.name}</p>
                    {!d.isPublished && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                        Borrador
                      </span>
                    )}
                  </div>
                  <p className="text-donot-muted text-sm truncate">
                    {d.code} · {d.tagline ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(toDraft(d))}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-verde hover:bg-donot-verde/10"
                    aria-label="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
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
