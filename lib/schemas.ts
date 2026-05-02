import { z } from 'zod'

export const cartItemSchema = z.object({
  lineId: z.string().min(1),
  boxSlug: z.string().min(1),
  boxName: z.string().min(1),
  boxPriceClp: z.number().int().nonnegative(),
  slotCount: z.number().int().positive(),
  flavors: z.record(z.string(), z.number().int().nonnegative()),
  flavorNames: z.record(z.string(), z.string()),
  quantity: z.number().int().positive(),
})

export const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'El carrito está vacío'),
})

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(40),
  cart: cartSchema,
})

export const cartValidateSchema = z.object({
  cart: cartSchema,
  couponCode: z.string().max(40).optional(),
  deliveryMethod: z.enum(['PICKUP_CONCON', 'PICKUP_RENACA', 'DELIVERY']),
  deliveryCommune: z.string().max(80).optional(),
})

export type CartItemInput = z.infer<typeof cartItemSchema>
export type CartInput = z.infer<typeof cartSchema>
