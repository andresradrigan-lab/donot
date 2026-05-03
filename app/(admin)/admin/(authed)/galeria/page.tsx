import { prisma } from '@/lib/db'
import { GalleryManager } from '@/components/admin/GalleryManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Galería · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminGalleryPage() {
  const images = await prisma.galleryImage.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Galería
        </h1>
        <p className="text-donot-muted">
          {images.length} fotos. Las despublicadas no aparecen en la web pública pero quedan guardadas.
        </p>
      </header>
      <GalleryManager images={images} />
    </section>
  )
}
