import { NextResponse } from 'next/server'
import type { AdminRole } from '@prisma/client'
import { getCurrentAdmin } from './session'
import type { AdminSessionPayload } from './jwt'

const ROLE_LEVEL: Record<AdminRole, number> = {
  VIEWER: 1,
  OPERATOR: 2,
  OWNER: 3,
}

/**
 * Para usar dentro de route handlers de /api/admin/*. Devuelve el admin si
 * la sesión es válida y cumple el rol mínimo, o un NextResponse con el
 * error 401/403 listo para retornar.
 */
export function requireAdminApi(
  minRole: AdminRole = 'VIEWER',
): { admin: AdminSessionPayload; res?: never } | { admin?: never; res: NextResponse } {
  const admin = getCurrentAdmin()
  if (!admin) {
    return {
      res: NextResponse.json({ ok: false, reason: 'No autenticado' }, { status: 401 }),
    }
  }
  if (ROLE_LEVEL[admin.role] < ROLE_LEVEL[minRole]) {
    return {
      res: NextResponse.json({ ok: false, reason: 'Sin permisos' }, { status: 403 }),
    }
  }
  return { admin }
}
