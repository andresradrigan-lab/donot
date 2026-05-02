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

function shellHtml({
  preheader,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  appUrl,
  variant = 'verde',
}: {
  preheader: string
  heading: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  appUrl: string
  variant?: 'verde' | 'naranjo'
}): string {
  const headerBg = variant === 'naranjo' ? PALETTE.naranjo : PALETTE.verde
  const mascotaUrl = `${appUrl}/brand/mascota-crema-verde.png`
  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.crema};font-family:${FONT_FAMILY};color:${PALETTE.ink};">
  <span style="display:none;visibility:hidden;opacity:0;font-size:0;line-height:0;">${preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.crema};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:white;border-radius:24px;overflow:hidden;box-shadow:0 2px 8px rgba(0,83,65,0.08);">
          <tr>
            <td align="center" style="padding:32px 24px;background:${headerBg};">
              <img src="${mascotaUrl}" alt="donot." width="80" height="100" style="display:block;border:0;">
              <h1 style="margin:16px 0 0;color:${PALETTE.crema};font-size:24px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;">
                ${heading}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:${PALETTE.ink};font-size:16px;line-height:1.55;">
              ${body}
              ${
                ctaLabel && ctaUrl
                  ? `<div style="margin:24px 0 8px;text-align:center;">
                      <a href="${ctaUrl}" style="display:inline-block;background:${PALETTE.naranjo};color:white;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">${ctaLabel}</a>
                    </div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${PALETTE.crema};text-align:center;color:${PALETTE.muted};font-size:12px;">
              donot. · Concón–Reñaca · <a href="https://instagram.com/donot.cl" style="color:${PALETTE.muted};">@donot.cl</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface StatusEmailArgs {
  order: Order
  appUrl: string
}

export function orderPreparingHtml({ order, appUrl }: StatusEmailArgs): string {
  const trackingUrl = `${appUrl}/pedido/${order.publicToken}`
  return shellHtml({
    appUrl,
    preheader: 'Tus donitas se están preparando',
    heading: 'Tus donitas se están preparando.',
    body: `
      <p>Hola ${order.customerName.split(' ')[0]}, ya estamos en la cocina con tu pedido <strong>${order.orderNumber}</strong>.</p>
      <p>Salen del horno justo a tiempo para tu ${order.deliveryMethod === 'DELIVERY' ? 'despacho' : 'retiro'}.</p>
    `,
    ctaLabel: 'Ver mi pedido',
    ctaUrl: trackingUrl,
  })
}

export function orderInTransitHtml({ order, appUrl }: StatusEmailArgs): string {
  const trackingUrl = `${appUrl}/pedido/${order.publicToken}`
  const isDelivery = order.deliveryMethod === 'DELIVERY'
  return shellHtml({
    appUrl,
    preheader: isDelivery ? 'Tus donitas van en camino' : 'Tu cajita está lista para retirar',
    heading: isDelivery ? 'Tus donitas van en camino.' : 'Tu cajita está lista.',
    body: isDelivery
      ? `<p>Hola ${order.customerName.split(' ')[0]}, salimos con tu pedido <strong>${order.orderNumber}</strong> hacia ${order.deliveryCommune ?? 'tu dirección'}.</p>
         <p>Mantén el teléfono cerca por si necesitamos confirmar contigo.</p>`
      : `<p>Hola ${order.customerName.split(' ')[0]}, tu pedido <strong>${order.orderNumber}</strong> está listo para retirar.</p>
         <p>Pásate cuando puedas dentro de la franja agendada.</p>`,
    ctaLabel: 'Ver mi pedido',
    ctaUrl: trackingUrl,
  })
}

export function orderDeliveredHtml({ order, appUrl }: StatusEmailArgs): string {
  return shellHtml({
    appUrl,
    preheader: 'Llegaron tus donitas',
    heading: 'Llegaron tus donitas — cuéntanos qué tal.',
    body: `
      <p>Hola ${order.customerName.split(' ')[0]}, esperamos que las hayas disfrutado.</p>
      <p>Si te animas, contáctanos por <a href="https://instagram.com/donot.cl" style="color:${PALETTE.verde};font-weight:600;">@donot.cl</a> y cuéntanos qué tal o etiquétanos en una historia. Vamos leyendo todo.</p>
    `,
  })
}

export function orderCancelledHtml({ order, appUrl }: StatusEmailArgs): string {
  return shellHtml({
    appUrl,
    variant: 'naranjo',
    preheader: 'Sobre tu pedido en donot.',
    heading: 'Sobre tu pedido en donot.',
    body: `
      <p>Hola ${order.customerName.split(' ')[0]}, tu pedido <strong>${order.orderNumber}</strong> fue cancelado.</p>
      <p>Si pagaste, te devolvemos el dinero por el mismo medio en los próximos días hábiles. Si tienes dudas, respóndenos este correo.</p>
    `,
  })
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
