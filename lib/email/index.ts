import { Resend } from 'resend'
import nodemailer, { type Transporter } from 'nodemailer'

interface SendArgs {
  to: string
  subject: string
  html: string
  replyTo?: string
}

type Transport = 'smtp' | 'resend' | 'stub'

function detectTransport(): Transport {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return 'smtp'
  }
  const k = process.env.RESEND_API_KEY
  if (k && k !== 're_PEGAR_AQUI' && k !== '') return 'resend'
  return 'stub'
}

function fromAddress(): string {
  const email =
    process.env.SMTP_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.SMTP_USER ??
    'hola@donot.cl'
  const name =
    process.env.SMTP_FROM_NAME ??
    process.env.RESEND_FROM_NAME ??
    'donot.'
  return `${name} <${email}>`
}

let resendCached: Resend | null = null
function resendClient(): Resend {
  if (!resendCached) resendCached = new Resend(process.env.RESEND_API_KEY!)
  return resendCached
}

let smtpCached: Transporter | null = null
function smtpClient(): Transporter {
  if (smtpCached) return smtpCached
  const port = Number(process.env.SMTP_PORT ?? 465)
  smtpCached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Hostinger a veces tiene cert auto-firmado en SMTP server-side,
    // pero el cert público es válido. Dejamos defaults.
  })
  return smtpCached
}

/**
 * Envía un email transaccional usando, en orden de prioridad:
 *   1. SMTP (Hostinger, Titan, Gmail, etc.) si SMTP_HOST está configurado
 *   2. Resend si RESEND_API_KEY está configurado
 *   3. Stub a consola (dev / no configurado)
 *
 * El admin puede swappear entre proveedores cambiando el .env y
 * reiniciando la app — sin tocar código.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendArgs): Promise<{ ok: boolean; reason?: string; transport?: Transport }> {
  const transport = detectTransport()

  if (transport === 'stub') {
    console.log('\n📧  [email-stub — sin SMTP_HOST ni RESEND_API_KEY]')
    console.log(`    To:      ${to}`)
    console.log(`    Subject: ${subject}`)
    console.log(`    Body:    ${html.length} chars\n`)
    return { ok: true, reason: 'stubbed', transport }
  }

  if (transport === 'smtp') {
    try {
      await smtpClient().sendMail({
        from: fromAddress(),
        to,
        subject,
        html,
        replyTo,
      })
      return { ok: true, transport }
    } catch (err) {
      console.error('SMTP send failed:', err)
      return { ok: false, reason: (err as Error).message, transport }
    }
  }

  // resend
  try {
    const { error } = await resendClient().emails.send({
      from: fromAddress(),
      to,
      subject,
      html,
      replyTo,
    })
    if (error) {
      console.error('Resend error:', error)
      return { ok: false, reason: error.message, transport }
    }
    return { ok: true, transport }
  } catch (err) {
    console.error('Email send threw:', err)
    return { ok: false, reason: (err as Error).message, transport }
  }
}
