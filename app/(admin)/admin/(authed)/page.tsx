import Link from 'next/link'
import {
  ArrowRight,
  Package,
  DollarSign,
  Receipt,
  Users,
  TrendingUp,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatClp } from '@/lib/format'
import { requireAdmin } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard · admin donot.',
  robots: { index: false, follow: false },
}

type Range = 'hoy' | 'semana' | 'mes' | 'ano'

interface SearchParams {
  rango?: Range
}

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: '7 días' },
  { value: 'mes', label: '30 días' },
  { value: 'ano', label: 'Este año' },
]

const PAID_STATUSES = ['PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] as const

function rangeStart(r: Range): Date {
  const d = new Date()
  switch (r) {
    case 'hoy':
      d.setHours(0, 0, 0, 0)
      return d
    case 'semana':
      d.setDate(d.getDate() - 7)
      return d
    case 'mes':
      d.setDate(d.getDate() - 30)
      return d
    case 'ano':
      return new Date(d.getFullYear(), 0, 1)
  }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const admin = requireAdmin()
  const range: Range = searchParams.rango ?? 'hoy'
  const since = rangeStart(range)

  const [
    paidAgg,
    pendingCount,
    cancelledCount,
    inPreparation,
    lastPaid,
    paidOrdersForBreakdown,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [...PAID_STATUSES] }, paidAt: { gte: since } },
      _sum: { totalClp: true, subtotalClp: true, discountClp: true, shippingClp: true },
      _avg: { totalClp: true },
      _count: { _all: true },
    }),
    prisma.order.count({ where: { status: 'PENDING', createdAt: { gte: since } } }),
    prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: since } } }),
    prisma.order.count({ where: { status: 'PREPARING' } }),
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
      },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { status: { in: [...PAID_STATUSES] }, paidAt: { gte: since } },
      },
      select: {
        boxId: true,
        boxNameSnapshot: true,
        quantity: true,
        flavors: true,
        lineTotalClp: true,
        order: { select: { totalClp: true } },
      },
    }),
  ])

  // Top sabores: contar slots vendidos.
  const flavorTotals = new Map<string, { name: string; qty: number }>()
  // Top cajas: sumar quantity de OrderItem.
  const boxTotals = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const it of paidOrdersForBreakdown) {
    const cur = boxTotals.get(it.boxId) ?? { name: it.boxNameSnapshot, qty: 0, revenue: 0 }
    cur.qty += it.quantity
    cur.revenue += it.lineTotalClp
    boxTotals.set(it.boxId, cur)

    const flavors = (it.flavors as FlavorLine[] | null) ?? []
    for (const f of flavors) {
      const fcur = flavorTotals.get(f.flavorSlug) ?? { name: f.flavorName, qty: 0 }
      fcur.qty += f.qty * it.quantity
      flavorTotals.set(f.flavorSlug, fcur)
    }
  }
  const topFlavors = [...flavorTotals.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
  const topBoxes = [...boxTotals.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  // Performance por droop: revenue de pedidos pagados dentro de la ventana
  // del droop. Aproximación buena para MVP — más adelante podemos atribuir
  // por OrderItem→Flavor→Droop si hay drops solapados.
  const droops = await prisma.droop.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, code: true, startsAt: true, endsAt: true },
  })
  // Suma de revenue de pedidos cuyo paidAt cae dentro de la ventana del droop.
  const droopStats = await Promise.all(
    droops.map(async (d) => {
      const agg = await prisma.order.aggregate({
        where: {
          status: { in: [...PAID_STATUSES] },
          paidAt: {
            gte: d.startsAt,
            ...(d.endsAt ? { lte: d.endsAt } : {}),
          },
        },
        _sum: { totalClp: true },
        _count: { _all: true },
      })
      return {
        ...d,
        revenue: agg._sum.totalClp ?? 0,
        ordersCount: agg._count._all,
      }
    }),
  )

  // Embudo simple sin tracking externo: pedidos creados, abandonados, pagados.
  const created = paidAgg._count._all + pendingCount + cancelledCount
  const conversionRate =
    created > 0 ? Math.round((paidAgg._count._all / created) * 100) : 0

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-donot-muted text-sm">Hola {admin.name.split(' ')[0]},</p>
          <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
            Cómo va donot.
          </h1>
        </div>
        <nav className="flex gap-1 bg-white border border-donot-border rounded-full p-1">
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.value
            return (
              <Link
                key={opt.value}
                href={`/admin?rango=${opt.value}`}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-semibold transition',
                  active
                    ? 'bg-donot-verde text-donot-crema'
                    : 'text-donot-verde hover:bg-donot-rowAlt',
                )}
              >
                {opt.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Kpi
          icon={<Package size={20} />}
          label="Pedidos pagados"
          value={paidAgg._count._all.toString()}
        />
        <Kpi
          icon={<DollarSign size={20} />}
          label="Ingresos"
          value={formatClp(paidAgg._sum.totalClp ?? 0)}
        />
        <Kpi
          icon={<Receipt size={20} />}
          label="Ticket promedio"
          value={
            paidAgg._avg.totalClp ? formatClp(Math.round(paidAgg._avg.totalClp)) : '—'
          }
        />
        <Kpi
          icon={<TrendingUp size={20} />}
          label="Tasa de conversión"
          value={`${conversionRate}%`}
          hint={`${paidAgg._count._all} de ${created} pedidos creados`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <Section title="Top sabores" hint={range === 'hoy' ? 'Hoy' : 'En el rango'}>
          {topFlavors.length === 0 ? (
            <p className="text-donot-muted text-sm">Sin datos en el rango.</p>
          ) : (
            <ol className="space-y-2">
              {topFlavors.map(([slug, info], i) => (
                <Bar key={slug} rank={i + 1} label={info.name} value={info.qty} max={topFlavors[0][1].qty} />
              ))}
            </ol>
          )}
        </Section>

        <Section title="Top cajas" hint="Por ingresos">
          {topBoxes.length === 0 ? (
            <p className="text-donot-muted text-sm">Sin datos.</p>
          ) : (
            <ol className="space-y-2">
              {topBoxes.map(([id, info], i) => (
                <Bar
                  key={id}
                  rank={i + 1}
                  label={info.name}
                  value={info.qty}
                  max={topBoxes[0][1].qty}
                  trailing={formatClp(info.revenue)}
                />
              ))}
            </ol>
          )}
        </Section>

        <Section title="Embudo" hint="Período seleccionado">
          <FunnelStep label="Pedidos creados" value={created} max={Math.max(created, 1)} />
          <FunnelStep label="Pagados" value={paidAgg._count._all} max={Math.max(created, 1)} highlight />
          <FunnelStep label="Pendientes" value={pendingCount} max={Math.max(created, 1)} muted />
          <FunnelStep label="Cancelados" value={cancelledCount} max={Math.max(created, 1)} muted />
        </Section>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-donot-border rounded-3xl shadow-soft p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl text-donot-verde">
              Performance por Droop
            </h2>
            <Link
              href="/admin/droops"
              className="text-sm text-donot-naranjo font-semibold hover:underline inline-flex items-center gap-1"
            >
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>
          {droopStats.length === 0 ? (
            <p className="text-donot-muted text-sm">Aún no hay droops.</p>
          ) : (
            <ul className="divide-y divide-donot-border">
              {droopStats.map((d) => (
                <li key={d.id} className="py-3 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-donot-verde">{d.name}</p>
                    <p className="text-donot-muted text-xs">
                      {d.code} · {d.ordersCount} pedidos
                    </p>
                  </div>
                  <span className="font-semibold text-donot-naranjo whitespace-nowrap">
                    {formatClp(d.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-donot-verde text-donot-crema rounded-3xl p-6">
            <p className="text-donot-crema/70 text-sm">Cocina ahora</p>
            <p className="font-display text-3xl mt-1">{inPreparation}</p>
            <p className="text-donot-crema/70 text-sm mt-1">en preparación</p>
            <Link
              href="/admin/cocina"
              className="inline-flex items-center gap-1 text-donot-rosado font-semibold text-sm mt-3 hover:underline"
            >
              Ir a cocina <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-display text-lg text-donot-verde">
                Últimos pedidos
              </h3>
              <Link
                href="/admin/pedidos"
                className="text-sm text-donot-naranjo font-semibold hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            {lastPaid.length === 0 ? (
              <p className="text-donot-muted text-sm">Aún no hay pedidos.</p>
            ) : (
              <ul className="divide-y divide-donot-border">
                {lastPaid.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="flex items-center justify-between gap-3 py-2 hover:text-donot-naranjo transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-donot-verde text-sm">
                          {o.orderNumber}
                        </p>
                        <p className="text-donot-muted text-xs truncate">
                          {o.customerName}
                        </p>
                      </div>
                      <span className="font-semibold text-donot-naranjo whitespace-nowrap text-sm">
                        {formatClp(o.totalClp)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-donot-border rounded-3xl shadow-soft p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-lg text-donot-verde">{title}</h2>
        {hint && <span className="text-xs text-donot-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Bar({
  rank,
  label,
  value,
  max,
  trailing,
}: {
  rank: number
  label: string
  value: number
  max: number
  trailing?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 mb-1 text-sm">
        <span className="text-donot-verde font-semibold">
          {rank}. {label}
        </span>
        <span className="text-donot-muted">
          {trailing ?? value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-donot-rowAlt overflow-hidden">
        <div className="h-full bg-donot-naranjo" style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}

function FunnelStep({
  label,
  value,
  max,
  highlight,
  muted,
}: {
  label: string
  value: number
  max: number
  highlight?: boolean
  muted?: boolean
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between gap-2 mb-1 text-sm">
        <span
          className={cn(
            'font-semibold',
            muted ? 'text-donot-muted' : 'text-donot-verde',
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'font-semibold text-sm',
            highlight && 'text-donot-naranjo',
            muted && 'text-donot-muted',
          )}
        >
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-donot-rowAlt overflow-hidden">
        <div
          className={cn(
            'h-full',
            highlight ? 'bg-donot-naranjo' : muted ? 'bg-donot-border' : 'bg-donot-verde',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
