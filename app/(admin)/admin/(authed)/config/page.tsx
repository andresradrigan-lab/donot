import { prisma } from '@/lib/db'
import { SETTING_KEYS, SECRET_KEYS, maskSecret } from '@/lib/settings-keys'
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
  const secretsHasValue: Record<string, boolean> = {}
  const secretsMasked: Record<string, string> = {}

  for (const r of rows) {
    if (SECRET_KEYS.has(r.key)) {
      secretsHasValue[r.key] = !!r.value
      if (r.value) secretsMasked[r.key] = maskSecret(r.value)
    } else {
      initial[r.key] = r.value
    }
  }

  return (
    <section className="px-6 md:px-10 py-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-donot-verde">
          Configuración
        </h1>
        <p className="text-donot-muted">
          SEO, plataformas de medición, datos del negocio y reglas operativas.
          Los cambios se aplican al instante en el sitio público.
        </p>
      </header>
      <SettingsManager
        initial={initial}
        secretsHasValue={secretsHasValue}
        secretsMasked={secretsMasked}
      />
    </section>
  )
}
