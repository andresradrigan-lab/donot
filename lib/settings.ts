import { prisma } from '@/lib/db'
import { PUBLIC_LAYOUT_KEYS, SETTING_KEYS } from '@/lib/settings-keys'

export async function getNumberSetting(
  key: string,
  fallback: number | null = null,
): Promise<number | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } })
  if (!row) return fallback
  const n = Number(row.value)
  return Number.isFinite(n) ? n : fallback
}

export async function getStringSetting(
  key: string,
  fallback: string | null = null,
): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } })
  return row?.value ?? fallback
}

/**
 * Devuelve un mapa con TODAS las settings whitelisted. Sirve para
 * /admin/config (que sí muestra todas) y para los handlers que necesitan
 * cargar varias claves en una sola consulta.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Array.from(SETTING_KEYS) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

/**
 * Solo las claves marcadas como `publicForLayout`. Las consume el layout
 * raíz para SEO + GTM/Pixel sin exponer secrets ni operación interna.
 */
export async function getPublicLayoutSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Array.from(PUBLIC_LAYOUT_KEYS) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}
