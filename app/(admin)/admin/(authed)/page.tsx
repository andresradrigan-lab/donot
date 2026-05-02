import Link from 'next/link'
import { ArrowRight, Package, DollarSign, Receipt, Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatClp } from '@/lib/format'
import { requireAdmin } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard · admin donot.',
  robots: { index: false, follow: false },
}

function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export default async function AdminDashboardPage() {
  const admin = requireAdmin()

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const [
    paidToday,
    pendingToday,
    revenueAgg,
    weekRevenueAgg,
    inPreparation,
    lastPaid,
  ] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ['PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] }, paidAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.order.count({
      where: { status: 'PENDING', createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.order.aggregate({
      where: { paidAt: { gte: todayStart, lte: todayEnd } },
      _sum: { totalClp: true },
      _avg: { totalClp: true },
    }),
    prisma.order.aggregate({
      where: {
        paidAt: { gte: new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000) },
      },
      _sum: { totalClp: true },
    }),
    prisma.order.count({
      where: { status: 'PREPARING' },
    }),
    prisma.order.findMany({
      where: { status: { not: 'PENDING' } },
      orderBy: { paidAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalClp: true,
        status: true,
        paidAt: true,
      },
    }),
  ])

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <div className="mb-8">
        <p className="text-donot-muted text-sm">Hola {admin.name.split(' ')[0]},</p>
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Hoy en donot.
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Kpi
          icon={<Package size={20} />}
          label="Pedidos pagados hoy"
          value={paidToday.toString()}
        />
        <Kpi
          icon={<DollarSign size={20} />}
          label="Ingresos de hoy"
          value={formatClp(revenueAgg._sum.totalClp ?? 0)}
        />
        <Kpi
          icon={<Receipt size={20} />}
          label="Ticket promedio hoy"
          value={revenueAgg._avg.totalClp ? formatClp(Math.round(revenueAgg._avg.totalClp)) : '—'}
        />
        <Kpi
          icon={<Users size={20} />}
          label="Pendientes hoy"
          value={pendingToday.toString()}
          hint="Esperando pago"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-donot-border rounded-3xl shadow-soft p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl text-donot-verde">
              Últimos pedidos pagados
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-sm text-donot-naranjo font-semibold hover:underline inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {lastPaid.length === 0 ? (
            <p className="text-donot-muted">Aún no hay pedidos.</p>
          ) : (
            <ul className="divide-y divide-donot-border">
              {lastPaid.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-donot-rowAlt/50 -mx-6 px-6 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-donot-verde">
                        {o.orderNumber}
                      </p>
                      <p className="text-donot-muted text-sm truncate">
                        {o.customerName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-donot-naranjo">
                        {formatClp(o.totalClp)}
                      </p>
                      <p className="text-donot-muted text-xs">
                        {o.status.toLowerCase()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-donot-verde text-donot-crema rounded-3xl p-6">
            <p className="text-donot-crema/70 text-sm">Últimos 7 días</p>
            <p className="font-display text-3xl mt-1">
              {formatClp(weekRevenueAgg._sum.totalClp ?? 0)}
            </p>
            <p className="text-donot-crema/70 text-sm mt-1">en ventas</p>
          </div>
          <div className="bg-donot-rosado/15 border border-donot-rosado/30 rounded-3xl p-6">
            <p className="text-donot-verde text-sm">Cocina</p>
            <p className="font-display text-3xl text-donot-verde mt-1">
              {inPreparation}
            </p>
            <p className="text-donot-muted text-sm mt-1">
              en preparación ahora
            </p>
            <Link
              href="/admin/cocina"
              className="inline-flex items-center gap-1 text-donot-naranjo font-semibold text-sm mt-3 hover:underline"
            >
              Ir a cocina <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="bg-white border border-donot-border rounded-2xl shadow-soft p-5">
      <div className="flex items-center gap-2 text-donot-muted text-sm mb-2">
        <span className="text-donot-verde">{icon}</span>
        {label}
      </div>
      <p className="font-display text-2xl text-donot-verde">{value}</p>
      {hint && <p className="text-xs text-donot-muted mt-1">{hint}</p>}
    </div>
  )
}
