/**
 * Cliente del dataLayer. Cada función push acepta un payload tipado y lo
 * deja en window.dataLayer para que GTM lo lea y reenvíe a GA4 / Meta Pixel.
 *
 * Si GTM no está configurado (falta NEXT_PUBLIC_GTM_ID), los pushes son
 * inofensivos: window.dataLayer queda en memoria pero nada lo consume.
 */

type Currency = 'CLP'

interface ItemRef {
  item_id: string
  item_name: string
  price: number
  quantity?: number
  item_category?: string
}

interface CartView {
  currency: Currency
  value: number
  items: ItemRef[]
}

interface PurchasePayload {
  currency: Currency
  value: number
  transaction_id: string
  coupon?: string
  shipping?: number
  items: ItemRef[]
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

function push(event: string, payload: object = {}): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event, ...(payload as Record<string, unknown>) })
}

export const analytics = {
  droopView(droopCode: string, droopName: string) {
    push('droop_view', { droop_code: droopCode, droop_name: droopName })
  },
  viewItem(item: ItemRef) {
    push('view_item', { currency: 'CLP', value: item.price, items: [item] })
  },
  selectItem(item: ItemRef) {
    push('select_item', { items: [item] })
  },
  addToCart(item: CartView) {
    push('add_to_cart', item)
  },
  viewCart(cart: CartView) {
    push('view_cart', cart)
  },
  beginCheckout(cart: CartView) {
    push('begin_checkout', cart)
  },
  addPaymentInfo(args: { payment_type: string; value: number }) {
    push('add_payment_info', { currency: 'CLP', ...args })
  },
  couponApplied(args: { code: string; type: string; discount_clp: number }) {
    push('coupon_applied', args)
  },
  purchase(payload: PurchasePayload) {
    push('purchase', payload)
  },
}

export type { CartView, ItemRef, PurchasePayload }
