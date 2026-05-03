import { prisma } from '@/lib/db'
import { GalleryGrid } from '@/components/store/GalleryLightbox'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Galería · donot.',
  description:
    'Fotos de donas, del local y de la cocina de donot. en Concón–Reñaca.',
}

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      imageUrl: true,
      caption: true,
      alt: true,
    },
  })

  return (
    <section className="px-6 md:px-10 py-12 md:py-16 max-w-8xl mx-auto">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-3">
          Lo que pasa por la cocina.
        </h1>
        <p className="text-donot-muted text-lg">
          Donas, momentos del local y la gente que las hace posible.
        </p>
      </header>
      <GalleryGrid images={images} />
    </section>
  )
}
