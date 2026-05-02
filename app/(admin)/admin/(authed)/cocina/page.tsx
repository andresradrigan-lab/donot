import Link from 'next/link'
import type { DeliveryMethod, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { cn } from '@/lib/utils'
import { KitchenCard, type KitchenOrder } from '@/components/admin/KitchenCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Cocina · admin donot.',
  robots: { index: false, follow: false },
}

type WhenFilter = 'hoy' | 'manana' | 'semana' | 'todos'
type HowFilter = 'todos' | 'retiro' | 'despacho'

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

interface SearchParams {
  when?: WhenFilter
  how?: HowFilter
}

const WHEN_OPTIONS: { value: WhenFilter; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'manana', label: 'Mañana' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'todos', label: 'Todos' },
]

const HOW_OPTIONS: { value: HowFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'despacho', label: 'Despacho' },
]

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function buildDateFilter(when: WhenFilter): { gte: Date; lte: Date } | null {
  const now = new Date()
  switch (when) {
    case 'hoy':
      return { gte: startOfDay(now), lte: endOfDay(now) }
    case 'manana': {
      const t = new Date(now)
      t.setDate(t.getDate() + 1)
      return { gte: startOfDay(t), lte: endOfDay(t) }
    }
    case 'semana': {
      const end = new Date(now)
      end.setDate(end.getDate() + 6)
      return { gte: startOfDay(now), lte: endOfDay(end) }
    }
    case 'todos':
    default:
      return null
  }
}

function buildDeliveryFilter(how: HowFilter): DeliveryMethod[] | null {
  switch (how) {
    case 'retiro':
      return ['PICKUP_CONCON', 'PICKUP_RENACA']
    case 'despacho':
      return ['DELIVERY']
    case 'todos':
    default:
      return null
  }
}

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const when: WhenFilter = searchParams.when ?? 'hoy'
  const how: HowFilter = searchParams.how ?? 'todos'

  const dateFilter = buildDateFilter(when)
  const deliveryFilter = buildDeliveryFilter(how)

  const where: Prisma.OrderWhereInput = {
    status: { in: ['PAID', 'PREPARING', 'IN_TRANSIT'] },
  }
  if (dateFilter) where.deliveryDate = dateFilter
  if (deliveryFilter) where.deliveryMethod = { in: deliveryFilter }

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ deliveryDate: 'asc' }, { deliveryTimeSlot: 'asc' }],
    take: 200,
    include: {
      items: {
        select: {
          id: true,
          boxNameSnapshot: true,
          quantity: true,
          flavors: true,
        },
      },
    },
  })

  const kitchenOrders: KitchenOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    status: o.status,
    deliveryMethod: o.deliveryMethod,
    deliveryCommune: o.deliveryCommune,
    deliveryAddress: o.deliveryAddress,
    deliveryDate: o.deliveryDate,
    deliveryTimeSlot: o.deliveryTimeSlot,
    items: o.items.map((it) => ({
      id: it.id,
      boxNameSnapshot: it.boxNameSnapshot,
      quantity: it.quantity,
      flavors: (it.flavors as FlavorLine[] | null) ?? [],
    })),
  }))

  return (
    <section className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Cocina
        </h1>
        <p className="text-donot-muted text-sm">
          Pedidos vivos para preparar y despachar.
        </p>
      </header>

      <div className="flex flex-col gap-3 mb-6 sticky top-16 z-20 bg-donot-crema py-3 -mx-4 px-4 md:-mx-8 md:px-8">
        <FilterRow
          options={WHEN_OPTIONS}
          current={when}
          paramKey="when"
          otherParam={['how', how]}
        />
        <FilterRow
          options={HOW_OPTIONS}
          current={how}
          paramKey="how"
          otherParam={['when', when]}
        />
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="bg-white border border-donot-border rounded-3xl p-10 text-center">
          <p className="font-display text-xl text-donot-verde mb-1">
            Sin pedidos por hacer.
          </p>
          <p className="text-donot-muted text-sm">
            Cuando entren pedidos en este filtro, aparecen acá apilados.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {kitchenOrders.map((o) => (
            <KitchenCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </section>
  )
}

function FilterRow<T extends string>({
  options,
  current,
  paramKey,
  otherParam,
}: {
  options: { value: T; label: string }[]
  current: T
  paramKey: string
  otherParam: [string, string]
}) {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
      {options.map((opt) => {
        const params = new URLSearchParams()
        params.set(paramKey, opt.value)
        if (otherParam[1]) params.set(otherParam[0], otherParam[1])
        const active = current === opt.value
        return (
          <Link
            key={opt.value}
            href={`/admin/cocina?${params.toString()}`}
            className={cn(
              'px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition',
              active
                ? 'bg-donot-verde text-donot-crema'
                : 'bg-white border border-donot-border text-donot-verde hover:border-donot-verde',
            )}
          >
            {opt.label}
          </Link>
        )
      })}
    </div>
  )
}
