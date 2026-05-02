'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { AdminRole } from '@prisma/client'
import { cn } from '@/lib/utils'

interface Props {
  user: { name: string; email: string; role: AdminRole }
}

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/cocina', label: 'Cocina' },
  { href: '/admin/calendario', label: 'Calendario' },
  { href: '/admin/droops', label: 'Droops' },
  { href: '/admin/sabores', label: 'Sabores' },
  { href: '/admin/cajas', label: 'Cajas' },
]

export function AdminHeader({ user }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-donot-verde text-donot-crema">
      <div className="max-w-8xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-6">
        <Link href="/admin" className="flex items-center gap-3 shrink-0">
          <Image
            src="/brand/do-not-crema-fondo-verde.png"
            alt="donot."
            width={120}
            height={48}
            className="h-8 w-auto"
          />
          <span className="text-donot-crema/70 text-sm hidden sm:inline">
            admin
          </span>
        </Link>

        <nav className="flex items-center gap-4 lg:gap-6 text-sm font-semibold overflow-x-auto -mx-2 px-2">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition whitespace-nowrap',
                  active
                    ? 'text-donot-rosado'
                    : 'text-donot-crema/85 hover:text-donot-rosado',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-donot-crema/85">
            {user.name}{' '}
            <span className="text-donot-crema/55 text-xs">· {user.role.toLowerCase()}</span>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-donot-crema/10 hover:bg-donot-crema/20 transition"
          >
            <LogOut size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full bg-donot-crema/10"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
