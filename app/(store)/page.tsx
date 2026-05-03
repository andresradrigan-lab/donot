import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { BoxCard } from '@/components/store/BoxCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const now = new Date()

  const droop = await prisma.droop.findFirst({
    where: {
      isPublished: true,
      deletedAt: null,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      flavors: {
        where: { isActive: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        take: 4,
      },
    },
  })

  const boxes = await prisma.box.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })

  const coverFlavorSlugs = droop?.flavors.map((f) => f.slug) ?? []

  return (
    <>
      <section className="relative px-6 md:px-10 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="max-w-8xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <div className="flex flex-col items-start gap-6">
            {droop && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-donot-rosado/15 text-donot-verde font-sans font-semibold text-sm">
                {droop.name} · {droop.tagline}
              </span>
            )}
            <h1 className="font-display text-5xl md:text-7xl text-donot-verde leading-[0.95]">
              Donas que no
              <br />
              deberían existir.
            </h1>
            <p className="text-donot-muted text-lg max-w-md">
              8 sabores premium, hechos a mano en Concón. Pásate al local o pide
              tu cajita a domicilio.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {droop && (
                <Link href={`/droop/${droop.code}`}>
                  <Button size="lg">Ver el drop</Button>
                </Link>
              )}
              <Link href="/sobre-nosotros">
                <Button variant="secondary" size="lg">
                  Conócenos
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative aspect-square max-w-md mx-auto md:mx-0 md:ml-auto">
            <div className="absolute inset-0 rounded-[3rem] bg-donot-azulPastel/40 -rotate-3" />
            <div className="absolute inset-0 rounded-[3rem] bg-donot-rosado/25 rotate-2" />
            <Image
              src="/brand/mascota-crema-verde.png"
              alt="Mascota de donot."
              fill
              priority
              className="object-contain p-8"
            />
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-8xl mx-auto">
          <div className="mb-10">
            <h2 className="font-display text-3xl md:text-4xl text-donot-verde">
              Elige tu cajita.
            </h2>
            <p className="text-donot-muted mt-2 max-w-xl">
              Cuatro tamaños, premium o azucaradas. Las azucaradas vuelven con
              el próximo drop.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {boxes.map((box) => (
              <BoxCard
                key={box.id}
                box={box}
                coverFlavorSlugs={coverFlavorSlugs}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
