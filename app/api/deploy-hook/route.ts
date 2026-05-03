import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

/**
 * Webhook de deploy. GitHub Actions (o cualquier cliente con el secret)
 * llama POST aquí con `{ commit }` en el body. Si el HMAC del header
 * `x-deploy-signature` valida, dispara el script local de deploy en
 * background y responde inmediatamente — el script hace git pull,
 * build y restart de Passenger.
 *
 * Variables de entorno:
 *   DEPLOY_HOOK_SECRET — secret compartido para HMAC
 *   DEPLOY_HOOK_SCRIPT — path absoluto al script (default: ~/donot-platform/deploy.sh)
 */
export async function POST(request: Request) {
  const secret = process.env.DEPLOY_HOOK_SECRET
  if (!secret || secret.length < 16) {
    return NextResponse.json(
      { ok: false, reason: 'DEPLOY_HOOK_SECRET no configurado' },
      { status: 503 },
    )
  }

  const raw = await request.text()
  const signature = request.headers.get('x-deploy-signature') ?? ''
  const expected = createHmac('sha256', secret).update(raw).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = (() => {
    try {
      return Buffer.from(signature, 'hex')
    } catch {
      return Buffer.alloc(0)
    }
  })()

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, reason: 'Firma inválida' }, { status: 401 })
  }

  let body: { commit?: string; ref?: string } = {}
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ ok: false, reason: 'Body no es JSON válido' }, { status: 400 })
  }

  const home = process.env.HOME ?? '/home/u530306321'
  const scriptPath =
    process.env.DEPLOY_HOOK_SCRIPT ?? path.join(home, 'donot-platform', 'deploy.sh')

  if (!existsSync(scriptPath)) {
    return NextResponse.json(
      { ok: false, reason: `Script de deploy no encontrado: ${scriptPath}` },
      { status: 503 },
    )
  }

  // Lanzar el deploy en background — el script reinicia la app al final.
  // Detached + ignored I/O para que no muera con esta request.
  const ref = (body.ref ?? 'origin/main').replace(/[^A-Za-z0-9_/.\-]/g, '')
  const commit = (body.commit ?? '').replace(/[^a-f0-9]/g, '').slice(0, 40)
  const child = spawn('bash', [scriptPath, ref, commit], {
    detached: true,
    stdio: 'ignore',
    cwd: path.dirname(scriptPath),
  })
  child.unref()

  return NextResponse.json({
    ok: true,
    started: true,
    ref,
    commit,
    pid: child.pid,
  })
}
