import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/db'
import { cartValidateSchema } from '@/lib/schemas'
import { calcShipping, calcTotals, evaluateCoupon } from '@/lib/totals'
import { getNumberSetting } from '@/lib/settings'
import { getCompatibleFlavors } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

interface ValidationIssue {
  lineId: string
  message: string
}

export async function POST(request: Request) {
  let payload
  try {
    payload = cartValidateSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'Datos inválidos', issues: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, reason: 'Body inválido' },
      { status: 400 },
    )
  }

  const { cart, couponCode, deliveryMethod, deliveryCommune } = payload

  // 1) Validar cada línea contra catálogo actual.
  const issues: ValidationIssue[] = []
  for (const line of cart.items) {
    const box = await prisma.box.findFirst({
      where: { slug: line.boxSlug, deletedAt: null, isActive: true },
    })
    if (!box) {
      issues.push({ lineId: line.lineId, message: `La caja ${line.boxName} ya no está disponible` })
      continue
    }
    if (box.priceClp !== line.boxPriceClp) {
      issues.push({
        lineId: line.lineId,
        message: `El precio de ${line.boxName} cambió. Actualiza la cajita.`,
      })
    }
    if (box.slotCount !== line.slotCount) {
      issues.push({
        lineId: line.lineId,
        message: `Esta cajita ahora trae ${box.slotCount} donas, no ${line.slotCount}`,
      })
      continue
    }

    const totalSlots = Object.values(line.flavors).reduce((s, n) => s + n, 0)
    if (totalSlots !== box.slotCount) {
      issues.push({
        lineId: line.lineId,
        message: `Tienes ${totalSlots}/${box.slotCount} sabores en ${line.boxName}`,
      })
    }

    const compatible = await getCompatibleFlavors(box.category)
    const compatibleSlugs = new Set(compatible.map((f) => f.slug))
    for (const slug of Object.keys(line.flavors)) {
      if (!compatibleSlugs.has(slug)) {
        issues.push({
          lineId: line.lineId,
          message: `El sabor "${line.flavorNames[slug] ?? slug}" no está disponible hoy`,
        })
      }
    }
  }

  // 2) Cupón opcional.
  let couponEval
  let appliedCoupon
  if (couponCode) {
    const code = couponCode.trim().toUpperCase()
    const coupon = await prisma.coupon.findFirst({
      where: { code, isActive: true },
    })
    if (!coupon) {
      issues.push({ lineId: '__coupon__', message: 'Ese código no anda' })
    } else {
      couponEval = evaluateCoupon(coupon, cart)
      if (!couponEval.ok && couponEval.reason) {
        issues.push({ lineId: '__coupon__', message: couponEval.reason })
      } else {
        appliedCoupon = { code: coupon.code, type: coupon.type }
      }
    }
  }

  // 3) Cobertura.
  let zone = null
  if (deliveryMethod === 'DELIVERY') {
    if (!deliveryCommune) {
      issues.push({ lineId: '__delivery__', message: 'Indica tu comuna' })
    } else {
      zone = await prisma.coverageZone.findFirst({
        where: { commune: deliveryCommune, isActive: true },
      })
      if (!zone) {
        issues.push({
          lineId: '__delivery__',
          message: 'Por ahora no llegamos a tu comuna. Pero sí puedes pasar a buscarlas.',
        })
      }
    }
  }

  // 4) Totales.
  const [globalThreshold, globalMinBoxes] = await Promise.all([
    getNumberSetting('free_shipping_threshold_clp'),
    getNumberSetting('free_shipping_min_boxes'),
  ])

  const shipping = calcShipping({
    cart,
    deliveryMethod,
    zone,
    globalFreeThresholdClp: globalThreshold,
    globalFreeMinBoxes: globalMinBoxes,
    freeShippingByCoupon: !!couponEval?.freeShipping,
  })

  const totals = calcTotals({ cart, coupon: couponEval, shipping })

  return NextResponse.json({
    ok: issues.length === 0,
    issues,
    coupon: appliedCoupon,
    couponEval,
    zone,
    totals,
  })
}
