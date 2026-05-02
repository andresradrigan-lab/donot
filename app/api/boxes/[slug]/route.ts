import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCompatibleFlavors } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const box = await prisma.box.findFirst({
    where: { slug: params.slug, deletedAt: null },
  })

  if (!box) {
    return NextResponse.json({ error: 'Box not found' }, { status: 404 })
  }

  const flavors = await getCompatibleFlavors(box.category)

  return NextResponse.json({ box, flavors })
}
