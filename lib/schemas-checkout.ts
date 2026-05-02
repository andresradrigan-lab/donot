import { z } from 'zod'
import { cartSchema } from '@/lib/schemas'

export const checkoutSchema = z.object({
  cart: cartSchema,
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(160),
    phone: z.string().min(6).max(40),
  }),
  delivery: z.object({
    method: z.enum(['PICKUP_CONCON', 'PICKUP_RENACA', 'DELIVERY']),
    address: z.string().max(240).optional(),
    commune: z.string().max(80).optional(),
    notes: z.string().max(500).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    timeSlot: z.string().min(1).max(20),
  }),
  couponCode: z.string().max(40).optional(),
  paymentProvider: z.enum(['MERCADO_PAGO', 'TRANSBANK', 'KHIPU']),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
