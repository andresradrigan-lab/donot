import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { getStringSetting } from '@/lib/settings'
import { prisma } from '@/lib/db'

/**
 * Sección "Síguenos en Instagram".
 *
 * Estrategia (sin Graph API por ahora):
 *   1. Si hay imágenes activas en GalleryImage de la BD, usamos las
 *      primeras 6 ordenadas por sortOrder. El cliente las sube desde
 *      /admin/galeria — eso es la "conexión simple" sin OAuth de Meta.
 *   2. Si la galería está vacía, fallback a fotos del local.
 *
 * Cuando se conecte Graph API real, se reemplaza la consulta por la
 * tabla InstagramPost sin tocar el resto del componente.
 */

const FALLBACK_TILES = [
  { src: '/photos/feed-2204.jpg', alt: 'donot. — local Concón' },
  { src: '/photos/feed-2218.jpg', alt: 'donot. — sesión donas' },
  { src: '/photos/feed-2237.jpg', alt: 'donot. — caja premium' },
  { src: '/photos/feed-2256.jpg', alt: 'donot. — detalle' },
  { src: '/photos/feed-2273.jpg', alt: 'donot. — sabor' },
  { src: '/photos/feed-2299.jpg', alt: 'donot. — producto' },
]

export async function InstagramFeed() {
  const handleRaw = await getStringSetting('contact_instagram', '@donot_cl')
  const handle = (handleRaw ?? '@donot_cl').replace(/^@/, '')
  const profileUrl = `https://www.instagram.com/${handle}/`

  // Primeras 6 imágenes activas de la galería (cargadas desde admin).
  let galleryTiles: Array<{ src: string; alt: string }> = []
  try {
    const images = await prisma.galleryImage.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      take: 6,
      select: { imageUrl: true, alt: true, caption: true },
    })
    galleryTiles = images.map((img) => ({
      src: img.imageUrl,
      alt: img.alt ?? img.caption ?? 'donot.',
    }))
  } catch {
    /* tabla no existe en algún ambiente — fallback */
  }

  const tiles = galleryTiles.length > 0 ? galleryTiles : FALLBACK_TILES

  return (
    <section className="relative px-6 md:px-10 py-16 md:py-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-donot-rosado/15 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-8xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-donot-rosado/15 text-donot-rosado text-xs font-bold uppercase tracking-[0.2em] mb-3">
              En vivo
            </span>
            <h2 className="font-display text-3xl md:text-5xl text-donot-verde leading-[1.05]">
              Síguenos en <span className="text-donot-rosado">Instagram</span>
            </h2>
            <p className="text-donot-muted mt-2 text-lg max-w-md">
              Lo último que sale de la cocina, en directo.
            </p>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-donot-verde text-donot-crema font-bold hover:bg-donot-verde/90 transition shadow-soft"
          >
            <Instagram size={18} />@{handle}
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {tiles.slice(0, 6).map((t, i) => (
            <a
              key={i}
              href={profileUrl}
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
              <div className="absolute inset-0 bg-donot-verde/0 group-hover:bg-donot-verde/40 transition flex items-center justify-center">
                <Instagram
                  size={28}
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
