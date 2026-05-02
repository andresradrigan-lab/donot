import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/session'
import { UsersManager } from '@/components/admin/UsersManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Usuarios · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminUsersPage() {
  const me = requireAdmin()
  if (me.role !== 'OWNER') redirect('/admin')

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  return (
    <section className="px-6 md:px-10 py-10 max-w-8xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Usuarios
        </h1>
        <p className="text-donot-muted">
          Solo OWNER puede invitar y gestionar miembros del equipo.
        </p>
      </header>
      <UsersManager users={users} currentUserId={me.sub} />
    </section>
  )
}
