import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getNumberSetting } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [zones, freeThresholdClp, freeMinBoxes] = await Promise.all([
    prisma.coverageZone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    getNumberSetting('free_shipping_threshold_clp'),
    getNumberSetting('free_shipping_min_boxes'),
  ])

  return NextResponse.json({
    zones,
    freeShipping: {
      thresholdClp: freeThresholdClp,
      minBoxes: freeMinBoxes,
    },
  })
}
