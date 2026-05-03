'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryItem {
  id: string
  imageUrl: string
  caption: string | null
  alt: string | null
}

interface Props {
  images: GalleryItem[]
}

export function GalleryGrid({ images }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = openIdx !== null ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [openIdx])

  useEffect(() => {
    if (openIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIdx(null)
      if (e.key === 'ArrowRight') setOpenIdx((i) => (i === null ? null : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setOpenIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx, images.length])

  if (images.length === 0) {
    return (
      <p className="text-donot-muted text-center py-16">
        Pronto subimos las primeras fotos.
      </p>
    )
  }

  const current = openIdx !== null ? images[openIdx] : null

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-donot-rowAlt focus-visible:outline-2 focus-visible:outline-donot-naranjo"
            aria-label={img.caption ?? img.alt ?? `Foto ${i + 1}`}
          >
            <Image
              src={img.imageUrl}
              alt={img.alt ?? ''}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition group-hover:scale-105"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
                <p className="text-white text-sm line-clamp-2">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {current !== null && openIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenIdx(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length))
            }}
            aria-label="Anterior"
            className={cn(
              'absolute left-4 md:left-8 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition',
            )}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenIdx((i) => (i === null ? null : (i + 1) % images.length))
            }}
            aria-label="Siguiente"
            className="absolute right-4 md:right-8 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronRight size={24} />
          </button>
          <button
            type="button"
            onClick={() => setOpenIdx(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={20} />
          </button>

          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/3] md:aspect-[16/10]">
              <Image
                src={current.imageUrl}
                alt={current.alt ?? ''}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
            {current.caption && (
              <p className="mt-4 text-white text-center max-w-2xl">
                {current.caption}
              </p>
            )}
            <p className="mt-2 text-white/60 text-sm">
              {openIdx + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
