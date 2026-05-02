import { Resend } from 'resend'

interface SendArgs {
  to: string
  subject: string
  html: string
  replyTo?: string
}

let cached: Resend | null = null
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_PEGAR_AQUI') return null
  if (!cached) cached = new Resend(key)
  return cached
}

function fromAddress(): string {
  const email = process.env.RESEND_FROM_EMAIL ?? 'hola@donot.cl'
  const name = process.env.RESEND_FROM_NAME ?? 'donot.'
  return `${name} <${email}>`
}

/**
 * Envía un email transaccional. Si Resend no está configurado, escribe el
 * mensaje en consola en lugar de fallar — útil para desarrollo y para que
 * el flujo de pago funcione sin depender de Resend en sandbox.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendArgs): Promise<{ ok: boolean; reason?: string }> {
  const resend = client()
  if (!resend) {
    console.log('\n📧  [email-stub — RESEND_API_KEY no configurada]')
    console.log(`    To:      ${to}`)
    console.log(`    Subject: ${subject}`)
    console.log(`    Body:    ${html.length} chars\n`)
    return { ok: true, reason: 'stubbed' }
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to,
      subject,
      html,
      replyTo,
    })
    if (error) {
      console.error('Resend error:', error)
      return { ok: false, reason: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error('Email send threw:', err)
    return { ok: false, reason: (err as Error).message }
  }
}
