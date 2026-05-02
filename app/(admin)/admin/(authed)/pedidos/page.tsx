import Link from 'next/link'
import type { OrderStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { formatClp } from '@/lib/format'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pedidos · admin donot.',
  robots: { index: false, follow: false },
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

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

interface SearchParams {
  status?: string
  date?: string
  commune?: string
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const status = searchParams.status as OrderStatus | undefined
  const dateStr = searchParams.date
  const commune = searchParams.commune?.trim()

  const filters: Prisma.OrderWhereInput = {}

  if (status && ALL_STATUSES.includes(status)) filters.status = status
  if (commune)
    filters.deliveryCommune = { contains: commune, mode: 'insensitive' }
  if (dateStr) {
    const start = new Date(dateStr + 'T00:00:00')
    const end = new Date(dateStr + 'T23:59:59.999')
    filters.deliveryDate = { gte: start, lte: end }
  }

  const orders = await prisma.order.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      status: true,
      totalClp: true,
      deliveryMethod: true,
      deliveryCommune: true,
      deliveryDate: true,
      paidAt: true,
      createdAt: true,
    },
  })

  const totalCount = await prisma.order.count({ where: filters })

  // Comunas distintas existentes para el filtro
  const communes = await prisma.order.findMany({
    where: { deliveryCommune: { not: null } },
    distinct: ['deliveryCommune'],
    select: { deliveryCommune: true },
    take: 50,
  })

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-donot-verde">Pedidos</h1>
          <p className="text-donot-muted">{totalCount} pedidos</p>
        </div>
      </div>

      <form
        method="get"
        className="bg-white border border-donot-border rounded-2xl p-4 mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end"
      >
        <Field label="Estado">
          <select
            name="status"
            defaultValue={status ?? ''}
            className="w-full px-4 py-2.5 rounded-xl border border-donot-border bg-white"
          >
            <option value="">Todos</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de entrega">
          <input
            type="date"
            name="date"
            defaultValue={dateStr ?? ''}
            className="w-full px-4 py-2.5 rounded-xl border border-donot-border bg-white"
          />
        </Field>
        <Field label="Comuna">
          <select
            name="commune"
            defaultValue={commune ?? ''}
            className="w-full px-4 py-2.5 rounded-xl border border-donot-border bg-white"
          >
            <option value="">Todas</option>
            {communes
              .map((c) => c.deliveryCommune)
              .filter((c): c is string => !!c)
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </Field>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-donot-verde text-donot-crema font-display hover:bg-donot-verde/90 transition"
        >
          Filtrar
        </button>
      </form>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-donot-muted">
            No hay pedidos con esos filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-donot-rowAlt text-donot-verde">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Pedido</th>
                <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold">Despacho</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr
                  key={o.id}
                  className={cn(
                    'border-t border-donot-border',
                    i % 2 === 1 && 'bg-donot-rowAlt/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="font-display text-donot-verde hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <div className="text-xs text-donot-muted">
                      {new Intl.DateTimeFormat('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(o.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customerName}</div>
                    <div className="text-xs text-donot-muted">{o.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-donot-ink">
                    {o.deliveryMethod === 'DELIVERY'
                      ? o.deliveryCommune ?? 'Despacho'
                      : o.deliveryMethod === 'PICKUP_CONCON'
                        ? 'Retiro Concón'
                        : 'Retiro Reñaca'}
                    {o.deliveryDate && (
                      <div className="text-xs text-donot-muted">
                        {new Intl.DateTimeFormat('es-CL', {
                          day: '2-digit',
                          month: 'short',
                        }).format(o.deliveryDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-block px-2.5 py-1 rounded-full text-xs font-semibold',
                        STATUS_COLOR[o.status],
                      )}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                    {formatClp(o.totalClp)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="text-donot-naranjo font-semibold hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-donot-verde uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  )
}
