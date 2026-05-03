import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no configurado')

  // Parseamos DATABASE_URL (mysql://USER:PASS@HOST:PORT/DBNAME) y se la
  // pasamos al adapter `mariadb`. El driver nativo de MariaDB sí soporta
  // MariaDB 11.x — Prisma con su query engine propio falla en P1000 con
  // versiones nuevas de MariaDB.
  const parsed = new URL(url)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: 5,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? buildPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
