import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCompatibleFlavors } from '@/lib/catalog'
import { FlavorPicker } from '@/components/store/FlavorPicker'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const box = await prisma.box.findFirst({
    where: { slug: params.slug, deletedAt: null },
  })
  if (!box) return { title: 'Caja no encontrada · donot.' }
  return {
    title: `${box.name} · donot.`,
    description: `Arma tu ${box.name.toLowerCase()} eligiendo entre los sabores del drop activo.`,
  }
}

export default async function BoxPage({ params }: PageProps) {
  const box = await prisma.box.findFirst({
    where: { slug: params.slug, deletedAt: null },
  })

  if (!box || !box.isActive) notFound()

  const flavors = await getCompatibleFlavors(box.category)

  return <FlavorPicker box={box} flavors={flavors} />
}
