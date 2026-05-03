import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/db'
import { weekdaysFromJson } from '@/lib/weekdays'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Calendario · admin donot.',
  robots: { index: false, follow: false },
}

interface SearchParams {
  month?: string // YYYY-MM
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] // empezando lunes

function parseMonth(input?: string): { year: number; month: number } {
  if (input && /^\d{4}-\d{2}$/.test(input)) {
    const [y, m] = input.split('-').map(Number)
    return { year: y, month: m - 1 }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1))
}

function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { year, month } = parseMonth(searchParams.month)
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const daysInMonth = monthEnd.getDate()

  const [boxes, droops, flavors, ordersByDate] = await Promise.all([
    prisma.box.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.droop.findMany({
      where: { deletedAt: null, isPublished: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.flavor.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.order.groupBy({
      by: ['deliveryDate'],
      where: {
        status: { in: ['PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] },
        deliveryDate: { gte: monthStart, lte: monthEnd },
      },
      _count: { _all: true },
    }),
  ])

  const orderCountByDay = new Map<number, number>()
  for (const row of ordersByDate) {
    if (!row.deliveryDate) continue
    const day = row.deliveryDate.getDate()
    orderCountByDay.set(day, (orderCountByDay.get(day) ?? 0) + row._count._all)
  }

  // Construir grid: empieza en lunes
  const firstWeekday = (monthStart.getDay() + 6) % 7 // lunes=0
  const cells: ({ day: number } | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })
  while (cells.length % 7 !== 0) cells.push(null)

  function activeOnDay(day: number): {
    boxes: number
    flavors: number
    droops: number
  } {
    const date = new Date(year, month, day)
    const weekday = date.getDay()

    const activeBoxes = boxes.filter((b) => {
      if (!b.isActive) return false
      if (!weekdaysFromJson(b.availableWeekdays).includes(weekday)) return false
      if (b.availableFrom && date < b.availableFrom) return false
      if (b.availableTo && date > b.availableTo) return false
      return true
    }).length

    const activeFlavors = flavors.filter((f) => {
      if (!weekdaysFromJson(f.availableWeekdays).includes(weekday)) return false
      if (!f.droopId) return true
      const droop = droops.find((dr) => dr.id === f.droopId)
      if (!droop) return false
      if (droop.startsAt > date) return false
      if (droop.endsAt && droop.endsAt < date) return false
      return true
    }).length

    const activeDroops = droops.filter((d) => {
      if (d.startsAt > date) return false
      if (d.endsAt && d.endsAt < date) return false
      return true
    }).length

    return { boxes: activeBoxes, flavors: activeFlavors, droops: activeDroops }
  }

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month

  return (
    <section className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
      <header className="flex items-baseline justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
            Calendario
          </h1>
          <p className="text-donot-muted">
            Disponibilidad de cajas y sabores por día. Pedidos pagados marcados
            con punto.
          </p>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href={`/admin/calendario?month=${shiftMonth(year, month, -1)}`}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-donot-border hover:border-donot-verde transition"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="font-display text-lg text-donot-verde capitalize min-w-[150px] text-center">
            {formatMonthLabel(year, month)}
          </span>
          <Link
            href={`/admin/calendario?month=${shiftMonth(year, month, +1)}`}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-donot-border hover:border-donot-verde transition"
          >
            <ChevronRight size={16} />
          </Link>
        </nav>
      </header>

      <div className="bg-white border border-donot-border rounded-3xl shadow-soft overflow-hidden">
        <div className="grid grid-cols-7 bg-donot-rowAlt text-donot-verde text-center font-semibold text-sm">
          {WEEKDAY_LABELS.map((d, i) => (
            <span key={i} className="py-3 border-r last:border-r-0 border-donot-border">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="bg-donot-rowAlt/40 min-h-24 border-t border-r border-donot-border" />
            const stats = activeOnDay(cell.day)
            const orderCount = orderCountByDay.get(cell.day) ?? 0
            const isToday = isCurrentMonth && cell.day === today.getDate()
            return (
              <div
                key={i}
                className={cn(
                  'min-h-24 px-2 py-2 border-t border-r last:border-r-0 border-donot-border flex flex-col gap-1',
                  isToday && 'bg-donot-rosado/10',
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      'font-display text-sm',
                      isToday ? 'text-donot-naranjo' : 'text-donot-verde',
                    )}
                  >
                    {cell.day}
                  </span>
                  {orderCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-donot-naranjo text-white text-[10px] font-bold">
                      {orderCount}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-donot-muted leading-snug mt-auto">
                  <div>
                    <strong className="text-donot-verde">{stats.boxes}</strong> cajas
                  </div>
                  <div>
                    <strong className="text-donot-verde">{stats.flavors}</strong> sabores
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-donot-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-donot-rosado/30 border border-donot-rosado" />
          Hoy
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-donot-naranjo text-white text-[10px] font-bold">
            N
          </span>
          Pedidos del día
        </span>
      </div>
    </section>
  )
}
