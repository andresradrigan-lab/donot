import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()

  const droops = await prisma.droop.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      flavors: {
        where: { isActive: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return NextResponse.json({ droops })
}
