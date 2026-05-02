import { requireAdmin } from '@/lib/auth/session'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = requireAdmin()
  return (
    <div className="min-h-screen bg-donot-crema flex flex-col">
      <AdminHeader user={admin} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
