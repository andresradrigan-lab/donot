import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Check, Clock, Package, Truck, X, Home, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatClp } from '@/lib/format'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: { token: string }
}

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

const STATUS_FLOW = [
  { key: 'PAID', label: 'Pagado', icon: Check },
  { key: 'PREPARING', label: 'Preparando', icon: Clock },
  { key: 'IN_TRANSIT', label: 'En camino', icon: Truck },
  { key: 'DELIVERED', label: 'Entregado', icon: Package },
] as const

export default async function OrderTrackingPage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { publicToken: params.token },
    include: { items: true },
  })

  if (!order) notFound()

  const isCancelled = order.status === 'CANCELLED'
  const isRefunded = order.status === 'REFUNDED'
  const isPending = order.status === 'PENDING'

  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === order.status)
  const formattedDate = order.deliveryDate
    ? new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(order.deliveryDate)
    : null

  return (
    <section className="px-6 md:px-10 py-12 md:py-16 max-w-3xl mx-auto">
      <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6 md:p-10">
        <header className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-donot-muted text-sm uppercase tracking-wide">
              Pedido
            </p>
            <h1 className="font-display text-4xl text-donot-verde">
              {order.orderNumber}
            </h1>
            <p className="text-donot-muted text-sm mt-1">
              A nombre de {order.customerName}
            </p>
          </div>
          <Image
            src="/brand/mascota-crema-verde.png"
            alt=""
            width={80}
            height={100}
            className="h-20 w-auto"
          />
        </header>

        {isPending && (
          <div className="mb-8 px-5 py-4 bg-donot-azulPastel/30 rounded-2xl text-donot-verde">
            <p className="font-semibold">Esperando confirmación de pago.</p>
            <p className="text-sm text-donot-muted">
              Si pagaste hace un momento, dale unos segundos y refresca.
            </p>
          </div>
        )}

        {(isCancelled || isRefunded) && (
          <div className="mb-8 px-5 py-4 bg-donot-naranjo/10 rounded-2xl text-donot-naranjo flex items-start gap-3">
            <X size={20} className="mt-0.5" />
            <div>
              <p className="font-semibold">
                {isCancelled ? 'Pedido cancelado' : 'Pedido reembolsado'}
              </p>
              <p className="text-sm text-donot-muted">
                Si necesitas ayuda, escríbenos a hola@donot.cl.
              </p>
            </div>
          </div>
        )}

        {!isCancelled && !isRefunded && !isPending && (
          <ol className="grid gap-3 mb-8">
            {STATUS_FLOW.map((step, idx) => {
              const Icon = step.icon
              const reached = idx <= currentIdx
              return (
                <li
                  key={step.key}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-2xl border',
                    reached
                      ? 'border-donot-verde bg-donot-verde/5 text-donot-verde'
                      : 'border-donot-border text-donot-muted',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-9 h-9 rounded-full',
                      reached
                        ? 'bg-donot-verde text-donot-crema'
                        : 'bg-donot-rowAlt',
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="font-display text-lg">{step.label}</span>
                </li>
              )
            })}
          </ol>
        )}

        <div className="grid gap-3 mb-8 text-donot-ink">
          <div className="flex items-center gap-3">
            {order.deliveryMethod === 'DELIVERY' ? (
              <MapPin size={18} className="text-donot-verde" />
            ) : (
              <Home size={18} className="text-donot-verde" />
            )}
            <span>
              {order.deliveryMethod === 'DELIVERY'
                ? `Despacho a ${order.deliveryCommune}`
                : order.deliveryMethod === 'PICKUP_CONCON'
                  ? 'Retiro en Concón'
                  : 'Retiro en Reñaca'}
            </span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-donot-verde" />
              <span>
                {formattedDate}
                {order.deliveryTimeSlot && ` · ${order.deliveryTimeSlot}h`}
              </span>
            </div>
          )}
        </div>

        <h2 className="font-display text-xl text-donot-verde mb-3">
          Tu cajita
        </h2>
        <ul className="space-y-3 mb-6">
          {order.items.map((it) => {
            const flavors = (it.flavors as FlavorLine[] | null) ?? []
            return (
              <li
                key={it.id}
                className="px-4 py-3 bg-donot-rowAlt rounded-xl"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-semibold text-donot-verde">
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

        <dl className="border-t border-donot-border pt-4 grid gap-2 text-donot-ink">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatClp(order.subtotalClp)}</dd>
          </div>
          {order.discountClp > 0 && (
            <div className="flex justify-between text-donot-naranjo">
              <dt>Descuento</dt>
              <dd>−{formatClp(order.discountClp)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd>
              {order.shippingClp === 0 ? 'Por la casa' : formatClp(order.shippingClp)}
            </dd>
          </div>
          <div className="flex justify-between text-lg pt-2 border-t border-donot-border">
            <dt className="font-display text-donot-verde">Total</dt>
            <dd className="font-display text-donot-verde">
              {formatClp(order.totalClp)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
