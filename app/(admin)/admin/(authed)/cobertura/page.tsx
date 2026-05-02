import { prisma } from '@/lib/db'
import { CoverageManager } from '@/components/admin/CoverageManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Cobertura · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminCoveragePage() {
  const zones = await prisma.coverageZone.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Cobertura de despacho
        </h1>
        <p className="text-donot-muted">
          Comunas a las que llegamos y su tarifa. Las inactivas no aparecen en
          el checkout pero quedan guardadas.
        </p>
      </header>
      <CoverageManager zones={zones} />
    </section>
  )
}
