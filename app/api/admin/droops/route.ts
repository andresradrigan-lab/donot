import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { droopSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const droops = await prisma.droop.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ droops })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = droopSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const droop = await prisma.droop.create({
    data: {
      code: payload.code,
      name: payload.name,
      tagline: payload.tagline ?? null,
      description: payload.description ?? null,
      coverImage: payload.coverImage ?? null,
      startsAt: new Date(payload.startsAt),
      endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      isPublished: payload.isPublished,
      sortOrder: payload.sortOrder,
    },
  })

  return NextResponse.json({ ok: true, droop })
}
