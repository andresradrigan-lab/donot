import { prisma } from '@/lib/db'

/**
 * Genera un número de pedido tipo "DN-2026-0042" usando el contador
 * de pedidos del año actual + 1. Para MVP es suficiente; si los volúmenes
 * crecen y aparecen colisiones por concurrencia, migrar a una secuencia
 * Postgres dedicada.
 */
export async function nextOrderNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year + 1, 0, 1)

  const count = await prisma.order.count({
    where: { createdAt: { gte: yearStart, lt: yearEnd } },
  })

  const seq = (count + 1).toString().padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}
