import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

/**
 * Webhook de deploy.
 *
 * GitHub Actions (o cualquier cliente con el secret) hace POST con:
 *   {
 *     "tarballUrl": "https://github.com/<repo>/releases/download/.../release.tar.gz",
 *     "releaseId":  "<timestamp>-<sha>",
 *     "tag":        "deploy-<id>",      // opcional, solo informativo
 *     "commit":     "<sha completo>"     // opcional, solo informativo
 *   }
 *
 * El header `X-Deploy-Signature` debe contener el HMAC-SHA256 hex del body
 * usando DEPLOY_HOOK_SECRET. Si valida, se dispara el script local en
 * background y respondemos inmediatamente — el script descarga el tarball
 * y reinicia Passenger.
 *
 * Variables de entorno:
 *   DEPLOY_HOOK_SECRET — secret compartido para HMAC
 *   DEPLOY_HOOK_SCRIPT — path al script (default: ~/donot-platform/deploy.sh)
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
    return NextResponse.json(
      { ok: false, reason: 'Firma inválida' },
      { status: 401 },
    )
  }

  let body: {
    tarballUrl?: string
    releaseId?: string
    tag?: string
    commit?: string
  } = {}
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'Body no es JSON válido' },
      { status: 400 },
    )
  }

  // Validar tarballUrl: solo aceptar URLs HTTPS de github.com (los releases
  // del repo). Esto previene que alguien con el secret apunte a un tarball
  // malicioso.
  const tarballUrl = String(body.tarballUrl ?? '')
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/releases\/download\//.test(tarballUrl)) {
    return NextResponse.json(
      { ok: false, reason: 'tarballUrl inválido (solo github.com/.../releases/download/)' },
      { status: 400 },
    )
  }

  // releaseId solo permite chars seguros (no path traversal).
  const releaseId = String(body.releaseId ?? '').replace(/[^A-Za-z0-9_-]/g, '')
  if (!releaseId || releaseId.length > 60) {
    return NextResponse.json(
      { ok: false, reason: 'releaseId inválido' },
      { status: 400 },
    )
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

  // Disparar el script en background — responde de inmediato, el script
  // continúa solo y reinicia Passenger al final.
  const child = spawn('bash', [scriptPath, tarballUrl, releaseId], {
    detached: true,
    stdio: 'ignore',
    cwd: path.dirname(scriptPath),
  })
  child.unref()

  return NextResponse.json({
    ok: true,
    started: true,
    releaseId,
    pid: child.pid,
  })
}
