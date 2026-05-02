import Image from 'next/image'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { getCurrentAdmin } from '@/lib/auth/session'

export const metadata = {
  title: 'Admin · donot.',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  if (getCurrentAdmin()) redirect('/admin')

  return (
    <main className="min-h-screen bg-donot-crema flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white border border-donot-border rounded-3xl shadow-soft p-8 flex flex-col gap-6">
        <div className="text-center">
          <Image
            src="/brand/do-not-verde-fondo-crema.png"
            alt="donot."
            width={120}
            height={48}
            className="h-10 w-auto mx-auto mb-4"
          />
          <h1 className="font-display text-2xl text-donot-verde">
            Admin
          </h1>
          <p className="text-donot-muted text-sm">
            Solo equipo donot.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
