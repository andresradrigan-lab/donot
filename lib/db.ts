import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

interface MariaDbConnectionConfig {
  user: string
  password: string
  database: string
  host?: string
  port?: number
  socketPath?: string
  connectionLimit: number
}

function buildPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no configurado')

  // Parseamos DATABASE_URL (mysql://USER:PASS@HOST:PORT/DBNAME) y se la
  // pasamos al adapter `mariadb`. El driver nativo de MariaDB sí soporta
  // MariaDB 11.x — Prisma con su query engine propio falla en P1000 con
  // versiones nuevas de MariaDB.
  const parsed = new URL(url)
  const hostname = parsed.hostname
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

  // En Hostinger Cloud el usuario MariaDB se autoriza solo con
  // 'user'@'localhost' (socket Unix) — los intentos por TCP a localhost
  // resuelven a ::1 y dan Access denied. Si detectamos host local,
  // usamos socket. La ruta socket en Hostinger es /var/lib/mysql/mysql.sock.
  const socketParam = parsed.searchParams.get('socket')
  const useSocket = !!socketParam || (isLocal && process.env.NODE_ENV === 'production')
  const socketPath = socketParam ?? '/var/lib/mysql/mysql.sock'

  const config: MariaDbConnectionConfig = {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: 5,
  }
  if (useSocket) {
    config.socketPath = socketPath
  } else {
    config.host = hostname
    config.port = parsed.port ? Number(parsed.port) : 3306
  }

  const adapter = new PrismaMariaDb(config)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? buildPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
