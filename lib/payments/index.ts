import type { PaymentProvider as DbPaymentProvider } from '@prisma/client'
import type { PaymentProvider } from './types'
import { mercadoPagoProvider } from './mercadopago'

export function getProvider(name: DbPaymentProvider): PaymentProvider {
  switch (name) {
    case 'MERCADO_PAGO':
      return mercadoPagoProvider
    case 'TRANSBANK':
      throw new Error('Transbank aún no implementado (Sprint 5)')
    case 'KHIPU':
      throw new Error('Khipu aún no implementado (Sprint 5)')
  }
}

export type { PaymentProvider } from './types'
