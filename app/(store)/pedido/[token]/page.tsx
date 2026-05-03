import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Clock, Home, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatClp } from '@/lib/format'
import { OrderTimeline } from '@/components/store/OrderTimeline'

export const dynamic = 'force-dynamic'

interface Props {
  params: { token: string }
}

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

export default async function OrderTrackingPage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { publicToken: params.token },
    include: { items: true },
  })

  if (!order) notFound()

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

        <OrderTimeline
          token={params.token}
          initialStatus={order.status}
          initialTimestamps={{
            paidAt: order.paidAt?.toISOString() ?? null,
            preparingAt: order.preparingAt?.toISOString() ?? null,
            inTransitAt: order.inTransitAt?.toISOString() ?? null,
            deliveredAt: order.deliveredAt?.toISOString() ?? null,
            cancelledAt: order.cancelledAt?.toISOString() ?? null,
          }}
        />

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
                className="px-4 py-4 bg-donot-rowAlt rounded-2xl"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="font-semibold text-donot-verde">
                    {it.boxNameSnapshot}
                    {it.quantity > 1 && ` × ${it.quantity}`}
                  </span>
                  <span className="text-donot-naranjo font-display whitespace-nowrap">
                    {formatClp(it.lineTotalClp)}
                  </span>
                </div>
                {flavors.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {flavors.map((f) => (
                        <div
                          key={f.flavorSlug}
                          className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-donot-crema bg-white shrink-0"
                          title={`${f.qty} × ${f.flavorName}`}
                        >
                          <Image
                            src={`/menu/${f.flavorSlug}.png`}
                            alt={f.flavorName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                          {f.qty > 1 && (
                            <span className="absolute -bottom-0 -right-0 bg-donot-verde text-donot-crema text-[10px] font-bold rounded-full w-5 h-5 inline-flex items-center justify-center border-2 border-white">
                              {f.qty}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-donot-muted text-sm">
                      {flavors.map((f) => `${f.qty} × ${f.flavorName}`).join(' · ')}
                    </p>
                  </>
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
