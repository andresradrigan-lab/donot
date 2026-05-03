import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { getStringSetting } from '@/lib/settings'
import { prisma } from '@/lib/db'

/**
 * Sección "Síguenos en Instagram" — versión simple sin Graph API.
 *
 * Muestra un grid 2×3 con la mascota de placeholder y un CTA al perfil
 * configurado en /admin/config (contact_instagram). Cuando se configure
 * la integración Graph API real, reemplazamos el contenido del grid por
 * los últimos posts cacheados en BD sin tocar el resto de la sección.
 *
 * Diseñado como server component: lee settings de BD una vez por render.
 */

// Mientras no haya integración con Instagram Graph API ni se carguen
// posts manualmente desde admin, mostramos fotos reales del local/producto
// (sesión 24 abril 2026). El cliente puede swappear estas fotos por las
// reales de su feed cuando se conecte la API.
const PLACEHOLDER_TILES = [
  { src: '/photos/feed-2204.jpg', alt: 'donot. — local Concón' },
  { src: '/photos/feed-2218.jpg', alt: 'donot. — sesión donas' },
  { src: '/photos/feed-2237.jpg', alt: 'donot. — caja premium' },
  { src: '/photos/feed-2256.jpg', alt: 'donot. — detalle' },
  { src: '/photos/feed-2273.jpg', alt: 'donot. — sabor' },
  { src: '/photos/feed-2299.jpg', alt: 'donot. — producto' },
]

interface InstagramPost {
  externalId: string
  caption: string | null
  imageUrl: string
  postUrl: string
  publishedAt: Date | null
}

export async function InstagramFeed() {
  const handleRaw = await getStringSetting('contact_instagram', '@donot_cl')
  const handle = (handleRaw ?? '@donot_cl').replace(/^@/, '')
  const profileUrl = `https://instagram.com/${handle}`

  // Si más adelante se popula la tabla InstagramPost con la Graph API,
  // mostramos esos posts; mientras, fallback a placeholders.
  let posts: InstagramPost[] = []
  try {
    posts = await prisma.$queryRaw<InstagramPost[]>`
      SELECT externalId, caption, imageUrl, postUrl, publishedAt
      FROM InstagramPost
      ORDER BY publishedAt DESC
      LIMIT 6
    `
  } catch {
    // Tabla no existe aún — usamos placeholders.
  }

  const tiles = posts.length > 0
    ? posts.map((p) => ({
        src: p.imageUrl,
        alt: p.caption ?? '',
        href: p.postUrl,
      }))
    : PLACEHOLDER_TILES.map((t) => ({ ...t, href: profileUrl }))

  return (
    <section className="px-6 md:px-10 py-16 md:py-20 bg-donot-rowAlt">
      <div className="max-w-8xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-donot-verde">
              Síguenos en Instagram
            </h2>
            <p className="text-donot-muted mt-2">
              Lo último que sale de la cocina, en directo.
            </p>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-donot-verde text-donot-crema font-display hover:bg-donot-verde/90 transition"
          >
            <Instagram size={18} />@{handle}
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {tiles.slice(0, 6).map((t, i) => (
            <a
              key={i}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden bg-white"
              aria-label={t.alt || `Post ${i + 1} en Instagram`}
            >
              <Image
                src={t.src}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-donot-verde/0 group-hover:bg-donot-verde/30 transition flex items-center justify-center">
                <Instagram
                  size={24}
                  className="text-white opacity-0 group-hover:opacity-100 transition"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
