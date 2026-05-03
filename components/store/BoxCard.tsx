import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
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
  const slugs = coverFlavorSlugs.slice(0, 4)
  const isPremium = box.category === 'PREMIUM'

  return (
    <article
      className={cn(
        'group relative bg-white rounded-[2rem] border border-donot-border overflow-hidden transition-all duration-300',
        inactive
          ? 'shadow-soft opacity-90'
          : 'shadow-soft hover:shadow-pop hover:-translate-y-1',
      )}
    >
      {/* Cover mosaico de sabores */}
      <div className="relative aspect-square bg-donot-rowAlt overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          {slugs.map((slug, idx) => (
            <div key={`${slug}-${idx}`} className="relative overflow-hidden">
              <Image
                src={`/menu/${slug}.png`}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={cn(
                  'object-cover transition-transform duration-500',
                  !inactive && 'group-hover:scale-110',
                )}
              />
            </div>
          ))}
          {slugs.length === 0 && (
            <div className="col-span-2 row-span-2 relative bg-donot-crema">
              <Image
                src="/brand/mascota-crema-verde.png"
                alt=""
                fill
                className="object-contain p-10"
              />
            </div>
          )}
        </div>

        {/* Gradiente desde abajo para legibilidad de tags */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
        />

        {/* Badge de slots */}
        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-donot-crema/95 backdrop-blur text-donot-verde text-xs font-bold tracking-wide shadow-soft">
          <span className="font-display italic text-base leading-none">{box.slotCount}</span>
          <span className="uppercase">donas</span>
        </div>

        {/* Categoría tag */}
        {!inactive && (
          <div
            className={cn(
              'absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] shadow-soft',
              isPremium
                ? 'bg-donot-verde text-donot-crema'
                : 'bg-donot-rosado text-donot-crema',
            )}
          >
            {isPremium ? 'Premium' : 'Azucaradas'}
          </div>
        )}

        {inactive && (
          <div className="absolute inset-0 bg-donot-crema/85 backdrop-blur-sm flex items-center justify-center">
            <span className="font-display italic text-2xl text-donot-verde rotate-[-6deg] px-5 py-2 bg-donot-rosado/30 rounded-full shadow-soft">
              Próximamente
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl text-donot-verde leading-tight">
            {box.name.replace('Cajita ', '')}
          </h3>
          <span className="font-sans font-bold text-lg text-donot-naranjo whitespace-nowrap">
            {formatClp(box.priceClp)}
          </span>
        </div>

        <p className="text-donot-muted text-sm leading-snug">
          Elige y combina hasta <strong className="text-donot-ink">{box.slotCount} sabores</strong>.
        </p>

        {inactive ? (
          <button
            disabled
            className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-donot-border/50 text-donot-muted font-semibold cursor-not-allowed text-sm"
          >
            Próximamente
          </button>
        ) : (
          <Link
            href={`/caja/${box.slug}`}
            className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-donot-naranjo text-white font-bold text-sm hover:bg-donot-naranjo/90 transition group/btn"
          >
            Armar mi cajita
            <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        )}
      </div>
    </article>
  )
}
