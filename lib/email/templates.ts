import type { Order, OrderItem } from '@prisma/client'

const PALETTE = {
  verde: '#005341',
  crema: '#FFF2E8',
  naranjo: '#F36F4E',
  rosado: '#FF70C0',
  ink: '#1F1F1F',
  muted: '#5C6E68',
  border: '#DDD3C8',
}

const FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

function clp(n: number): string {
  return `$${n.toLocaleString('es-CL')}`
}

interface OrderConfirmationArgs {
  order: Order & { items: OrderItem[] }
  appUrl: string
}

export function orderConfirmationHtml({
  order,
  appUrl,
}: OrderConfirmationArgs): string {
  const trackingUrl = `${appUrl}/pedido/${order.publicToken}`
  const mascotaUrl = `${appUrl}/brand/mascota-crema-verde.png`

  const itemRows = order.items
    .map((it) => {
      const flavors = (it.flavors as Array<{ flavorName: string; qty: number }> | null) ?? []
      const flavorList = flavors
        .map((f) => `${f.qty} × ${f.flavorName}`)
        .join(' · ')
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${PALETTE.border};">
            <div style="font-weight:600;color:${PALETTE.verde};font-size:16px;">
              ${it.boxNameSnapshot}${it.quantity > 1 ? ` × ${it.quantity}` : ''}
            </div>
            <div style="color:${PALETTE.muted};font-size:13px;margin-top:4px;">
              ${flavorList || '—'}
            </div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${PALETTE.border};text-align:right;color:${PALETTE.ink};white-space:nowrap;">
            ${clp(it.lineTotalClp)}
          </td>
        </tr>`
    })
    .join('')

  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Listo. Tus donitas están reservadas.</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.crema};font-family:${FONT_FAMILY};color:${PALETTE.ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.crema};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:white;border-radius:24px;overflow:hidden;box-shadow:0 2px 8px rgba(0,83,65,0.08);">
          <tr>
            <td align="center" style="padding:32px 24px 0;background:${PALETTE.verde};">
              <img src="${mascotaUrl}" alt="donot." width="80" height="100" style="display:block;border:0;">
              <h1 style="margin:16px 0 0;color:${PALETTE.crema};font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Listo. Tus donitas están reservadas.
              </h1>
              <p style="margin:8px 0 24px;color:rgba(255,242,232,0.85);font-size:15px;">
                Pedido <strong>${order.orderNumber}</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:${PALETTE.ink};font-size:16px;line-height:1.5;">
                Hola ${order.customerName.split(' ')[0]}, recibimos tu pago. Estamos preparando tu cajita con el mismo cuidado de siempre.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
                ${itemRows}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="color:${PALETTE.muted};padding:6px 0;">Subtotal</td>
                  <td style="text-align:right;padding:6px 0;">${clp(order.subtotalClp)}</td>
                </tr>
                ${order.discountClp > 0 ? `
                <tr>
                  <td style="color:${PALETTE.naranjo};padding:6px 0;">Descuento</td>
                  <td style="text-align:right;padding:6px 0;color:${PALETTE.naranjo};">−${clp(order.discountClp)}</td>
                </tr>` : ''}
                <tr>
                  <td style="color:${PALETTE.muted};padding:6px 0;">Envío</td>
                  <td style="text-align:right;padding:6px 0;">${order.shippingClp === 0 ? 'Por la casa' : clp(order.shippingClp)}</td>
                </tr>
                <tr>
                  <td style="font-weight:700;color:${PALETTE.verde};padding:12px 0 0;border-top:1px solid ${PALETTE.border};font-size:18px;">Total</td>
                  <td style="text-align:right;font-weight:700;color:${PALETTE.verde};padding:12px 0 0;border-top:1px solid ${PALETTE.border};font-size:18px;">${clp(order.totalClp)}</td>
                </tr>
              </table>

              <div style="margin:28px 0 12px;text-align:center;">
                <a href="${trackingUrl}"
                   style="display:inline-block;background:${PALETTE.naranjo};color:white;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">
                  Seguir mi pedido
                </a>
              </div>

              <p style="margin:24px 0 0;color:${PALETTE.muted};font-size:13px;line-height:1.5;text-align:center;">
                ¿Algo no cuadra? Respóndenos este mail o escríbenos por Instagram <a href="https://instagram.com/donot.cl" style="color:${PALETTE.verde};">@donot.cl</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background:${PALETTE.crema};text-align:center;color:${PALETTE.muted};font-size:12px;">
              donot. · Concón–Reñaca, V Región
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
