import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const order = await prisma.order.findUnique({
    where: { publicToken: params.token },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      customerName: true,
      deliveryMethod: true,
      deliveryCommune: true,
      deliveryDate: true,
      deliveryTimeSlot: true,
      subtotalClp: true,
      discountClp: true,
      shippingClp: true,
      totalClp: true,
      paidAt: true,
      preparingAt: true,
      inTransitAt: true,
      deliveredAt: true,
      cancelledAt: true,
      createdAt: true,
      items: {
        select: {
          boxNameSnapshot: true,
          quantity: true,
          flavors: true,
          lineTotalClp: true,
        },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
