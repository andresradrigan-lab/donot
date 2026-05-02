import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

const HERO_FLAVORS = [
  { slug: 'tiramisu', name: 'Tiramisú' },
  { slug: 'cookies-and-cream', name: 'Cookies & Cream' },
  { slug: 'pie-de-manzana', name: 'Pie de Manzana' },
  { slug: 'crocanti', name: 'Crocanti' },
]

export default function HomePage() {
  return (
    <>
      <section className="relative px-6 md:px-10 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="max-w-8xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-donot-rosado/15 text-donot-verde font-sans font-semibold text-sm">
              Droop 001 · La primera carga
            </span>
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
              <Link href="/droop/droop_001">
                <Button size="lg">Ver el drop</Button>
              </Link>
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
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-donot-verde">
                Lo que está saliendo del horno
              </h2>
              <p className="text-donot-muted mt-2">
                Una probada del Droop 001. Hay 8 en total.
              </p>
            </div>
            <Link
              href="/droop/droop_001"
              className="hidden md:inline-flex text-donot-naranjo font-sans font-semibold hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {HERO_FLAVORS.map((f) => (
              <div
                key={f.slug}
                className="bg-white rounded-3xl border border-donot-border shadow-soft overflow-hidden"
              >
                <div className="relative aspect-square bg-donot-rowAlt">
                  <Image
                    src={`/menu/${f.slug}.png`}
                    alt={f.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="font-display text-donot-verde">{f.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="md:hidden mt-6 text-center">
            <Link
              href="/droop/droop_001"
              className="text-donot-naranjo font-sans font-semibold hover:underline"
            >
              Ver todos →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
