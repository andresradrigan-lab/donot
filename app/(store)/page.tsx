import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Clock, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { BoxCard } from '@/components/store/BoxCard'
import { InstagramFeed } from '@/components/store/InstagramFeed'

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
      {/* ===== HERO ===== */}
      <section className="relative px-6 md:px-10 pt-12 md:pt-20 pb-20 md:pb-28 overflow-hidden">
        {/* Decoraciones de fondo */}
        <div
          aria-hidden
          className="absolute -top-24 -left-32 w-96 h-96 rounded-full bg-donot-rosado/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute top-1/2 -right-40 w-[28rem] h-[28rem] rounded-full bg-donot-azulPastel/30 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-8xl mx-auto grid gap-10 md:gap-16 md:grid-cols-[1.05fr_1fr] items-center">
          <div className="flex flex-col items-start gap-6">
            {droop && (
              <Link
                href={`/droop/${droop.code}`}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-donot-rosado/15 hover:bg-donot-rosado/25 text-donot-verde font-sans font-semibold text-sm transition"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-donot-rosado animate-pulse" />
                {droop.name.toUpperCase()} · {droop.tagline}
                <span className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-1 transition-all">→</span>
              </Link>
            )}

            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] text-donot-verde leading-[0.92] tracking-[-0.02em]">
              Donas que no<br />
              <span className="italic font-medium text-donot-naranjo">deberían</span> existir.
            </h1>

            <p className="text-donot-muted text-lg md:text-xl max-w-md leading-relaxed">
              Boutique donutería en Concón–Reñaca. 8 sabores hechos a mano, en
              cajas curadas. Pedís, las cocinamos, llegan calientes.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {droop && (
                <Link href={`/droop/${droop.code}`}>
                  <Button size="lg">Ver el drop activo →</Button>
                </Link>
              )}
              <Link href="/sobre-nosotros">
                <Button variant="secondary" size="lg">
                  Conócenos
                </Button>
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-4 text-sm text-donot-muted">
              <span className="inline-flex items-center gap-2">
                <Sparkles size={16} className="text-donot-naranjo" />
                Hechas a mano
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={16} className="text-donot-naranjo" />
                Mismo día
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-donot-naranjo" />
                Concón–Reñaca
              </span>
            </div>
          </div>

          {/* Hero photo with layered cards */}
          <div className="relative">
            <div className="relative aspect-[4/5] max-w-md mx-auto md:mx-0 md:ml-auto">
              <div
                aria-hidden
                className="absolute inset-0 rounded-[3rem] bg-donot-azulPastel/60 -rotate-3 translate-x-3 translate-y-3"
              />
              <div
                aria-hidden
                className="absolute inset-0 rounded-[3rem] bg-donot-rosado/30 rotate-3 -translate-x-2"
              />
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-pop">
                <Image
                  src="/email/hero-cajas.jpg"
                  alt="Cajita donot. con donas premium"
                  fill
                  priority
                  sizes="(max-width: 768px) 80vw, 40vw"
                  className="object-cover"
                />
              </div>

              {/* Mascota flotante */}
              <div className="absolute -bottom-6 -left-6 md:-left-10 w-24 md:w-32 animate-float-slow">
                <Image
                  src="/brand/mascota-azul-naranjo.png"
                  alt=""
                  width={150}
                  height={188}
                  className="w-full h-auto drop-shadow-lg"
                />
              </div>

              {/* Tag rosado */}
              <div className="absolute -top-4 right-4 md:-right-6 bg-donot-rosado text-donot-crema rounded-full px-5 py-2 font-display italic text-lg shadow-lg rotate-6">
                ¡recién horneadas!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ¿QUÉ ES UN DROP? ===== */}
      <section className="px-6 md:px-10 py-16 md:py-20 bg-donot-crema">
        <div className="max-w-8xl mx-auto">
          <div className="bg-donot-verde rounded-[2.5rem] p-8 md:p-14 text-donot-crema relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-donot-rosado/20 blur-3xl pointer-events-none"
            />

            <div className="relative grid gap-10 md:grid-cols-[1fr_auto] items-center">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-donot-crema/15 text-donot-crema text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  ¿Cómo funciona?
                </span>
                <h2 className="font-display text-3xl md:text-5xl leading-[1.05] mb-4">
                  Un <span className="italic text-donot-rosado">drop</span>{' '}
                  es una colección<br className="hidden md:block" /> limitada de sabores.
                </h2>
                <p className="text-donot-crema/85 text-lg leading-relaxed">
                  Cada cierto tiempo lanzamos un drop nuevo: 8 sabores curados que
                  conviven solo unas semanas. Cuando se acaban, vuelven los favoritos
                  o llegan otros recién diseñados. <em className="text-donot-rosado">No te quedes con las ganas.</em>
                </p>
                {droop && (
                  <Link href={`/droop/${droop.code}`} className="inline-block mt-6">
                    <Button size="lg" variant="secondary">
                      Ver {droop.name} →
                    </Button>
                  </Link>
                )}
              </div>

              <div className="hidden md:block">
                <div className="relative w-56 h-56">
                  <div className="absolute inset-0 rounded-full bg-donot-rosado/30 animate-float-slow" />
                  <div className="absolute inset-4 rounded-full bg-donot-naranjo/40 animate-float-rev" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display italic text-7xl text-donot-crema">
                      {droop?.code?.split('_')[1] ?? '001'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ELIGE TU CAJITA ===== */}
      <section className="relative px-6 md:px-10 py-16 md:py-24">
        <div
          aria-hidden
          className="absolute top-32 -left-24 w-72 h-72 rounded-full bg-donot-rosado/15 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-8xl mx-auto">
          <div className="mb-12 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-donot-naranjo/15 text-donot-naranjo text-xs font-bold uppercase tracking-[0.2em] mb-4">
              Cajitas
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-donot-verde leading-[1.05] mb-3">
              Elige tu <span className="italic text-donot-naranjo">cajita</span>.
            </h2>
            <p className="text-donot-muted text-lg leading-relaxed">
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

      <InstagramFeed />
    </>
  )
}
