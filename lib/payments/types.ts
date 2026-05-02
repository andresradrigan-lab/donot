import type { Order, OrderItem, PaymentStatus } from '@prisma/client'

export interface CreateTransactionInput {
  order: Order & { items: OrderItem[] }
  appUrl: string
}

export interface CreateTransactionResult {
  paymentId: string
  redirectUrl: string
}

export interface PaymentProvider {
  name: 'MERCADO_PAGO' | 'TRANSBANK' | 'KHIPU'
  createTransaction(input: CreateTransactionInput): Promise<CreateTransactionResult>
  getStatus(paymentId: string): Promise<PaymentStatus>
}
