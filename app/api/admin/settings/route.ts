import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { settingsSchema } from '@/lib/schemas-admin'
import { SETTING_KEYS } from '@/lib/settings-keys'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Array.from(SETTING_KEYS) } },
  })
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.key] = r.value

  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const guard = requireAdminApi('OWNER')
  if (guard.res) return guard.res

  let payload
  try {
    payload = settingsSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ ok: false, reason: 'Datos inválidos' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  // Solo aceptar keys whitelisted; ignorar el resto silenciosamente.
  const updates = Object.entries(payload).filter(([k]) => SETTING_KEYS.has(k))

  await prisma.$transaction(
    updates.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  )

  return NextResponse.json({ ok: true, updated: updates.length })
}
