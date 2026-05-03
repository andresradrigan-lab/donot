import type { Order, OrderItem } from '@prisma/client'

const PALETTE = {
  verde: '#005341',
  verdeDark: '#003D30',
  crema: '#FFF2E8',
  cremaDark: '#F5E5D5',
  naranjo: '#F36F4E',
  naranjoDark: '#D8553A',
  rosado: '#FF70C0',
  rosadoSoft: '#FFD9EE',
  ink: '#1F1F1F',
  inkSoft: '#3D3D3D',
  muted: '#6B7670',
  border: '#E8DDD0',
  white: '#FFFFFF',
}

// Stack tipográfico:
// 1) Manrope (Google Fonts) — display moderno y limpio. Apple Mail, Gmail
//    iOS y Outlook 365 lo cargan. Outlook clásico/Yahoo caen al stack
//    nativo, que es igualmente legible.
// 2) System sans para body — siempre rinde igual sin warm-up de webfont.
const FONT_DISPLAY =
  '"Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif'
const FONT_BODY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif'
const FONT_ACCENT =
  '"Fraunces", Georgia, "Times New Roman", serif'

const FONT_IMPORT = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Fraunces:ital,wght@1,500&display=swap" rel="stylesheet">`

function clp(n: number): string {
  return `$${n.toLocaleString('es-CL')}`
}

function firstName(full: string): string {
  return (full ?? '').trim().split(/\s+/)[0] ?? ''
}

function flavorThumb(appUrl: string, slug: string): string {
  return `${appUrl}/menu/${slug}.png`
}

interface ShellArgs {
  appUrl: string
  preheader: string
  hero?: { image: string; alt: string }
  logoVariant?: 'crema' | 'naranjo' | 'rosado' | 'verde'
  headerBg?: string
  badge?: { label: string; bg: string; color: string }
  heading: string
  subheading?: string
  body: string
  cta?: { label: string; url: string; bg?: string }
  accentColor?: string
}

function shellHtml({
  appUrl,
  preheader,
  hero,
  logoVariant = 'crema',
  headerBg = PALETTE.verde,
  badge,
  heading,
  subheading,
  body,
  cta,
  accentColor = PALETTE.naranjo,
}: ShellArgs): string {
  const logoUrl = `${appUrl}/brand/do-not-${logoVariant}-horizontal.png`
  const heroBlock = hero
    ? `<tr>
         <td style="padding:0;line-height:0;font-size:0;">
           <img src="${hero.image}" alt="${hero.alt}" width="600"
                style="display:block;width:100%;max-width:600px;height:auto;border:0;">
         </td>
       </tr>`
    : ''

  const badgeBlock = badge
    ? `<div style="display:inline-block;background:${badge.bg};color:${badge.color};padding:6px 14px;border-radius:9999px;font-family:${FONT_DISPLAY};font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">
         ${badge.label}
       </div>`
    : ''

  const subheadingBlock = subheading
    ? `<p style="margin:0 0 4px;font-family:${FONT_ACCENT};font-style:italic;color:${accentColor};font-size:18px;line-height:1.3;">${subheading}</p>`
    : ''

  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 8px;">
         <tr>
           <td align="center" bgcolor="${cta.bg ?? accentColor}" style="border-radius:9999px;">
             <a href="${cta.url}" style="display:inline-block;padding:16px 36px;font-family:${FONT_DISPLAY};font-weight:800;font-size:15px;color:${PALETTE.white};text-decoration:none;letter-spacing:0.3px;border-radius:9999px;">
               ${cta.label} →
             </a>
           </td>
         </tr>
       </table>`
    : ''

  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${heading}</title>
  ${FONT_IMPORT}
</head>
<body style="margin:0;padding:0;background:${PALETTE.crema};font-family:${FONT_BODY};color:${PALETTE.ink};-webkit-font-smoothing:antialiased;">
  <span style="display:none;visibility:hidden;opacity:0;font-size:0;line-height:0;color:${PALETTE.crema};">${preheader}</span>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.crema};padding:32px 16px 48px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${PALETTE.white};border-radius:28px;overflow:hidden;box-shadow:0 8px 24px rgba(0,83,65,0.08);">
          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding:28px 24px 18px;background:${headerBg};">
              <img src="${logoUrl}" alt="donot." width="180" height="auto" style="display:block;border:0;max-width:180px;height:auto;">
            </td>
          </tr>

          ${heroBlock}

          <!-- Heading block -->
          <tr>
            <td style="padding:38px 36px 8px;text-align:center;">
              ${badgeBlock}
              ${subheadingBlock}
              <h1 style="margin:0;font-family:${FONT_DISPLAY};font-weight:800;font-size:30px;line-height:1.15;letter-spacing:-0.6px;color:${PALETTE.verde};">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:18px 36px 8px;font-family:${FONT_BODY};color:${PALETTE.inkSoft};font-size:16px;line-height:1.6;">
              ${body}
              ${ctaBlock}
            </td>
          </tr>

          <!-- Decorative divider -->
          <tr>
            <td style="padding:24px 36px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td height="1" style="background:${PALETTE.border};line-height:1px;font-size:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px 36px;text-align:center;font-family:${FONT_BODY};color:${PALETTE.muted};font-size:13px;line-height:1.6;">
              <p style="margin:0 0 6px;font-family:${FONT_DISPLAY};font-weight:700;color:${PALETTE.verde};font-size:14px;letter-spacing:0.5px;">
                donot.
              </p>
              <p style="margin:0 0 12px;">Donas que no deberían existir · Concón–Reñaca</p>
              <p style="margin:0;">
                <a href="https://instagram.com/donot.cl" style="color:${accentColor};text-decoration:none;font-weight:600;">@donot.cl</a>
                <span style="color:${PALETTE.border};margin:0 8px;">·</span>
                <a href="mailto:hola@donot.cl" style="color:${accentColor};text-decoration:none;font-weight:600;">hola@donot.cl</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Outside footer -->
        <p style="margin:24px auto 0;max-width:480px;font-family:${FONT_BODY};color:${PALETTE.muted};font-size:11px;line-height:1.5;text-align:center;">
          Recibiste este correo porque hiciste un pedido en donot.cl. <br>
          Si tienes dudas, simplemente responde este mensaje.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
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

  const itemRows = order.items
    .map((it) => {
      const flavors = (it.flavors as Array<{
        flavorSlug: string
        flavorName: string
        qty: number
      }> | null) ?? []

      const thumbs = flavors
        .slice(0, 6)
        .map(
          (f) => `
            <td style="padding:0 4px 0 0;vertical-align:top;width:48px;">
              <img src="${flavorThumb(appUrl, f.flavorSlug)}"
                   alt="${f.flavorName}"
                   width="48" height="48"
                   style="display:block;border-radius:12px;border:2px solid ${PALETTE.cremaDark};background:${PALETTE.crema};">
            </td>`,
        )
        .join('')

      const flavorList = flavors
        .map((f) => `${f.qty}× ${f.flavorName}`)
        .join(' · ')

      return `
        <tr>
          <td style="padding:14px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.crema};border-radius:18px;padding:0;">
              <tr>
                <td style="padding:18px 20px;">
                  <div style="font-family:${FONT_DISPLAY};font-weight:800;color:${PALETTE.verde};font-size:17px;letter-spacing:-0.2px;">
                    ${it.boxNameSnapshot}${it.quantity > 1 ? ` × ${it.quantity}` : ''}
                  </div>
                  <div style="margin-top:4px;color:${PALETTE.muted};font-size:13px;line-height:1.45;">
                    ${flavorList || '—'}
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                    <tr>${thumbs}</tr>
                  </table>
                  <div style="margin-top:14px;font-family:${FONT_DISPLAY};font-weight:700;color:${PALETTE.naranjo};font-size:15px;text-align:right;">
                    ${clp(it.lineTotalClp)}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join('')

  const totalsRows = `
    <tr>
      <td style="padding:6px 0;color:${PALETTE.muted};font-size:14px;">Subtotal</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;">${clp(order.subtotalClp)}</td>
    </tr>
    ${
      order.discountClp > 0
        ? `<tr>
             <td style="padding:6px 0;color:${PALETTE.naranjo};font-size:14px;font-weight:700;">Descuento ${order.couponCode ? `· ${order.couponCode}` : ''}</td>
             <td style="padding:6px 0;text-align:right;color:${PALETTE.naranjo};font-size:14px;font-weight:700;">−${clp(order.discountClp)}</td>
           </tr>`
        : ''
    }
    <tr>
      <td style="padding:6px 0;color:${PALETTE.muted};font-size:14px;">Envío</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;">${
        order.shippingClp === 0
          ? '<span style="color:' + PALETTE.naranjo + ';font-weight:700;">Por la casa</span>'
          : clp(order.shippingClp)
      }</td>
    </tr>
    <tr>
      <td style="padding:14px 0 0;border-top:2px dashed ${PALETTE.border};font-family:${FONT_DISPLAY};font-weight:800;font-size:18px;color:${PALETTE.verde};">Total</td>
      <td style="padding:14px 0 0;border-top:2px dashed ${PALETTE.border};text-align:right;font-family:${FONT_DISPLAY};font-weight:800;font-size:20px;color:${PALETTE.verde};">${clp(order.totalClp)}</td>
    </tr>`

  const isDelivery = order.deliveryMethod === 'DELIVERY'
  const deliveryInfo = isDelivery
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background:${PALETTE.rosadoSoft};border-radius:18px;padding:0;">
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-family:${FONT_DISPLAY};font-weight:800;color:${PALETTE.verde};font-size:13px;letter-spacing:1px;text-transform:uppercase;">📍 Despacho</div>
            <div style="margin-top:6px;color:${PALETTE.ink};font-size:15px;line-height:1.5;">${order.deliveryAddress ?? '—'}</div>
            <div style="color:${PALETTE.muted};font-size:13px;margin-top:2px;">${order.deliveryCommune ?? ''}</div>
            ${order.deliveryDate ? `<div style="margin-top:8px;font-size:13px;color:${PALETTE.verde};font-weight:700;">${new Date(order.deliveryDate).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}${order.deliveryTimeSlot ? ` · ${order.deliveryTimeSlot}` : ''}</div>` : ''}
          </td>
        </tr>
      </table>`
    : `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background:${PALETTE.rosadoSoft};border-radius:18px;padding:0;">
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-family:${FONT_DISPLAY};font-weight:800;color:${PALETTE.verde};font-size:13px;letter-spacing:1px;text-transform:uppercase;">📦 Retiro en ${order.deliveryMethod === 'PICKUP_CONCON' ? 'Concón' : 'Reñaca'}</div>
            ${order.deliveryDate ? `<div style="margin-top:8px;font-size:14px;color:${PALETTE.ink};">${new Date(order.deliveryDate).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}${order.deliveryTimeSlot ? ` · ${order.deliveryTimeSlot}` : ''}</div>` : ''}
          </td>
        </tr>
      </table>`

  const body = `
    <p style="margin:0 0 16px;text-align:center;">
      Hola <strong>${firstName(order.customerName)}</strong>, recibimos tu pago.<br>
      Estamos preparando tu cajita con el mismo cuidado de siempre.
    </p>

    <div style="margin:8px 0 4px;text-align:center;font-family:${FONT_DISPLAY};font-weight:700;color:${PALETTE.muted};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">
      Pedido #${order.orderNumber}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;">
      ${itemRows}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0;">
      ${totalsRows}
    </table>

    ${deliveryInfo}
  `

  return shellHtml({
    appUrl,
    preheader: `Pedido ${order.orderNumber} confirmado · ${clp(order.totalClp)}`,
    hero: { image: `${appUrl}/email/hero-cajas.jpg`, alt: 'Cajita donot.' },
    logoVariant: 'crema',
    headerBg: PALETTE.verde,
    badge: { label: 'Pago confirmado', bg: PALETTE.rosadoSoft, color: PALETTE.verde },
    subheading: 'Listo, ya es nuestro asunto.',
    heading: 'Tus donitas<br>están reservadas.',
    body,
    cta: { label: 'Seguir mi pedido', url: trackingUrl, bg: PALETTE.naranjo },
    accentColor: PALETTE.naranjo,
  })
}

interface StatusEmailArgs {
  order: Order
  appUrl: string
}

export function orderPreparingHtml({
  order,
  appUrl,
}: StatusEmailArgs): string {
  const trackingUrl = `${appUrl}/pedido/${order.publicToken}`
  return shellHtml({
    appUrl,
    preheader: 'Tus donitas están en la cocina',
    hero: { image: `${appUrl}/email/hero-mesa.jpg`, alt: 'Cajita donot. en preparación' },
    logoVariant: 'crema',
    headerBg: PALETTE.verde,
    badge: { label: 'En cocina', bg: PALETTE.cremaDark, color: PALETTE.verde },
    subheading: 'Manos a la masa.',
    heading: 'Estamos<br>preparándolas.',
    body: `
      <p style="margin:0 0 14px;text-align:center;">
        Hola <strong>${firstName(order.customerName)}</strong>, ya estamos en la cocina con tu pedido <strong>${order.orderNumber}</strong>.
      </p>
      <p style="margin:0;text-align:center;color:${PALETTE.muted};">
        Salen del horno justo a tiempo para tu ${order.deliveryMethod === 'DELIVERY' ? 'despacho' : 'retiro'}.
      </p>
    `,
    cta: { label: 'Ver mi pedido', url: trackingUrl, bg: PALETTE.naranjo },
    accentColor: PALETTE.naranjo,
  })
}

export function orderInTransitHtml({
  order,
  appUrl,
}: StatusEmailArgs): string {
  const trackingUrl = `${appUrl}/pedido/${order.publicToken}`
  const isDelivery = order.deliveryMethod === 'DELIVERY'

  return shellHtml({
    appUrl,
    preheader: isDelivery
      ? 'Tus donitas van en camino'
      : 'Tu cajita está lista para retirar',
    hero: { image: `${appUrl}/email/hero-mesa.jpg`, alt: 'Cajita donot. lista' },
    logoVariant: 'crema',
    headerBg: PALETTE.naranjo,
    badge: {
      label: isDelivery ? 'En ruta' : 'Lista',
      bg: PALETTE.cremaDark,
      color: PALETTE.naranjoDark,
    },
    subheading: isDelivery ? 'Vamos en camino.' : 'Te esperamos.',
    heading: isDelivery
      ? 'Tus donitas<br>van saliendo.'
      : 'Tu cajita<br>está esperando.',
    body: isDelivery
      ? `
        <p style="margin:0 0 14px;text-align:center;">
          Hola <strong>${firstName(order.customerName)}</strong>, salimos con tu pedido <strong>${order.orderNumber}</strong> hacia ${order.deliveryCommune ?? 'tu dirección'}.
        </p>
        <p style="margin:0;text-align:center;color:${PALETTE.muted};">
          Mantén el teléfono cerca por si necesitamos confirmar contigo.
        </p>
      `
      : `
        <p style="margin:0 0 14px;text-align:center;">
          Hola <strong>${firstName(order.customerName)}</strong>, tu pedido <strong>${order.orderNumber}</strong> está listo.
        </p>
        <p style="margin:0;text-align:center;color:${PALETTE.muted};">
          Pásate cuando puedas dentro de la franja agendada.
        </p>
      `,
    cta: { label: 'Ver mi pedido', url: trackingUrl, bg: PALETTE.verde },
    accentColor: PALETTE.naranjo,
  })
}

export function orderDeliveredHtml({
  order,
  appUrl,
}: StatusEmailArgs): string {
  return shellHtml({
    appUrl,
    preheader: 'Llegaron tus donitas — cuéntanos qué tal',
    hero: { image: `${appUrl}/email/hero-glaseada.jpg`, alt: 'Donut donot.' },
    logoVariant: 'crema',
    headerBg: PALETTE.verde,
    badge: { label: 'Entregado', bg: PALETTE.rosadoSoft, color: PALETTE.verde },
    subheading: 'Misión cumplida.',
    heading: 'Llegaron las<br>donitas.',
    body: `
      <p style="margin:0 0 16px;text-align:center;">
        Hola <strong>${firstName(order.customerName)}</strong>, esperamos que las hayas disfrutado tanto como nosotros disfrutamos haciéndolas.
      </p>
      <p style="margin:0 0 8px;text-align:center;color:${PALETTE.muted};">
        Si te animas, etiquétanos en una historia o cuéntanos qué tal en
        <a href="https://instagram.com/donot.cl" style="color:${PALETTE.naranjo};font-weight:700;text-decoration:none;">@donot.cl</a>.
      </p>
      <p style="margin:24px 0 0;text-align:center;">
        <span style="display:inline-block;background:${PALETTE.rosadoSoft};color:${PALETTE.verde};padding:10px 18px;border-radius:9999px;font-family:${FONT_ACCENT};font-style:italic;font-size:15px;">
          Cuídate. Vuelve pronto.
        </span>
      </p>
    `,
    accentColor: PALETTE.rosado,
  })
}

export function orderCancelledHtml({
  order,
  appUrl,
}: StatusEmailArgs): string {
  return shellHtml({
    appUrl,
    preheader: `Sobre tu pedido ${order.orderNumber}`,
    logoVariant: 'crema',
    headerBg: PALETTE.verdeDark,
    badge: { label: 'Cancelado', bg: PALETTE.cremaDark, color: PALETTE.verde },
    heading: 'Sobre tu<br>pedido en donot.',
    body: `
      <p style="margin:0 0 16px;text-align:center;">
        Hola <strong>${firstName(order.customerName)}</strong>, tu pedido
        <strong>${order.orderNumber}</strong> fue cancelado.
      </p>
      <p style="margin:0 0 8px;text-align:center;color:${PALETTE.muted};">
        Si pagaste, te devolvemos el dinero por el mismo medio en los próximos
        días hábiles.
      </p>
      <p style="margin:24px 0 0;text-align:center;">
        ¿Tienes dudas? Solo respóndenos este correo y lo conversamos.
      </p>
    `,
    accentColor: PALETTE.verde,
  })
}
