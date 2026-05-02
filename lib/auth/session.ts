import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AdminRole } from '@prisma/client'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type AdminSessionPayload,
} from './jwt'

const ROLE_LEVEL: Record<AdminRole, number> = {
  VIEWER: 1,
  OPERATOR: 2,
  OWNER: 3,
}

export function setSessionCookie(payload: AdminSessionPayload): void {
  const token = signSession(payload)
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE)
}

export function getCurrentAdmin(): AdminSessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

export function requireAdmin(minRole: AdminRole = 'VIEWER'): AdminSessionPayload {
  const admin = getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (ROLE_LEVEL[admin.role] < ROLE_LEVEL[minRole]) redirect('/admin')
  return admin
}

export function hasRole(
  admin: AdminSessionPayload | null,
  minRole: AdminRole,
): boolean {
  return !!admin && ROLE_LEVEL[admin.role] >= ROLE_LEVEL[minRole]
}
