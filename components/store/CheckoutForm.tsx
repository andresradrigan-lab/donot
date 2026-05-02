'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Banknote, Wallet, MapPin, Calendar, User, Tag, Receipt } from 'lucide-react'
import { readCart, type Cart } from '@/lib/cart'
import { formatClp } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { CouponInput, type AppliedCoupon } from '@/components/store/CouponInput'
import { cn } from '@/lib/utils'

interface Zone {
  id: string
  commune: string
  region: string
  shippingClp: number
}

type DeliveryMethod = 'PICKUP_CONCON' | 'PICKUP_RENACA' | 'DELIVERY'
type PaymentProvider = 'MERCADO_PAGO' | 'TRANSBANK' | 'KHIPU'

interface Totals {
  subtotalClp: number
  discountClp: number
  shippingClp: number | null
  totalClp: number | null
  boxCount: number
}

interface ValidateResponse {
  ok: boolean
  issues: { lineId: string; message: string }[]
  totals: Totals
  zone: Zone | null
}

const TIME_SLOTS = ['10-13', '13-17', '17-20'] as const

const PAYMENT_OPTIONS: { id: PaymentProvider; label: string; icon: typeof CreditCard }[] = [
  { id: 'MERCADO_PAGO', label: 'Mercado Pago', icon: Wallet },
  { id: 'TRANSBANK', label: 'Webpay (tarjeta)', icon: CreditCard },
  { id: 'KHIPU', label: 'Khipu (transferencia)', icon: Banknote },
]

interface Props {
  initialCouponCode?: string
}

export function CheckoutForm({ initialCouponCode }: Props) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [zones, setZones] = useState<Zone[]>([])

  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [delivery, setDelivery] = useState<DeliveryMethod>('PICKUP_CONCON')
  const [address, setAddress] = useState('')
  const [commune, setCommune] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState<string>('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [payment, setPayment] = useState<PaymentProvider>('MERCADO_PAGO')

  const [totals, setTotals] = useState<Totals | null>(null)
  const [issues, setIssues] = useState<ValidateResponse['issues']>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Cargar carrito y cobertura.
  useEffect(() => {
    setCart(readCart())
    fetch('/api/coverage')
      .then((r) => r.json())
      .then((d) => setZones(d.zones ?? []))
      .catch(() => null)
  }, [])

  // Pre-aplicar el cupón pasado por query string.
  useEffect(() => {
    if (!initialCouponCode || !cart || cart.items.length === 0) return
    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: initialCouponCode, cart }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok)
          setCoupon({
            code: d.code,
            type: d.type,
            discountClp: d.discountClp,
            freeShipping: d.freeShipping,
          })
      })
      .catch(() => null)
  }, [initialCouponCode, cart])

  // Re-validar el carrito completo cuando cambian inputs relevantes.
  useEffect(() => {
    if (!cart || cart.items.length === 0) return
    if (delivery === 'DELIVERY' && !commune) {
      // Sin comuna no podemos cotizar envío — limpio totales.
      setTotals(null)
      return
    }

    const ctrl = new AbortController()
    fetch('/api/cart/validate', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart,
        couponCode: coupon?.code,
        deliveryMethod: delivery,
        deliveryCommune: delivery === 'DELIVERY' ? commune : undefined,
      }),
    })
      .then((r) => r.json())
      .then((d: ValidateResponse) => {
        setTotals(d.totals)
        setIssues(d.issues ?? [])
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setIssues([{ lineId: '__net__', message: 'No pudimos calcular tu pedido. Reintenta.' }])
        }
      })
    return () => ctrl.abort()
  }, [cart, coupon, delivery, commune])

  const canSubmit = useMemo(() => {
    if (!cart || cart.items.length === 0) return false
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) return false
    if (delivery === 'DELIVERY' && (!commune || !address.trim())) return false
    if (!date || !timeSlot) return false
    if (totals?.totalClp == null) return false
    if (issues.length > 0) return false
    return true
  }, [cart, contact, delivery, commune, address, date, timeSlot, totals, issues])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !cart) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          customer: contact,
          delivery: {
            method: delivery,
            address: delivery === 'DELIVERY' ? address : undefined,
            commune: delivery === 'DELIVERY' ? commune : undefined,
            notes: notes || undefined,
            date,
            timeSlot,
          },
          couponCode: coupon?.code,
          paymentProvider: payment,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setSubmitError(data.reason ?? 'No pudimos iniciar el pago.')
        setSubmitting(false)
        return
      }
      window.location.href = data.redirectUrl
    } catch {
      setSubmitError('No pudimos conectar con la pasarela. Reintenta en un toque.')
      setSubmitting(false)
    }
  }

  if (!cart) {
    return <p className="text-donot-muted">Cargando…</p>
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-4 text-center">
        <p className="text-donot-muted">Tu cajita está vacía.</p>
        <Link
          href="/droop/droop_001"
          className="text-donot-naranjo font-semibold hover:underline"
        >
          Ver el drop
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-start">
      <div className="flex flex-col gap-5">
        {/* CONTACTO */}
        <details open className="bg-white border border-donot-border rounded-2xl">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 font-display text-donot-verde text-lg">
            <User size={20} /> Contacto
          </summary>
          <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                required
                className={inputClass}
                placeholder="Cómo te llamas"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                required
                className={inputClass}
                placeholder="tu@correo.cl"
              />
            </Field>
            <Field label="Teléfono" className="sm:col-span-2">
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                required
                className={inputClass}
                placeholder="+56 9 ..."
              />
            </Field>
          </div>
        </details>

        {/* DESPACHO */}
        <details open className="bg-white border border-donot-border rounded-2xl">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 font-display text-donot-verde text-lg">
            <MapPin size={20} /> Despacho
          </summary>
          <div className="px-5 pb-5 flex flex-col gap-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <DeliveryRadio
                checked={delivery === 'PICKUP_CONCON'}
                onChange={() => setDelivery('PICKUP_CONCON')}
                title="Retiro Concón"
                hint="Sin costo"
              />
              <DeliveryRadio
                checked={delivery === 'PICKUP_RENACA'}
                onChange={() => setDelivery('PICKUP_RENACA')}
                title="Retiro Reñaca"
                hint="Sin costo"
              />
              <DeliveryRadio
                checked={delivery === 'DELIVERY'}
                onChange={() => setDelivery('DELIVERY')}
                title="Despacho"
                hint="Tarifa por comuna"
              />
            </div>

            {delivery === 'DELIVERY' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Comuna">
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Elige tu comuna
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.commune}>
                        {z.commune} · {formatClp(z.shippingClp)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Dirección">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Calle, número, depto"
                  />
                </Field>
                <Field label="Indicaciones (opcional)" className="sm:col-span-2">
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputClass}
                    placeholder="Referencias, horario, etc."
                  />
                </Field>
              </div>
            )}
          </div>
        </details>

        {/* FECHA Y FRANJA */}
        <details open className="bg-white border border-donot-border rounded-2xl">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 font-display text-donot-verde text-lg">
            <Calendar size={20} /> Cuándo
          </summary>
          <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2">
            <Field label="Fecha">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
            </Field>
            <Field label="Franja">
              <div className="flex gap-2">
                {TIME_SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTimeSlot(s)}
                    className={cn(
                      'px-3 py-2 rounded-full border text-sm font-semibold transition',
                      timeSlot === s
                        ? 'border-donot-verde bg-donot-verde text-donot-crema'
                        : 'border-donot-border text-donot-verde hover:border-donot-verde',
                    )}
                  >
                    {s}h
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </details>

        {/* CUPÓN */}
        <details className="bg-white border border-donot-border rounded-2xl">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 font-display text-donot-verde text-lg">
            <Tag size={20} /> Cupón
            {coupon && (
              <span className="ml-auto text-sm font-sans text-donot-naranjo">
                {coupon.code}
              </span>
            )}
          </summary>
          <div className="px-5 pb-5">
            <CouponInput cart={cart} applied={coupon} onChange={setCoupon} />
          </div>
        </details>

        {/* PAGO */}
        <details open className="bg-white border border-donot-border rounded-2xl">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 font-display text-donot-verde text-lg">
            <Receipt size={20} /> Cómo pagas
          </summary>
          <div className="px-5 pb-5 grid gap-2 sm:grid-cols-3">
            {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPayment(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition text-left',
                  payment === id
                    ? 'border-donot-verde bg-donot-verde/5'
                    : 'border-donot-border hover:border-donot-verde/50',
                )}
              >
                <Icon size={18} className="text-donot-verde" />
                <span className="font-semibold text-donot-verde">{label}</span>
              </button>
            ))}
          </div>
        </details>
      </div>

      {/* RESUMEN */}
      <aside className="bg-donot-rowAlt border border-donot-border rounded-3xl p-6 lg:sticky lg:top-24 flex flex-col gap-5">
        <h2 className="font-display text-2xl text-donot-verde">Resumen</h2>

        <ul className="text-sm text-donot-ink/85 space-y-1">
          {cart.items.map((it) => (
            <li key={it.lineId} className="flex justify-between gap-3">
              <span>
                {it.boxName}
                {it.quantity > 1 && ` × ${it.quantity}`}
              </span>
              <span className="font-semibold whitespace-nowrap">
                {formatClp(it.boxPriceClp * it.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="text-donot-ink space-y-2 border-t border-donot-border pt-4">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold">
              {totals ? formatClp(totals.subtotalClp) : '—'}
            </dd>
          </div>
          {totals && totals.discountClp > 0 && (
            <div className="flex justify-between text-donot-naranjo">
              <dt>Descuento</dt>
              <dd className="font-semibold">−{formatClp(totals.discountClp)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="font-semibold">
              {totals?.shippingClp == null
                ? delivery === 'DELIVERY' && !commune
                  ? 'Indica tu comuna'
                  : '—'
                : totals.shippingClp === 0
                  ? 'Por la casa'
                  : formatClp(totals.shippingClp)}
            </dd>
          </div>
          <div className="flex justify-between text-lg pt-2 border-t border-donot-border">
            <dt className="font-display text-donot-verde">Total</dt>
            <dd className="font-display text-donot-verde">
              {totals?.totalClp != null ? formatClp(totals.totalClp) : '—'}
            </dd>
          </div>
        </dl>

        {issues.length > 0 && (
          <ul className="text-sm text-donot-naranjo space-y-1">
            {issues.map((i, idx) => (
              <li key={`${i.lineId}-${idx}`}>· {i.message}</li>
            ))}
          </ul>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Estamos preparando tu pago…' : `Pagar con ${PAYMENT_OPTIONS.find((p) => p.id === payment)?.label}`}
        </Button>

        {submitError && (
          <p className="text-sm text-donot-naranjo">{submitError}</p>
        )}

        <p className="text-xs text-donot-muted">
          Te redirigimos a la pasarela elegida. No guardamos datos de tu
          tarjeta.
        </p>
      </aside>
    </form>
  )
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde'

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-semibold text-donot-verde">{label}</span>
      {children}
    </label>
  )
}

function DeliveryRadio({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean
  onChange: () => void
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border-2 transition text-left',
        checked
          ? 'border-donot-verde bg-donot-verde/5'
          : 'border-donot-border hover:border-donot-verde/50',
      )}
    >
      <span className="font-semibold text-donot-verde">{title}</span>
      <span className="text-xs text-donot-muted">{hint}</span>
    </button>
  )
}
