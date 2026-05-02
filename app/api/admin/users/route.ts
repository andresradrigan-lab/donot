import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { adminUserCreateSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = adminUserCreateSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const exists = await prisma.adminUser.findUnique({ where: { email: payload.email } })
  if (exists) {
    return NextResponse.json({ ok: false, reason: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(payload.password, 12)
  const user = await prisma.adminUser.create({
    data: {
      email: payload.email.toLowerCase(),
      name: payload.name,
      role: payload.role,
      isActive: payload.isActive,
      passwordHash,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json({ ok: true, user })
}
