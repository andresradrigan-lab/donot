import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const boxes = await prisma.box.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ boxes })
}
