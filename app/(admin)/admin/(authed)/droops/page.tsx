import { prisma } from '@/lib/db'
import { DroopsManager } from '@/components/admin/DroopsManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Droops · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminDroopsPage() {
  const droops = await prisma.droop.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Droops
        </h1>
        <p className="text-donot-muted">
          Cada Droop es una colección limitada. Ahora hay {droops.length}.
        </p>
      </header>
      <DroopsManager droops={droops} />
    </section>
  )
}
