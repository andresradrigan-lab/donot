import type { OrderItem } from '@prisma/client'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { orderConfirmationHtml } from '@/lib/email/templates'

interface FlavorLine {
  flavorSlug: string
  flavorName: string
  qty: number
}

/**
 * Decrementa el stock de cada sabor según los slots vendidos en cada caja.
 * Si algún sabor no tiene stock suficiente, lanza para que el caller decida
 * (ej. cancelar el pedido y reembolsar).
 */
export async function decrementStockForOrder(
  items: OrderItem[],
): Promise<void> {
  const totalsBySlug = new Map<string, number>()
  for (const it of items) {
    const flavors = (it.flavors as FlavorLine[] | null) ?? []
    for (const f of flavors) {
      const current = totalsBySlug.get(f.flavorSlug) ?? 0
      totalsBySlug.set(f.flavorSlug, current + f.qty * it.quantity)
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const [slug, qty] of totalsBySlug) {
      const flavor = await tx.flavor.findUnique({ where: { slug } })
      if (!flavor) {
        throw new Error(`Sabor ${slug} no existe`)
      }
      if (flavor.stock < qty) {
        throw new Error(`Stock insuficiente de ${flavor.name} (faltan ${qty - flavor.stock})`)
      }
      await tx.flavor.update({
        where: { id: flavor.id },
        data: { stock: flavor.stock - qty },
      })
    }
  })
}

/**
 * Marca la Order como PAID, decrementa stock, incrementa usesCount del cupón
 * si lo hay y dispara el email de confirmación. Idempotente: si ya está PAID
 * no hace nada.
 */
export async function markOrderPaid(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) throw new Error(`Order ${orderId} no encontrada`)
  if (order.status === 'PAID' || order.paidAt) return

  try {
    await decrementStockForOrder(order.items)
  } catch (err) {
    console.error('Stock insuficiente al confirmar pago:', err)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        cancelledAt: new Date(),
      },
    })
    return
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAID',
      paymentStatus: 'APPROVED',
      paidAt: new Date(),
    },
  })

  if (order.couponCode) {
    await prisma.coupon
      .update({
        where: { code: order.couponCode },
        data: { usesCount: { increment: 1 } },
      })
      .catch((err) => console.error('No pude incrementar uso del cupón:', err))
  }

  // Email de confirmación.
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const fresh = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true },
  })
  await sendEmail({
    to: order.customerEmail,
    subject: 'Listo. Tus donitas están reservadas.',
    html: orderConfirmationHtml({ order: fresh, appUrl }),
  })
}
