import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { adminUserUpdateSchema } from '@/lib/schemas-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = adminUserUpdateSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const data: Record<string, unknown> = {
    name: payload.name,
    role: payload.role,
    isActive: payload.isActive,
  }
  if (payload.password) {
    data.passwordHash = await bcrypt.hash(payload.password, 12)
  }

  const user = await prisma.adminUser.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })

  return NextResponse.json({ ok: true, user })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  // Bloquear self-delete: el OWNER actual no puede desactivarse a sí mismo
  // (queda al menos uno con acceso). Comparamos contra la sesión.
  if (guard.admin.sub === params.id) {
    return NextResponse.json({ ok: false, reason: 'No puedes desactivar tu propia cuenta' }, { status: 422 })
  }

  await prisma.adminUser.update({
    where: { id: params.id },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
