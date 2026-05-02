/**
 * Tipos y helpers del carrito local del comprador.
 * Persistido en localStorage bajo la clave `donot:cart`.
 * En MVP no hay carrito server-side: la BD recibe el snapshot al hacer checkout.
 */

export const CART_STORAGE_KEY = 'donot:cart'

export interface CartItem {
  /** uuid local generado en el cliente para identificar la línea */
  lineId: string
  boxSlug: string
  boxName: string
  boxPriceClp: number
  slotCount: number
  /** flavorSlug → cantidad. La suma de cantidades debe ser igual a slotCount. */
  flavors: Record<string, number>
  /** flavorSlug → nombre oficial (snapshot, para mostrar en carrito sin re-fetch) */
  flavorNames: Record<string, string>
  /** Cuántas cajas iguales lleva. Default 1. */
  quantity: number
}

export interface Cart {
  items: CartItem[]
}

export function emptyCart(): Cart {
  return { items: [] }
}

export function readCart(): Cart {
  if (typeof window === 'undefined') return emptyCart()
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return emptyCart()
    const parsed = JSON.parse(raw) as Cart
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart()
    return parsed
  } catch {
    return emptyCart()
  }
}

export function writeCart(cart: Cart): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  window.dispatchEvent(new CustomEvent('donot:cart-updated'))
}

export function addItem(item: CartItem): Cart {
  const cart = readCart()
  cart.items.push(item)
  writeCart(cart)
  return cart
}

export function updateQuantity(lineId: string, quantity: number): Cart {
  const cart = readCart()
  const next: Cart = {
    items: cart.items
      .map((it) =>
        it.lineId === lineId ? { ...it, quantity: Math.max(1, quantity) } : it,
      ),
  }
  writeCart(next)
  return next
}

export function removeItem(lineId: string): Cart {
  const cart = readCart()
  const next: Cart = {
    items: cart.items.filter((it) => it.lineId !== lineId),
  }
  writeCart(next)
  return next
}

export function totalSlotsSelected(flavors: Record<string, number>): number {
  return Object.values(flavors).reduce((sum, n) => sum + n, 0)
}

const IN_PROGRESS_PREFIX = 'donot:in-progress:'

export function readInProgress(boxSlug: string): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(IN_PROGRESS_PREFIX + boxSlug)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function writeInProgress(
  boxSlug: string,
  selection: Record<string, number>,
): void {
  if (typeof window === 'undefined') return
  if (Object.keys(selection).length === 0) {
    window.localStorage.removeItem(IN_PROGRESS_PREFIX + boxSlug)
    return
  }
  window.localStorage.setItem(
    IN_PROGRESS_PREFIX + boxSlug,
    JSON.stringify(selection),
  )
}

export function clearInProgress(boxSlug: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(IN_PROGRESS_PREFIX + boxSlug)
}
