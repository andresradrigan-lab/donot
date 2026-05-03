import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { DroopAnalytics } from '@/components/store/DroopAnalytics'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const droop = await prisma.droop.findUnique({
    where: { code: params.slug },
  })
  if (!droop) return { title: 'Drop no encontrado · donot.' }
  return {
    title: `${droop.name} · donot.`,
    description: droop.tagline ?? droop.description ?? undefined,
  }
}

export default async function DroopPage({ params }: PageProps) {
  const droop = await prisma.droop.findFirst({
    where: { code: params.slug, isPublished: true, deletedAt: null },
    include: {
      flavors: {
        where: { isActive: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!droop) notFound()

  const boxes = await prisma.box.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <>
      <DroopAnalytics droopCode={droop.code} droopName={droop.name} />
      <section className="bg-donot-verde text-donot-crema">
        <div className="max-w-8xl mx-auto px-6 md:px-10 py-16 md:py-24 grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
          <div className="flex flex-col gap-5">
            <span className="inline-block self-start px-4 py-1.5 rounded-full bg-donot-rosado/30 text-donot-crema font-sans font-semibold text-sm">
              {droop.name.toUpperCase()}
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
              {droop.tagline ?? droop.name}
            </h1>
            {droop.description && (
              <p className="text-donot-crema/85 text-lg max-w-md">
                {droop.description}
              </p>
            )}
            <p className="text-donot-crema/70 text-sm">
              {droop.flavors.length} sabores disponibles ahora.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {boxes.length > 0 && (
                <Link href={`/caja/${boxes[0].slug}`}>
                  <Button size="lg">Empezar a armar mi cajita</Button>
                </Link>
              )}
            </div>
          </div>

          {droop.coverImage && (
            <div className="relative aspect-square max-w-md mx-auto md:ml-auto rounded-[3rem] overflow-hidden bg-donot-crema/10">
              <Image
                src={droop.coverImage}
                alt={droop.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 40vw"
              />
            </div>
          )}
        </div>
      </section>

      <section className="px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-8xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-donot-verde mb-2">
            Los 8 sabores
          </h2>
          <p className="text-donot-muted mb-10">
            Mezcla los que quieras dentro de tu cajita. Puedes repetir sabores.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {droop.flavors.map((flavor) => (
              <article
                key={flavor.id}
                className="bg-white rounded-3xl border border-donot-border shadow-soft overflow-hidden"
              >
                <div className="relative aspect-square bg-donot-rowAlt">
                  <Image
                    src={flavor.imageUrl}
                    alt={flavor.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col gap-2">
                  <h3 className="font-display text-2xl text-donot-verde">
                    {flavor.name}
                  </h3>
                  <p className="text-donot-ink/85 leading-relaxed">
                    {flavor.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
