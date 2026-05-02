'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, KeyRound, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GROUP_LABELS, SETTING_DEFS, type SettingDef, type SettingGroup } from '@/lib/settings-keys'
import { cn } from '@/lib/utils'

interface Props {
  initial: Record<string, string>
  secretsHasValue: Record<string, boolean>
  secretsMasked: Record<string, string>
}

const GROUP_ORDER: SettingGroup[] = [
  'seo',
  'analitica',
  'negocio',
  'envio',
  'pedidos',
  'puntos-retiro',
]

const GROUP_INTRO: Partial<Record<SettingGroup, string>> = {
  seo: 'Cómo te ven Google, Instagram y WhatsApp cuando comparten tu link.',
  analitica:
    'Conecta GTM, GA4 y Meta sin tocar código. Los IDs públicos se inyectan en cada página; el token del CAPI viaja solo por servidor.',
  negocio: 'Datos del local que ven los buscadores y el footer del sitio.',
  envio: 'Reglas globales de envío gratis. Cada comuna puede sobreescribir.',
  pedidos: 'Configuración del flujo de pedidos.',
  'puntos-retiro': 'Direcciones que mostramos para retiros.',
}

export function SettingsManager({ initial, secretsHasValue, secretsMasked }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(initial)
  // Para secrets: mantenemos un input separado que solo viaja al servidor si tiene valor.
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSaved(false)
    setError(null)
    try {
      const body: Record<string, string> = { ...values }
      // Sumar secrets que el admin haya escrito en este turno (no vacíos).
      for (const [k, v] of Object.entries(secretInputs)) {
        if (v) body[k] = v
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos guardar.')
        return
      }
      setSaved(true)
      setSecretInputs({})
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setSubmitting(false)
    }
  }

  function update(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }

  function updateSecret(key: string, value: string) {
    setSecretInputs((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  async function clearSecret(key: string) {
    if (!window.confirm('¿Borrar este token? Tendrás que pegarlo de nuevo.')) return
    setSubmitting(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: '__clear__' }),
      })
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      {GROUP_ORDER.map((g) => {
        const defs = SETTING_DEFS.filter((d) => d.group === g)
        if (defs.length === 0) return null
        return (
          <section
            key={g}
            className="bg-white border border-donot-border rounded-3xl shadow-soft p-6"
          >
            <h2 className="font-display text-xl text-donot-verde">
              {GROUP_LABELS[g]}
            </h2>
            {GROUP_INTRO[g] && (
              <p className="text-donot-muted text-sm mb-4">{GROUP_INTRO[g]}</p>
            )}
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              {defs.map((def) => (
                <Field
                  key={def.key}
                  def={def}
                  value={values[def.key] ?? ''}
                  onChange={update}
                  secretValue={secretInputs[def.key] ?? ''}
                  secretHasValue={secretsHasValue[def.key] ?? false}
                  secretMasked={secretsMasked[def.key] ?? ''}
                  onSecretChange={updateSecret}
                  onSecretClear={clearSecret}
                />
              ))}
            </div>
          </section>
        )
      })}

      <section className="bg-donot-azulPastel/20 border border-donot-azulPastel/40 rounded-3xl p-6">
        <h2 className="font-display text-lg text-donot-verde mb-2">
          Claves de infraestructura
        </h2>
        <p className="text-donot-ink text-sm leading-relaxed mb-2">
          Las credenciales que ejecutan la operación interna del sistema —
          Mercado Pago, Resend, JWT, Cloudinary y la conexión a la base de
          datos — viven en variables de entorno (<code className="px-1 py-0.5 rounded bg-white/60 text-xs">.env</code> en local, ENV
          del servidor en producción). Cambiarlas mal corta el flujo de
          pedidos, así que no se editan desde el admin.
        </p>
        <p className="text-donot-muted text-xs">
          Si quieres rotar alguna, edita el .env y reinicia el servidor.
        </p>
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-donot-crema/95 backdrop-blur py-3 -mx-6 px-6">
        <Button type="submit" size="lg" disabled={submitting}>
          <span className="inline-flex items-center gap-2">
            <Save size={16} />
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </span>
        </Button>
        {saved && (
          <span className="text-sm text-donot-verde">¡Listo! Cambios guardados.</span>
        )}
        {error && <span className="text-sm text-donot-naranjo">{error}</span>}
      </div>
    </form>
  )
}

interface FieldProps {
  def: SettingDef
  value: string
  onChange: (key: string, value: string) => void
  secretValue: string
  secretHasValue: boolean
  secretMasked: string
  onSecretChange: (key: string, value: string) => void
  onSecretClear: (key: string) => void
}

function Field({
  def,
  value,
  onChange,
  secretValue,
  secretHasValue,
  secretMasked,
  onSecretChange,
  onSecretClear,
}: FieldProps) {
  const wide = def.type === 'multiline'
  const baseInput =
    'w-full px-3 py-2 rounded-xl border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde'

  return (
    <label className={cn('flex flex-col gap-1.5', wide && 'md:col-span-2')}>
      <span className="text-sm font-semibold text-donot-verde">{def.label}</span>

      {def.type === 'multiline' && (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          className={cn(baseInput, 'resize-none')}
        />
      )}
      {def.type === 'number' && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          className={baseInput}
        />
      )}
      {def.type === 'string' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          className={baseInput}
        />
      )}
      {def.type === 'url' && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          placeholder="https://… o /uploads/…"
          className={baseInput}
        />
      )}
      {def.type === 'secret' && (
        <div className="flex flex-col gap-1.5">
          {secretHasValue && !secretValue && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-donot-rowAlt border border-donot-border">
              <span className="text-sm text-donot-muted font-mono">
                {secretMasked}
              </span>
              <button
                type="button"
                onClick={() => onSecretClear(def.key)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-donot-muted hover:text-donot-naranjo"
                aria-label="Borrar token"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="relative">
            <input
              type="password"
              value={secretValue}
              onChange={(e) => onSecretChange(def.key, e.target.value)}
              autoComplete="off"
              placeholder={
                secretHasValue ? 'Pega un nuevo valor para reemplazar' : 'Pega el token'
              }
              className={cn(baseInput, 'pr-9')}
            />
            <KeyRound
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-donot-muted"
            />
          </div>
        </div>
      )}

      {def.hint && <span className="text-xs text-donot-muted">{def.hint}</span>}
    </label>
  )
}
