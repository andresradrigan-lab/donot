import Image from 'next/image'

export const metadata = {
  title: 'Sobre nosotros · donot.',
  description:
    'donot. es una donutería boutique de Concón–Reñaca. Hacemos donas premium a mano, en cantidades chicas, todos los días.',
}

export default function AboutPage() {
  return (
    <article className="px-6 md:px-10 py-16 md:py-24 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-8">
        Esto empezó por DM.
      </h1>

      <div className="space-y-6 text-donot-ink leading-relaxed text-lg">
        <p>
          donot. nació vendiendo cajitas por Instagram, una a una, en Concón.
          Una idea simple: donas premium hechas a mano, sin pretensiones, en
          cantidades chicas para que cada una llegue como debe.
        </p>
        <p>
          Hoy abrimos local físico y armamos esta tienda. La idea sigue siendo
          la misma: el Droop sale, dura lo que dura y pasamos al siguiente.
          Nada de catálogo eterno.
        </p>
        <p>
          Si quieres saber qué hay hoy, pásate por el{' '}
          <a
            href="/droop/droop_001"
            className="text-donot-naranjo font-semibold hover:underline"
          >
            drop activo
          </a>
          . Si quieres saber por qué hacemos esto, escríbenos por{' '}
          <a
            href="https://instagram.com/donot.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-donot-naranjo font-semibold hover:underline"
          >
            Instagram
          </a>
          .
        </p>
      </div>

      <div className="mt-12 flex justify-center">
        <Image
          src="/brand/mascota-crema-verde.png"
          alt="Mascota de donot."
          width={200}
          height={250}
          className="h-48 w-auto"
        />
      </div>

      <p className="text-donot-muted text-sm text-center mt-6">
        Texto provisional. La versión final la entrega Fernanda.
      </p>
    </article>
  )
}
