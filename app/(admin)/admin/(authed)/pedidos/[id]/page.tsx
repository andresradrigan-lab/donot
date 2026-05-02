import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react'
import type { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { formatClp } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StatusActions } from '@/components/admin/StatusActions'

export const dynamic = 'force-dynamic'

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Esperando pago',
  PAID: 'Pagado',
  PREPARING: 'Preparando',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'bg-donot-azulPastel/40 text-donot-verde',
  PAID: 'bg-donot-verde/10 text-donot-verde',
  PREPARING: 'bg-donot-rosado/20 text-donot-verde',
  IN_TRANSIT: 'bg-donot-naranjo/20 text-donot-naranjo',
  DELIVERED: 'bg-donot-verde text-donot-crema',
  CANCELLED: 'bg-donot-naranjo/10 text-donot-naranjo',
  REFUNDED: 'bg-donot-muted/20 text-donot-muted',
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  })

  if (!order) notFound()

  const fmtDate = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d)
      : '—'

  return (
    <section className="px-6 md:px-10 py-10 max-w-5xl mx-auto">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-donot-muted hover:text-donot-verde mb-4 text-sm"
      >
        <ArrowLeft size={16} /> Pedidos
      </Link>

      <header className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-donot-muted text-sm uppercase tracking-wide">Pedido</p>
          <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
            {order.orderNumber}
          </h1>
          <p className="text-donot-muted text-sm mt-1">
            Creado el {fmtDate(order.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-semibold',
            STATUS_COLOR[order.status],
          )}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6 mb-6">
        <h2 className="font-display text-xl text-donot-verde mb-3">Acciones</h2>
        <StatusActions orderId={order.id} currentStatus={order.status} />
        <p className="text-xs text-donot-muted mt-3">
          Cada cambio de estado dispara automáticamente el correo correspondiente al cliente.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6">
          <h2 className="font-display text-xl text-donot-verde mb-4">
            Cajitas
          </h2>
          <ul className="space-y-3">
            {order.items.map((it) => {
              const flavors = (it.flavors as FlavorLine[] | null) ?? []
              return (
                <li key={it.id} className="bg-donot-rowAlt rounded-xl p-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-display text-donot-verde">
                      {it.boxNameSnapshot}
                      {it.quantity > 1 && ` × ${it.quantity}`}
                    </span>
                    <span className="text-donot-naranjo font-display whitespace-nowrap">
                      {formatClp(it.lineTotalClp)}
                    </span>
                  </div>
                  {flavors.length > 0 && (
                    <p className="text-donot-muted text-sm">
                      {flavors.map((f) => `${f.qty} × ${f.flavorName}`).join(' · ')}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          <dl className="border-t border-donot-border mt-4 pt-4 space-y-2 text-donot-ink">
            <Row label="Subtotal" value={formatClp(order.subtotalClp)} />
            {order.discountClp > 0 && (
              <Row
                label={`Descuento${order.couponCode ? ` (${order.couponCode})` : ''}`}
                value={`−${formatClp(order.discountClp)}`}
                tone="discount"
              />
            )}
            <Row
              label="Envío"
              value={order.shippingClp === 0 ? 'Por la casa' : formatClp(order.shippingClp)}
            />
            <Row
              label="Total"
              value={formatClp(order.totalClp)}
              tone="total"
            />
          </dl>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6">
            <h2 className="font-display text-xl text-donot-verde mb-4">
              Cliente
            </h2>
            <p className="font-semibold text-donot-ink">{order.customerName}</p>
            <a
              href={`mailto:${order.customerEmail}`}
              className="inline-flex items-center gap-2 text-donot-muted hover:text-donot-verde mt-2"
            >
              <Mail size={16} /> {order.customerEmail}
            </a>
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-2 text-donot-muted hover:text-donot-verde mt-1"
            >
              <Phone size={16} /> {order.customerPhone}
            </a>
          </div>

          <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6">
            <h2 className="font-display text-xl text-donot-verde mb-4">
              Despacho
            </h2>
            <div className="flex items-start gap-2 text-donot-ink mb-2">
              <MapPin size={16} className="text-donot-verde mt-0.5" />
              <div>
                {order.deliveryMethod === 'DELIVERY' ? (
                  <>
                    <p>Despacho a {order.deliveryCommune}</p>
                    {order.deliveryAddress && (
                      <p className="text-donot-muted text-sm">
                        {order.deliveryAddress}
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    Retiro {order.deliveryMethod === 'PICKUP_CONCON' ? 'Concón' : 'Reñaca'}
                  </p>
                )}
              </div>
            </div>
            {order.deliveryDate && (
              <div className="flex items-center gap-2 text-donot-ink">
                <Calendar size={16} className="text-donot-verde" />
                <span>
                  {new Intl.DateTimeFormat('es-CL', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  }).format(order.deliveryDate)}
                  {order.deliveryTimeSlot && ` · ${order.deliveryTimeSlot}h`}
                </span>
              </div>
            )}
            {order.deliveryNotes && (
              <p className="text-donot-muted text-sm mt-3 italic">
                "{order.deliveryNotes}"
              </p>
            )}
          </div>

          <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6">
            <h2 className="font-display text-xl text-donot-verde mb-4">
              Pago
            </h2>
            <div className="flex items-center gap-2 text-donot-ink mb-1">
              <CreditCard size={16} className="text-donot-verde" />
              <span>
                {order.paymentProvider === 'MERCADO_PAGO'
                  ? 'Mercado Pago'
                  : order.paymentProvider === 'TRANSBANK'
                    ? 'Webpay'
                    : 'Khipu'}
              </span>
            </div>
            <p className="text-donot-muted text-sm">
              Pagado el {fmtDate(order.paidAt)}
            </p>
            {order.paymentId && (
              <p className="text-donot-muted text-xs font-mono mt-1 truncate">
                {order.paymentId}
              </p>
            )}
          </div>

          <Link
            href={`/pedido/${order.publicToken}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-donot-naranjo font-semibold hover:underline self-start"
          >
            Ver vista pública <ExternalLink size={14} />
          </Link>
        </aside>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'discount' | 'total'
}) {
  return (
    <div
      className={cn(
        'flex justify-between',
        tone === 'discount' && 'text-donot-naranjo',
        tone === 'total' && 'pt-2 border-t border-donot-border font-display text-donot-verde text-lg',
      )}
    >
      <dt>{label}</dt>
      <dd className={tone === 'total' ? 'font-display' : 'font-semibold'}>
        {value}
      </dd>
    </div>
  )
}
