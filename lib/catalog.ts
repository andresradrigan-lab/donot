import type { BoxCategory, Flavor, FlavorCategory } from '@prisma/client'
import { prisma } from '@/lib/db'

const BOX_TO_FLAVOR: Record<BoxCategory, FlavorCategory[]> = {
  PREMIUM: ['PREMIUM'],
  AZUCARADA: ['AZUCARADA'],
  MIX: ['PREMIUM', 'AZUCARADA'],
  COLAB: ['PREMIUM', 'AZUCARADA'],
}

export function weekdaysFromJson(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const out: number[] = []
  for (const v of value) {
    const n = Number(v)
    if (Number.isInteger(n) && n >= 0 && n <= 6) out.push(n)
  }
  return out
}

/**
 * Filtra los sabores que pueden ir en una caja según las reglas del SPEC §4.1:
 * - categoría compatible con la caja
 * - droop activo en este momento (starts_at <= now <= ends_at o null)
 * - is_active = true, stock > 0
 * - available_weekdays incluye el día actual
 *
 * MySQL/MariaDB no soporta operadores de array nativos (`has`, `contains`),
 * así que el filtro de weekday se hace en JS después de cargar los
 * candidatos. Para volúmenes esperados (8–30 sabores activos) es trivial.
 */
export async function getCompatibleFlavors(
  boxCategory: BoxCategory,
): Promise<Flavor[]> {
  const now = new Date()
  const weekday = now.getDay()
  const allowedFlavorCategories = BOX_TO_FLAVOR[boxCategory]

  const flavors = await prisma.flavor.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      category: { in: allowedFlavorCategories },
      stock: { gt: 0 },
      droop: {
        isPublished: true,
        deletedAt: null,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return flavors.filter((f) =>
    weekdaysFromJson(f.availableWeekdays).includes(weekday),
  )
}
