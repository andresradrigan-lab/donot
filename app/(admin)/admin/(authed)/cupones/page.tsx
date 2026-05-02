import { prisma } from '@/lib/db'
import { CouponsManager, type CouponWithMetrics } from '@/components/admin/CouponsManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Cupones · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })

  const codes = coupons.map((c) => c.code)
  const revenueByCoupon = codes.length
    ? await prisma.order.groupBy({
        by: ['couponCode'],
        where: {
          couponCode: { in: codes },
          status: { in: ['PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] },
        },
        _sum: { totalClp: true, discountClp: true },
        _count: { _all: true },
      })
    : []
  const metrics = new Map(
    revenueByCoupon.map((r) => [
      r.couponCode,
      {
        revenueClp: r._sum.totalClp ?? 0,
        discountTotalClp: r._sum.discountClp ?? 0,
        ordersCount: r._count._all,
      },
    ]),
  )

  const withMetrics: CouponWithMetrics[] = coupons.map((c) => ({
    ...c,
    metrics: metrics.get(c.code) ?? { revenueClp: 0, discountTotalClp: 0, ordersCount: 0 },
  }))

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Cupones
        </h1>
        <p className="text-donot-muted">
          {coupons.length} cupones · {coupons.filter((c) => c.isActive).length} activos.
        </p>
      </header>
      <CouponsManager coupons={withMetrics} />
    </section>
  )
}
