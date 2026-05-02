import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import type { PaymentStatus } from '@prisma/client'
import type {
  CreateTransactionInput,
  CreateTransactionResult,
  PaymentProvider,
} from './types'

function client(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado')
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } })
}

const STATUS_MAP: Record<string, PaymentStatus> = {
  approved: 'APPROVED',
  pending: 'PENDING',
  in_process: 'PENDING',
  authorized: 'PENDING',
  rejected: 'REJECTED',
  cancelled: 'REJECTED',
  refunded: 'REFUNDED',
  charged_back: 'REFUNDED',
}

export const mercadoPagoProvider: PaymentProvider = {
  name: 'MERCADO_PAGO',

  async createTransaction({
    order,
    appUrl,
  }: CreateTransactionInput): Promise<CreateTransactionResult> {
    const preference = new Preference(client())

    // MP solo acepta `auto_return` y `notification_url` con dominios
    // públicos. En localhost los omitimos: el comprador vuelve manualmente
    // con el link "Ir al sitio" de MP y el estado se confirma vía polling
    // en /checkout/exito (CheckoutSuccessRefresher).
    const isPublicUrl = /^https?:\/\/(?!localhost|127\.|0\.0\.0\.0)/.test(appUrl)

    const body = {
      items: order.items.map((it) => ({
        id: it.id,
        title: it.boxNameSnapshot,
        quantity: it.quantity,
        unit_price: it.boxPriceSnapshot,
        currency_id: 'CLP',
      })),
      external_reference: order.id,
      back_urls: {
        success: `${appUrl}/checkout/exito?token=${order.publicToken}`,
        failure: `${appUrl}/checkout/error?token=${order.publicToken}`,
        pending: `${appUrl}/checkout/exito?token=${order.publicToken}`,
      },
      ...(isPublicUrl
        ? {
            auto_return: 'approved' as const,
            notification_url: `${appUrl}/api/webhook/mercadopago`,
          }
        : {}),
      payment_methods: {
        installments: 1, // una sola cuota — política donot.
      },
      payer: {
        name: order.customerName,
        email: order.customerEmail,
      },
      statement_descriptor: 'donot.',
    }

    const created = await preference.create({ body })

    if (!created.id || !created.init_point) {
      throw new Error('Mercado Pago no devolvió preference válida')
    }

    return {
      paymentId: created.id,
      redirectUrl: created.init_point,
    }
  },

  async getStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = new Payment(client())
    const found = await payment.get({ id: paymentId })
    const status = found.status ?? 'pending'
    return STATUS_MAP[status] ?? 'PENDING'
  },
}
