import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
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

  const droopNumber = droop.code.split('_')[1] ?? droop.code

  return (
    <>
      <DroopAnalytics droopCode={droop.code} droopName={droop.name} />

      {/* ===== HERO ===== */}
      <section className="relative bg-donot-verde text-donot-crema overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-donot-rosado/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-donot-naranjo/15 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-8xl mx-auto px-6 md:px-10 py-16 md:py-24 grid gap-12 md:grid-cols-[1.1fr_1fr] items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-donot-rosado text-donot-verde font-bold text-xs tracking-[0.2em] uppercase">
                Drop {droopNumber}
              </span>
              <span className="inline-flex items-center gap-1.5 text-donot-crema/80 text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-donot-rosado animate-pulse" />
                Activo ahora
              </span>
            </div>

            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em]">
              {droop.tagline ?? droop.name}
            </h1>

            {droop.description && (
              <p className="text-donot-crema/85 text-lg md:text-xl max-w-xl leading-relaxed">
                {droop.description}
              </p>
            )}

            <div className="flex items-center gap-4 pt-2 text-donot-crema/85">
              <Sparkles size={18} className="text-donot-rosado" />
              <span>
                <strong className="text-donot-crema">{droop.flavors.length} sabores</strong> disponibles ahora.
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              {boxes.length > 0 && (
                <Link href={`/caja/${boxes[0].slug}`}>
                  <Button size="lg">Empezar a armar mi cajita →</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="relative aspect-square max-w-md mx-auto md:ml-auto">
            <div
              aria-hidden
              className="absolute inset-0 rounded-[3rem] bg-donot-rosado/40 -rotate-3 translate-x-2"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-[3rem] bg-donot-naranjo/30 rotate-2 -translate-x-1"
            />
            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-pop bg-donot-crema/10">
              <Image
                src={droop.coverImage ?? '/email/hero-cajas.jpg'}
                alt={droop.name}
                fill
                priority
                sizes="(max-width: 768px) 80vw, 40vw"
                className="object-cover"
              />
            </div>

            {/* Drop number badge */}
            <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-donot-crema rounded-full w-24 h-24 md:w-28 md:h-28 grid place-items-center shadow-pop rotate-12">
              <div className="text-center">
                <div className="font-sans text-[10px] text-donot-muted tracking-widest">DROP</div>
                <div className="font-display italic text-3xl md:text-4xl text-donot-verde leading-none">
                  {droopNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SABORES ===== */}
      <section className="px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-8xl mx-auto">
          <div className="mb-12 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-donot-rosado/15 text-donot-rosado text-xs font-bold uppercase tracking-[0.2em] mb-4">
              Los {droop.flavors.length} sabores
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-donot-verde leading-[1.05] mb-3">
              Mezcla los que <span className="italic text-donot-naranjo">quieras</span>.
            </h2>
            <p className="text-donot-muted text-lg leading-relaxed">
              Dentro de tu cajita podés repetir sabores. Sin reglas, sin culpa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {droop.flavors.map((flavor, i) => (
              <article
                key={flavor.id}
                className="group bg-white rounded-[2rem] border border-donot-border shadow-soft hover:shadow-pop transition-all duration-300 overflow-hidden"
              >
                <div className="relative aspect-square bg-donot-rowAlt overflow-hidden">
                  <Image
                    src={flavor.imageUrl}
                    alt={flavor.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-donot-crema/95 backdrop-blur rounded-full w-9 h-9 grid place-items-center text-donot-verde font-display font-bold text-sm shadow-soft">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-2">
                  <h3 className="font-display text-2xl md:text-[1.7rem] text-donot-verde leading-tight">
                    {flavor.name}
                  </h3>
                  <p className="text-donot-ink/80 leading-relaxed">
                    {flavor.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* CTA bottom */}
          {boxes.length > 0 && (
            <div className="mt-16 md:mt-20 text-center">
              <p className="font-display italic text-2xl text-donot-naranjo mb-4">
                ¿Listo para armar la tuya?
              </p>
              <Link href={`/caja/${boxes[0].slug}`}>
                <Button size="lg">Elige tu cajita →</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
