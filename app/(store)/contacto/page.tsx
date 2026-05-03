import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Mail, Instagram, MapPin, Send } from 'lucide-react'
import { TikTokIcon } from '@/components/store/SocialIcons'

export const metadata = {
  title: 'Contacto · donot.',
  description: 'Escríbenos. Estamos en Concón–Reñaca.',
}

export default function ContactPage() {
  return (
    <section className="relative px-6 md:px-10 py-12 md:py-20 max-w-6xl mx-auto overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-donot-rosado/10 blur-3xl pointer-events-none"
      />

      <div className="relative mb-12 max-w-2xl">
        <span className="inline-block px-3 py-1 rounded-full bg-donot-azulPastel/40 text-donot-verde text-xs font-bold uppercase tracking-[0.2em] mb-3">
          Contacto
        </span>
        <h1 className="font-display text-4xl md:text-6xl text-donot-verde leading-[1.05] mb-3">
          Cuéntanos<span className="italic text-donot-naranjo">.</span>
        </h1>
        <p className="text-donot-muted text-lg leading-relaxed">
          Pedidos especiales, alianzas, prensa o un saludo. Te leemos por acá o por DM.
        </p>
      </div>

      <div className="relative grid gap-8 md:grid-cols-[1fr_1.4fr] items-start">
        {/* Bloque info */}
        <aside className="bg-donot-verde rounded-[2rem] p-7 md:p-8 text-donot-crema relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -bottom-16 -right-12 w-56 h-56 rounded-full bg-donot-rosado/20 blur-2xl pointer-events-none"
          />

          <div className="relative">
            <h2 className="font-display text-3xl mb-1">
              Encuéntranos<span className="italic text-donot-rosado">.</span>
            </h2>
            <p className="text-donot-crema/80 text-sm mb-6">
              También podés agarrarnos en cualquiera de estos canales.
            </p>

            <div className="flex flex-col gap-3.5">
              <a
                href="mailto:hola@donot.cl"
                className="group inline-flex items-center gap-3 hover:text-donot-rosado transition w-fit"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-donot-crema/15 group-hover:bg-donot-rosado/30 transition">
                  <Mail size={18} />
                </span>
                <span className="font-semibold">hola@donot.cl</span>
              </a>
              <a
                href="https://www.instagram.com/donot_cl/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 hover:text-donot-rosado transition w-fit"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-donot-crema/15 group-hover:bg-donot-rosado/30 transition">
                  <Instagram size={18} />
                </span>
                <span className="font-semibold">@donot_cl</span>
              </a>
              <a
                href="https://www.tiktok.com/@donot_cl"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 hover:text-donot-rosado transition w-fit"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-donot-crema/15 group-hover:bg-donot-rosado/30 transition">
                  <TikTokIcon size={18} />
                </span>
                <span className="font-semibold">@donot_cl</span>
              </a>
              <span className="inline-flex items-center gap-3 text-donot-crema/85">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-donot-crema/15">
                  <MapPin size={18} />
                </span>
                <span>Concón · Reñaca, V Región</span>
              </span>
            </div>

            <div className="mt-8 pt-6 border-t border-donot-crema/15">
              <Image
                src="/brand/mascota-azul-naranjo.png"
                alt=""
                width={80}
                height={100}
                className="h-20 w-auto mb-3"
              />
              <p className="font-display italic text-lg text-donot-rosado leading-tight">
                "Si nos escribís un domingo,<br />respondemos un lunes."
              </p>
            </div>
          </div>
        </aside>

        {/* Form */}
        <form className="bg-white rounded-[2rem] border border-donot-border shadow-soft p-7 md:p-9 flex flex-col gap-4">
          <h2 className="font-display text-3xl text-donot-verde mb-2">
            Mándanos un <span className="italic text-donot-naranjo">mail</span>.
          </h2>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-donot-verde">
              Nombre
            </span>
            <input
              type="text"
              name="name"
              required
              className="px-4 py-3 rounded-2xl border-2 border-donot-border bg-donot-crema/40 focus:outline-none focus:border-donot-verde focus:bg-white transition"
              placeholder="Cómo te llamas"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-donot-verde">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              className="px-4 py-3 rounded-2xl border-2 border-donot-border bg-donot-crema/40 focus:outline-none focus:border-donot-verde focus:bg-white transition"
              placeholder="tu@correo.cl"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-donot-verde">
              Mensaje
            </span>
            <textarea
              name="message"
              required
              rows={5}
              className="px-4 py-3 rounded-2xl border-2 border-donot-border bg-donot-crema/40 focus:outline-none focus:border-donot-verde focus:bg-white transition resize-none"
              placeholder="Cuéntanos en qué andas"
            />
          </label>
          <Button type="submit" size="lg" className="self-start mt-2 inline-flex items-center gap-2">
            Enviar
            <Send size={16} />
          </Button>
          <p className="text-xs text-donot-muted leading-relaxed">
            Formulario de muestra. El backend se conecta en un sprint siguiente —
            mientras tanto, escríbenos directo a <a href="mailto:hola@donot.cl" className="font-semibold text-donot-naranjo">hola@donot.cl</a>.
          </p>
        </form>
      </div>
    </section>
  )
}
