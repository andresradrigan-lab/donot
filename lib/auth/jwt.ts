import jwt from 'jsonwebtoken'
import type { AdminRole } from '@prisma/client'

export interface AdminSessionPayload {
  sub: string // adminUser.id
  email: string
  name: string
  role: AdminRole
}

const SESSION_TTL_HOURS = 12

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s === 'replace_me_with_random_32_bytes') {
    throw new Error('JWT_SECRET no configurado')
  }
  return s
}

export function signSession(payload: AdminSessionPayload): string {
  return jwt.sign(payload, secret(), {
    expiresIn: `${SESSION_TTL_HOURS}h`,
    issuer: 'donot.',
    audience: 'admin',
  })
}

export function verifySession(token: string): AdminSessionPayload | null {
  try {
    const decoded = jwt.verify(token, secret(), {
      issuer: 'donot.',
      audience: 'admin',
    })
    if (typeof decoded === 'string') return null
    const { sub, email, name, role } = decoded as AdminSessionPayload & {
      iat?: number
      exp?: number
    }
    if (!sub || !email || !name || !role) return null
    return { sub, email, name, role }
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'donot_admin_session'
export const SESSION_TTL_SECONDS = SESSION_TTL_HOURS * 60 * 60
