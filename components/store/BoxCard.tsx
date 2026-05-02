import Link from 'next/link'
import Image from 'next/image'
import type { Box } from '@prisma/client'
import { cn } from '@/lib/utils'
import { formatClp } from '@/lib/format'

interface Props {
  box: Box
  /** Sabores representativos del Droop activo para componer mosaico de cover */
  coverFlavorSlugs?: string[]
}

export function BoxCard({ box, coverFlavorSlugs = [] }: Props) {
  const inactive = !box.isActive
  const slugs = coverFlavorSlugs.slice(0, box.slotCount === 6 ? 4 : 4)

  return (
    <article
      className={cn(
        'group relative bg-white rounded-3xl border border-donot-border overflow-hidden transition shadow-soft',
        !inactive && 'hover:shadow-pop',
      )}
    >
      <div className="relative aspect-square bg-donot-rowAlt grid grid-cols-2">
        {slugs.map((slug, idx) => (
          <div key={`${slug}-${idx}`} className="relative">
            <Image
              src={`/menu/${slug}.png`}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ))}
        {slugs.length === 0 && (
          <div className="col-span-2 row-span-2 relative">
            <Image
              src="/brand/mascota-crema-verde.png"
              alt=""
              fill
              className="object-contain p-12"
            />
          </div>
        )}

        {inactive && (
          <div className="absolute inset-0 bg-donot-crema/85 backdrop-blur-sm flex items-center justify-center">
            <span className="font-display text-2xl text-donot-verde rotate-[-6deg] px-5 py-2 bg-donot-rosado/30 rounded-full">
              Próximamente
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl text-donot-verde">{box.name}</h3>
          <span className="font-display text-xl text-donot-naranjo whitespace-nowrap">
            {formatClp(box.priceClp)}
          </span>
        </div>
        <p className="text-donot-muted text-sm">
          {box.slotCount} donas · elige los sabores
        </p>

        {inactive ? (
          <button
            disabled
            className="mt-3 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-donot-border/50 text-donot-muted font-sans font-semibold cursor-not-allowed"
          >
            Próximamente
          </button>
        ) : (
          <Link
            href={`/caja/${box.slug}`}
            className="mt-3 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-donot-naranjo text-white font-display hover:bg-donot-naranjo/90 transition"
          >
            Elegir
          </Link>
        )}
      </div>
    </article>
  )
}
