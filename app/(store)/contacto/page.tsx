import { Button } from '@/components/ui/Button'
import { Mail, Instagram, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Contacto · donot.',
  description: 'Escríbenos. Estamos en Concón–Reñaca.',
}

export default function ContactPage() {
  return (
    <section className="px-6 md:px-10 py-16 md:py-24 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-3">
        Cuéntanos.
      </h1>
      <p className="text-donot-muted text-lg mb-12 max-w-xl">
        Pedidos especiales, alianzas, prensa o un saludo. Te leemos por acá o
        por DM.
      </p>

      <div className="grid gap-12 md:grid-cols-[1fr_auto_1.2fr] items-start">
        <div className="flex flex-col gap-5 text-donot-ink">
          <a
            href="mailto:hola@donot.cl"
            className="inline-flex items-center gap-3 hover:text-donot-naranjo transition"
          >
            <Mail size={20} className="text-donot-verde" />
            <span>hola@donot.cl</span>
          </a>
          <a
            href="https://instagram.com/donot.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 hover:text-donot-naranjo transition"
          >
            <Instagram size={20} className="text-donot-verde" />
            <span>@donot.cl</span>
          </a>
          <span className="inline-flex items-center gap-3 text-donot-muted">
            <MapPin size={20} className="text-donot-verde" />
            <span>Concón · Reñaca, V Región</span>
          </span>
        </div>

        <div className="hidden md:block w-px bg-donot-border self-stretch" />

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-donot-verde">
              Nombre
            </span>
            <input
              type="text"
              name="name"
              required
              className="px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde"
              placeholder="Cómo te llamas"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-donot-verde">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              className="px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde"
              placeholder="tu@correo.cl"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-donot-verde">
              Mensaje
            </span>
            <textarea
              name="message"
              required
              rows={5}
              className="px-4 py-3 rounded-xl border border-donot-border bg-white focus:outline-none focus:border-donot-verde resize-none"
              placeholder="Cuéntanos en qué andas"
            />
          </label>
          <Button type="submit" size="lg" className="self-start mt-2">
            Enviar
          </Button>
          <p className="text-xs text-donot-muted">
            Formulario de muestra. El backend se conecta en un sprint
            siguiente.
          </p>
        </form>
      </div>
    </section>
  )
}
