/**
 * Cálculos puros de totales del carrito.
 * No tocan BD ni dependen de Prisma — fáciles de testear.
 */

import type { Coupon, CoverageZone } from '@prisma/client'
import type { CartInput, CartItemInput } from '@/lib/schemas'

export function lineTotal(item: CartItemInput): number {
  return item.boxPriceClp * item.quantity
}

export function subtotal(cart: CartInput): number {
  return cart.items.reduce((sum, it) => sum + lineTotal(it), 0)
}

export function totalBoxCount(cart: CartInput): number {
  return cart.items.reduce((sum, it) => sum + it.quantity, 0)
}

export interface CouponEvaluation {
  ok: boolean
  reason?: string
  discountClp: number
  freeShipping: boolean
}

/**
 * Evalúa un cupón contra el carrito. No reduce stock ni incrementa usesCount —
 * eso pasa cuando el pago se confirma.
 */
export function evaluateCoupon(
  coupon: Coupon,
  cart: CartInput,
  now: Date = new Date(),
): CouponEvaluation {
  if (!coupon.isActive) {
    return { ok: false, reason: 'Cupón inactivo', discountClp: 0, freeShipping: false }
  }
  if (coupon.validFrom > now) {
    return { ok: false, reason: 'Cupón aún no vigente', discountClp: 0, freeShipping: false }
  }
  if (coupon.validTo && coupon.validTo < now) {
    return { ok: false, reason: 'Cupón vencido', discountClp: 0, freeShipping: false }
  }
  if (coupon.maxUses != null && coupon.usesCount >= coupon.maxUses) {
    return { ok: false, reason: 'Cupón sin usos disponibles', discountClp: 0, freeShipping: false }
  }

  const sub = subtotal(cart)
  if (coupon.minOrderClp != null && sub < coupon.minOrderClp) {
    return {
      ok: false,
      reason: `Necesitas un pedido mínimo de $${coupon.minOrderClp.toLocaleString('es-CL')}`,
      discountClp: 0,
      freeShipping: false,
    }
  }

  switch (coupon.type) {
    case 'PERCENTAGE':
      return {
        ok: true,
        discountClp: Math.floor((sub * coupon.value) / 100),
        freeShipping: false,
      }
    case 'FIXED_AMOUNT':
      return {
        ok: true,
        discountClp: Math.min(coupon.value, sub),
        freeShipping: false,
      }
    case 'FREE_SHIPPING':
      return { ok: true, discountClp: 0, freeShipping: true }
  }
}

export interface ShippingInput {
  cart: CartInput
  deliveryMethod: 'PICKUP_CONCON' | 'PICKUP_RENACA' | 'DELIVERY'
  zone?: CoverageZone | null
  globalFreeThresholdClp?: number | null
  globalFreeMinBoxes?: number | null
  freeShippingByCoupon?: boolean
}

/**
 * Calcula el cobro de envío.
 * - PICKUP_* → siempre 0
 * - DELIVERY sin zone → null (la UI debe pedir comuna)
 * - DELIVERY con zone → tarifa, salvo que el subtotal o cantidad de cajas
 *   superen el umbral global o el específico de la comuna, o haya cupón
 *   FREE_SHIPPING activo.
 */
export function calcShipping(input: ShippingInput): number | null {
  const {
    cart,
    deliveryMethod,
    zone,
    globalFreeThresholdClp,
    globalFreeMinBoxes,
    freeShippingByCoupon,
  } = input

  if (deliveryMethod !== 'DELIVERY') return 0
  if (!zone) return null
  if (freeShippingByCoupon) return 0

  const sub = subtotal(cart)
  const boxes = totalBoxCount(cart)

  const thresholdClp =
    zone.freeShippingThresholdClp ?? globalFreeThresholdClp ?? null
  const minBoxes = zone.freeShippingMinBoxes ?? globalFreeMinBoxes ?? null

  if (thresholdClp != null && sub >= thresholdClp) return 0
  if (minBoxes != null && boxes >= minBoxes) return 0

  return zone.shippingClp
}

export interface Totals {
  subtotalClp: number
  discountClp: number
  shippingClp: number | null
  totalClp: number | null
  boxCount: number
}

export function calcTotals(args: {
  cart: CartInput
  coupon?: CouponEvaluation
  shipping: number | null
}): Totals {
  const sub = subtotal(args.cart)
  const discount = args.coupon?.ok ? args.coupon.discountClp : 0
  const shipping = args.shipping
  const total = shipping == null ? null : sub - discount + shipping
  return {
    subtotalClp: sub,
    discountClp: discount,
    shippingClp: shipping,
    totalClp: total,
    boxCount: totalBoxCount(args.cart),
  }
}
