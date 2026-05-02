import { prisma } from '@/lib/db'
import { FlavorsManager } from '@/components/admin/FlavorsManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sabores · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminFlavorsPage() {
  const [flavors, droops] = await Promise.all([
    prisma.flavor.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: { droop: { select: { code: true, name: true } } },
    }),
    prisma.droop.findMany({
      where: { deletedAt: null, isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, code: true },
    }),
  ])

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Sabores
        </h1>
        <p className="text-donot-muted">
          {flavors.length} sabores cargados. Las descripciones del cliente van
          palabra por palabra.
        </p>
      </header>
      <FlavorsManager flavors={flavors} droops={droops} />
    </section>
  )
}
