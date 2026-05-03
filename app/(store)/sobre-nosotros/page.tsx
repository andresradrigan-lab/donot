import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Sobre nosotros · donot.',
  description:
    'donot. es una donutería boutique de Concón–Reñaca. Hacemos donas premium a mano, en cantidades chicas, todos los días.',
}

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative px-6 md:px-10 pt-12 md:pt-20 pb-16 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-donot-rosado/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-32 w-96 h-96 rounded-full bg-donot-azulPastel/30 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-8xl mx-auto grid gap-10 md:grid-cols-[1.1fr_1fr] items-center">
          <div className="flex flex-col gap-5">
            <span className="inline-block self-start px-3 py-1 rounded-full bg-donot-rosado/15 text-donot-rosado text-xs font-bold uppercase tracking-[0.2em]">
              Nuestra historia
            </span>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] text-donot-verde leading-[0.92] tracking-[-0.02em]">
              Esto empezó<br />por <span className="italic text-donot-naranjo">DM</span>.
            </h1>
            <p className="font-display italic text-2xl md:text-3xl text-donot-rosado leading-tight max-w-md">
              "Una donutería boutique sin reglas, en Concón–Reñaca."
            </p>
          </div>

          <div className="relative aspect-[4/5] max-w-md mx-auto md:ml-auto">
            <div
              aria-hidden
              className="absolute inset-0 rounded-[3rem] bg-donot-verde/10 -rotate-3 translate-x-3"
            />
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-pop">
              <Image
                src="/email/hero-mesa.jpg"
                alt="Cajita donot."
                fill
                priority
                sizes="(max-width: 768px) 80vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8 text-donot-ink leading-relaxed text-lg md:text-xl">
            <p className="first-letter:font-display first-letter:italic first-letter:text-7xl first-letter:text-donot-naranjo first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:mt-1">
              donot. nació vendiendo cajitas por Instagram, una a una, en Concón.
              Una idea simple: donas premium hechas a mano, sin pretensiones, en
              cantidades chicas para que cada una llegue como debe.
            </p>
            <p>
              Hoy abrimos local físico y armamos esta tienda. La idea sigue
              siendo la misma:{' '}
              <strong className="text-donot-verde">el drop sale, dura lo que dura</strong>{' '}
              y pasamos al siguiente. Nada de catálogo eterno.
            </p>
            <p className="font-display italic text-2xl text-donot-naranjo">
              Si quieres saber qué hay hoy, pásate por el{' '}
              <Link href="/droop/droop_001" className="underline decoration-2 underline-offset-4 hover:text-donot-rosado">
                drop activo
              </Link>
              .
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="bg-donot-verde/5 rounded-2xl p-5 border border-donot-border">
              <Sparkles className="text-donot-naranjo mb-3" size={28} />
              <h3 className="font-display text-xl text-donot-verde mb-1">A mano</h3>
              <p className="text-sm text-donot-muted">Cada dona es individual. Sin máquinas, sin atajos.</p>
            </div>
            <div className="bg-donot-rosado/10 rounded-2xl p-5 border border-donot-border">
              <Heart className="text-donot-rosado mb-3" size={28} />
              <h3 className="font-display text-xl text-donot-verde mb-1">En drops</h3>
              <p className="text-sm text-donot-muted">Colecciones limitadas. Los favoritos se rotan.</p>
            </div>
            <div className="bg-donot-azulPastel/30 rounded-2xl p-5 border border-donot-border">
              <MapPin className="text-donot-verde mb-3" size={28} />
              <h3 className="font-display text-xl text-donot-verde mb-1">Local</h3>
              <p className="text-sm text-donot-muted">Concón y Reñaca. Despacho en la V Región.</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Image
              src="/brand/mascota-crema-verde.png"
              alt="Mascota de donot."
              width={180}
              height={225}
              className="h-44 w-auto mx-auto mb-6"
            />
            <p className="font-display italic text-2xl text-donot-naranjo mb-6">
              ¿Probamos una?
            </p>
            <Link href="/droop/droop_001">
              <Button size="lg">Ver el drop activo →</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
