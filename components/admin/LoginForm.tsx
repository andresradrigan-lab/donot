'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason ?? 'No pudimos entrar.')
        setSubmitting(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Algo se nos quemó en el horno. Reintenta.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-donot-verde">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className="px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde"
          placeholder="tu@correo.cl"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-donot-verde">Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde"
        />
      </label>
      {error && <p className="text-sm text-donot-naranjo">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
