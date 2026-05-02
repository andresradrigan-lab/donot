import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth/api'
import { settingsSchema } from '@/lib/schemas-admin'
import { SECRET_KEYS, SETTING_KEYS, maskSecret } from '@/lib/settings-keys'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = requireAdminApi('VIEWER')
  if (guard.res) return guard.res

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Array.from(SETTING_KEYS) } },
  })

  const settings: Record<string, string> = {}
  const secretsHasValue: Record<string, boolean> = {}
  const secretsMasked: Record<string, string> = {}

  for (const r of rows) {
    if (SECRET_KEYS.has(r.key)) {
      // Nunca devolver el valor real de secrets en GET; solo "tiene valor" + máscara.
      secretsHasValue[r.key] = !!r.value
      if (r.value) secretsMasked[r.key] = maskSecret(r.value)
    } else {
      settings[r.key] = r.value
    }
  }

  return NextResponse.json({ settings, secretsHasValue, secretsMasked })
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

  const updates = Object.entries(payload).filter(([k]) => SETTING_KEYS.has(k))

  // Para secrets: ignorar valores vacíos para que "no tocar" no borre el secret;
  // si el admin quiere borrar, debe enviar el sentinel "__clear__".
  const filtered = updates.filter(([k, v]) => {
    if (!SECRET_KEYS.has(k)) return true
    if (v === '__clear__') return true
    return v !== ''
  })

  await prisma.$transaction(
    filtered.map(([key, value]) => {
      const finalValue = value === '__clear__' ? '' : value
      return prisma.siteSetting.upsert({
        where: { key },
        update: { value: finalValue },
        create: { key, value: finalValue },
      })
    }),
  )

  return NextResponse.json({ ok: true, updated: filtered.length })
}
