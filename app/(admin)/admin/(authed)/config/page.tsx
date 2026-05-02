import { prisma } from '@/lib/db'
import { SETTING_KEYS } from '@/lib/settings-keys'
import { SettingsManager } from '@/components/admin/SettingsManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Configuración · admin donot.',
  robots: { index: false, follow: false },
}

export default async function AdminConfigPage() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Array.from(SETTING_KEYS) } },
  })
  const initial: Record<string, string> = {}
  for (const r of rows) initial[r.key] = r.value

  return (
    <section className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Configuración
        </h1>
        <p className="text-donot-muted">
          Datos del sitio y reglas de negocio. Las claves de pasarelas y
          analítica viven en variables de entorno por seguridad.
        </p>
      </header>
      <SettingsManager initial={initial} />
    </section>
  )
}
