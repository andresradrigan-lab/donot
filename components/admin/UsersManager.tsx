'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Plus, KeyRound } from 'lucide-react'
import type { AdminRole } from '@prisma/client'
import { Button } from '@/components/ui/Button'

interface UserRow {
  id: string
  email: string
  name: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

interface Props {
  users: UserRow[]
  currentUserId: string
}

interface Draft {
  id?: string
  email: string
  name: string
  role: AdminRole
  password: string
  isActive: boolean
}

const EMPTY: Draft = {
  email: '',
  name: '',
  role: 'OPERATOR',
  password: '',
  isActive: true,
}

const ROLE_LABEL: Record<AdminRole, string> = {
  OWNER: 'Owner',
  OPERATOR: 'Operador',
  VIEWER: 'Viewer',
}

const ROLE_HINT: Record<AdminRole, string> = {
  OWNER: 'Acceso total: configuración, usuarios, catálogo y pedidos.',
  OPERATOR: 'Cocina y pedidos. No edita catálogo ni configuración.',
  VIEWER: 'Solo lectura del dashboard y pedidos.',
}

export function UsersManager({ users, currentUserId }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadFor(u: UserRow) {
    setDraft({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      password: '',
      isActive: u.isActive,
    })
    setError(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      let res: Response
      if (draft.id) {
        // Update — password opcional.
        res = await fetch(`/api/admin/users/${draft.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: draft.name,
            role: draft.role,
            isActive: draft.isActive,
            password: draft.password || null,
          }),
        })
      } else {
        if (draft.password.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres.')
          setSubmitting(false)
          return
        }
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        })
      }
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

  async function deactivate(id: string) {
    if (!window.confirm('¿Desactivar este usuario?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (draft.id === id) setDraft(EMPTY)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      window.alert(data.reason ?? 'No pudimos desactivarlo.')
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
            {draft.id ? 'Editar usuario' : 'Nuevo usuario'}
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

        <Field label="Nombre">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            required
            disabled={!!draft.id}
            className={inputClass}
          />
        </Field>

        <Field label="Rol">
          <select
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value as AdminRole })}
            className={inputClass}
          >
            {(['OWNER', 'OPERATOR', 'VIEWER'] as AdminRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <span className="text-xs text-donot-muted mt-1">{ROLE_HINT[draft.role]}</span>
        </Field>

        <Field label={draft.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
          <div className="relative">
            <input
              type="password"
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              required={!draft.id}
              minLength={8}
              className={inputClass}
              placeholder={draft.id ? 'Dejar vacío para mantener' : 'Mínimo 8 caracteres'}
            />
            <KeyRound size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-donot-muted" />
          </div>
        </Field>

        {draft.id && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-donot-border bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="w-4 h-4 accent-donot-verde"
            />
            <span className="text-sm text-donot-verde font-semibold">Activo</span>
          </label>
        )}

        {error && <p className="text-sm text-donot-naranjo">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Guardando…' : draft.id ? 'Guardar cambios' : (
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Crear usuario</span>
          )}
        </Button>
        <p className="text-xs text-donot-muted">
          La contraseña se la entregas tú al usuario por canal seguro. Más adelante esto va por mail con link mágico.
        </p>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-donot-border">
          <h2 className="font-display text-xl text-donot-verde">
            Usuarios ({users.filter((u) => u.isActive).length} activos)
          </h2>
        </div>
        <ul className="divide-y divide-donot-border">
          {users.map((u) => (
            <li
              key={u.id}
              className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-donot-rowAlt/40 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-donot-verde">{u.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-donot-azulPastel/40 text-donot-verde">
                    {ROLE_LABEL[u.role]}
                  </span>
                  {u.id === currentUserId && (
                    <span className="text-xs text-donot-muted">(tú)</span>
                  )}
                  {!u.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-donot-muted/20 text-donot-muted">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-donot-muted text-sm truncate">{u.email}</p>
                <p className="text-donot-muted text-xs">
                  {u.lastLoginAt
                    ? `Último login: ${new Intl.DateTimeFormat('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(u.lastLoginAt)}`
                    : 'Sin login todavía'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => loadFor(u)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-verde hover:bg-donot-verde/10"
                  aria-label="Editar"
                >
                  <Edit3 size={16} />
                </button>
                {u.id !== currentUserId && u.isActive && (
                  <button
                    type="button"
                    onClick={() => deactivate(u.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-donot-muted hover:text-donot-naranjo hover:bg-donot-naranjo/10"
                    aria-label="Desactivar"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde disabled:bg-donot-rowAlt'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-donot-verde uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}
