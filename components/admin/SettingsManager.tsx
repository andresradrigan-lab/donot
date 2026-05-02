'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GROUP_LABELS, SETTING_DEFS, type SettingDef } from '@/lib/settings-keys'
import { cn } from '@/lib/utils'

interface Props {
  initial: Record<string, string>
}

const GROUP_ORDER: SettingDef['group'][] = ['envio', 'pedidos', 'contacto', 'puntos-retiro']

export function SettingsManager({ initial }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos guardar.')
        return
      }
      setSaved(true)
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
            <h2 className="font-display text-xl text-donot-verde mb-4">
              {GROUP_LABELS[g]}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {defs.map((def) => (
                <Field key={def.key} def={def} value={values[def.key] ?? ''} onChange={update} />
              ))}
            </div>
          </section>
        )
      })}

      <section className="bg-donot-azulPastel/20 border border-donot-azulPastel/40 rounded-3xl p-6">
        <h2 className="font-display text-lg text-donot-verde mb-2">
          Claves sensibles
        </h2>
        <p className="text-donot-ink text-sm mb-2 leading-relaxed">
          Mercado Pago, Resend, GA4, Meta Pixel, Cloudinary y JWT viven en
          variables de entorno (<code className="px-1 py-0.5 rounded bg-white/60 text-xs">.env</code> en local, ENV del servidor en
          producción) — no se editan desde el admin para reducir el riesgo
          de exposición.
        </p>
        <p className="text-donot-muted text-xs">
          Si cambias alguna, reinicia el servidor para que tome el nuevo valor.
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

function Field({
  def,
  value,
  onChange,
}: {
  def: SettingDef
  value: string
  onChange: (key: string, value: string) => void
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', def.type === 'multiline' && 'md:col-span-2')}>
      <span className="text-sm font-semibold text-donot-verde">{def.label}</span>
      {def.type === 'multiline' ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          className="px-3 py-2 rounded-xl border border-donot-border bg-white text-sm resize-none focus:outline-none focus:border-donot-verde"
        />
      ) : (
        <input
          type={def.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(def.key, e.target.value)}
          className="px-3 py-2 rounded-xl border border-donot-border bg-white text-sm focus:outline-none focus:border-donot-verde"
        />
      )}
      {def.hint && <span className="text-xs text-donot-muted">{def.hint}</span>}
    </label>
  )
}
