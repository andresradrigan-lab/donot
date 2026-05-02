import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Health check para UptimeRobot, balanceadores y readiness probes.
 * Verifica que la app responde Y que la BD acepta queries.
 *
 * 200 → todo OK
 * 503 → la BD no responde
 */
export async function GET() {
  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json(
      {
        status: 'ok',
        db: 'ok',
        uptimeMs: Math.round(process.uptime() * 1000),
        responseTimeMs: Date.now() - startedAt,
        version: process.env.npm_package_version ?? '0.1.0',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'error',
        error: (err as Error).message,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
