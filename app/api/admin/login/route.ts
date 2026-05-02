import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z, ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  let payload
  try {
    payload = loginSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'Datos inválidos' },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const email = payload.email.toLowerCase().trim()
  const user = await prisma.adminUser.findUnique({ where: { email } })

  // Mismo mensaje para "user no existe" y "password incorrecta" para no
  // filtrar qué emails tienen cuenta.
  if (!user || !user.isActive) {
    return NextResponse.json(
      { ok: false, reason: 'Credenciales inválidas' },
      { status: 401 },
    )
  }

  const valid = await bcrypt.compare(payload.password, user.passwordHash)
  if (!valid) {
    return NextResponse.json(
      { ok: false, reason: 'Credenciales inválidas' },
      { status: 401 },
    )
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  setSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name, role: user.role },
  })
}
