import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db'
import { checkoutSchema } from '@/lib/schemas-checkout'
import { calcShipping, calcTotals, evaluateCoupon } from '@/lib/totals'
import { getNumberSetting, getStringSetting } from '@/lib/settings'
import { getCompatibleFlavors } from '@/lib/catalog'
import { nextOrderNumber } from '@/lib/order-numbers'
import { getProvider } from '@/lib/payments'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let payload
  try {
    payload = checkoutSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'Datos inválidos', issues: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: false, reason: 'Body inválido' }, { status: 400 })
  }

  const { cart, customer, delivery, couponCode, paymentProvider } = payload

  // 1) Re-validar cada línea contra el catálogo actual.
  for (const line of cart.items) {
    const box = await prisma.box.findFirst({
      where: { slug: line.boxSlug, deletedAt: null, isActive: true },
    })
    if (!box) {
      return NextResponse.json({
        ok: false,
        reason: `La caja ${line.boxName} ya no está disponible`,
      }, { status: 422 })
    }
    if (box.priceClp !== line.boxPriceClp || box.slotCount !== line.slotCount) {
      return NextResponse.json({
        ok: false,
        reason: 'Hubo un cambio en el catálogo. Revisa tu cajita.',
      }, { status: 422 })
    }
    const totalSlots = Object.values(line.flavors).reduce((s, n) => s + n, 0)
    if (totalSlots !== box.slotCount) {
      return NextResponse.json({
        ok: false,
        reason: `${box.name}: tienes ${totalSlots}/${box.slotCount} sabores`,
      }, { status: 422 })
    }
    const compat = await getCompatibleFlavors(box.category)
    const compatSlugs = new Set(compat.map((f) => f.slug))
    for (const slug of Object.keys(line.flavors)) {
      if (!compatSlugs.has(slug)) {
        return NextResponse.json({
          ok: false,
          reason: `El sabor "${line.flavorNames[slug] ?? slug}" no está disponible hoy`,
        }, { status: 422 })
      }
    }
  }

  // 2) Cupón.
  let coupon = null
  let couponEval
  if (couponCode) {
    const code = couponCode.trim().toUpperCase()
    coupon = await prisma.coupon.findFirst({ where: { code, isActive: true } })
    if (!coupon) {
      return NextResponse.json({ ok: false, reason: 'Cupón inválido' }, { status: 422 })
    }
    couponEval = evaluateCoupon(coupon, cart)
    if (!couponEval.ok) {
      return NextResponse.json({ ok: false, reason: couponEval.reason }, { status: 422 })
    }
  }

  // 3) Cobertura.
  let zone = null
  if (delivery.method === 'DELIVERY') {
    if (!delivery.commune) {
      return NextResponse.json({ ok: false, reason: 'Indica tu comuna' }, { status: 422 })
    }
    zone = await prisma.coverageZone.findFirst({
      where: { commune: delivery.commune, isActive: true },
    })
    if (!zone) {
      return NextResponse.json({
        ok: false,
        reason: 'Por ahora no llegamos a tu comuna.',
      }, { status: 422 })
    }
    if (!delivery.address) {
      return NextResponse.json({ ok: false, reason: 'Indica tu dirección' }, { status: 422 })
    }
  }

  // 4) Totales.
  const [globalThreshold, globalMinBoxes] = await Promise.all([
    getNumberSetting('free_shipping_threshold_clp'),
    getNumberSetting('free_shipping_min_boxes'),
  ])
  const shipping = calcShipping({
    cart,
    deliveryMethod: delivery.method,
    zone,
    globalFreeThresholdClp: globalThreshold,
    globalFreeMinBoxes: globalMinBoxes,
    freeShippingByCoupon: !!couponEval?.freeShipping,
  })
  if (shipping == null) {
    return NextResponse.json({ ok: false, reason: 'No pudimos calcular tu envío.' }, { status: 422 })
  }
  const totals = calcTotals({ cart, coupon: couponEval, shipping })
  if (totals.totalClp == null) {
    return NextResponse.json({ ok: false, reason: 'Error al calcular el total.' }, { status: 422 })
  }

  // 5) Mapear cada línea del carrito a su Box (necesitamos boxId).
  const slugs = Array.from(new Set(cart.items.map((l) => l.boxSlug)))
  const boxes = await prisma.box.findMany({ where: { slug: { in: slugs } } })
  const boxBySlug = new Map(boxes.map((b) => [b.slug, b]))

  // 6) Crear Order + items en una transacción.
  const orderPrefix = (await getStringSetting('order_number_prefix')) ?? 'DN'
  const orderNumber = await nextOrderNumber(orderPrefix)
  const publicToken = randomUUID()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryMethod: delivery.method,
      deliveryAddress: delivery.address,
      deliveryCommune: delivery.commune,
      deliveryNotes: delivery.notes,
      deliveryDate: new Date(delivery.date + 'T00:00:00'),
      deliveryTimeSlot: delivery.timeSlot,
      subtotalClp: totals.subtotalClp,
      discountClp: totals.discountClp,
      shippingClp: totals.shippingClp ?? 0,
      totalClp: totals.totalClp ?? 0,
      couponCode: coupon?.code,
      paymentProvider,
      publicToken,
      items: {
        create: cart.items.map((line) => ({
          boxId: boxBySlug.get(line.boxSlug)!.id,
          boxNameSnapshot: line.boxName,
          boxPriceSnapshot: line.boxPriceClp,
          flavors: Object.entries(line.flavors).map(([slug, qty]) => ({
            flavorSlug: slug,
            flavorName: line.flavorNames[slug] ?? slug,
            qty,
          })),
          quantity: line.quantity,
          lineTotalClp: line.boxPriceClp * line.quantity,
        })),
      },
    },
    include: { items: true },
  })

  // 6) Crear preference en pasarela.
  const provider = getProvider(paymentProvider)
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  let txn
  try {
    txn = await provider.createTransaction({ order, appUrl })
  } catch (err) {
    console.error('createTransaction failed:', err)
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })
    return NextResponse.json({
      ok: false,
      reason: 'No pudimos iniciar el pago. Reintenta en un toque.',
    }, { status: 502 })
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentId: txn.paymentId },
  })

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    publicToken: order.publicToken,
    redirectUrl: txn.redirectUrl,
  })
}
