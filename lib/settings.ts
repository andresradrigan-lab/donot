import { prisma } from '@/lib/db'

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
