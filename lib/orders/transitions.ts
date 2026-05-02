import type { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import {
  orderPreparingHtml,
  orderInTransitHtml,
  orderDeliveredHtml,
  orderCancelledHtml,
} from '@/lib/email/templates'

/**
 * Transiciones permitidas para evitar saltos inválidos.
 * El estado PAID solo lo entrega el flujo de pago (markOrderPaid).
 */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

const SUBJECTS: Partial<Record<OrderStatus, string>> = {
  PREPARING: 'Tus donitas se están preparando',
  IN_TRANSIT: 'Tus donitas van en camino',
  DELIVERED: 'Llegaron tus donitas — cuéntanos qué tal',
  CANCELLED: 'Sobre tu pedido en donot',
}

const TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  PREPARING: 'preparingAt',
  IN_TRANSIT: 'inTransitAt',
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
}

export class TransitionError extends Error {
  status: number
  constructor(message: string, status = 422) {
    super(message)
    this.status = status
  }
}

export async function transitionOrder(
  orderId: string,
  next: OrderStatus,
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new TransitionError('Pedido no encontrado', 404)

  const allowed = ALLOWED[order.status] ?? []
  if (!allowed.includes(next)) {
    throw new TransitionError(
      `No se puede pasar de ${order.status} a ${next}`,
    )
  }

  const tsField = TIMESTAMP_FIELD[next]
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: next,
      ...(tsField ? { [tsField]: new Date() } : {}),
    },
  })

  // Email al cliente.
  const subject = SUBJECTS[next]
  if (!subject) return

  const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  let html: string
  switch (next) {
    case 'PREPARING':
      html = orderPreparingHtml({ order: fresh, appUrl })
      break
    case 'IN_TRANSIT':
      html = orderInTransitHtml({ order: fresh, appUrl })
      break
    case 'DELIVERED':
      html = orderDeliveredHtml({ order: fresh, appUrl })
      break
    case 'CANCELLED':
      html = orderCancelledHtml({ order: fresh, appUrl })
      break
    default:
      return
  }

  await sendEmail({ to: fresh.customerEmail, subject, html })
}
