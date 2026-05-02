import { prisma } from '@/lib/db'
import { BoxesManager } from '@/components/admin/BoxesManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Cajas · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminBoxesPage() {
  const boxes = await prisma.box.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Cajas
        </h1>
        <p className="text-donot-muted">
          {boxes.length} cajas. Inactivas no aparecen como compra pero quedan en el catálogo.
        </p>
      </header>
      <BoxesManager boxes={boxes} />
    </section>
  )
}
