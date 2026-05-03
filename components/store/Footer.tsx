import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, MapPin } from 'lucide-react'

const NAV = [
  { href: '/droop/droop_001', label: 'Drop activo' },
  { href: '/galeria', label: 'Galería' },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function Footer() {
  return (
    <footer className="relative bg-donot-verde text-donot-crema mt-24">
      <div className="max-w-8xl mx-auto px-6 md:px-10 py-16 grid gap-12 md:grid-cols-3">
        <div>
          <Image
            src="/brand/do-not-crema-fondo-verde.png"
            alt="donot."
            width={140}
            height={56}
            className="h-12 w-auto mb-4"
          />
          <p className="text-donot-crema/80 max-w-xs leading-relaxed">
            Donas que no deberían existir. Concón–Reñaca, V Región.
          </p>
        </div>

        <nav className="flex flex-col gap-3">
          <h4 className="font-display text-xl mb-1">Navegación</h4>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-donot-crema/85 hover:text-donot-rosado transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <h4 className="font-display text-xl mb-1">Encuéntranos</h4>
          <a
            href="https://instagram.com/donot.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-donot-crema/85 hover:text-donot-rosado transition"
          >
            <Instagram size={18} /> @donot.cl
          </a>
          <a
            href="mailto:hola@donot.cl"
            className="inline-flex items-center gap-2 text-donot-crema/85 hover:text-donot-rosado transition"
          >
            <Mail size={18} /> hola@donot.cl
          </a>
          <span className="inline-flex items-center gap-2 text-donot-crema/85">
            <MapPin size={18} /> Concón · Reñaca
          </span>
        </div>
      </div>

      <div className="border-t border-donot-crema/15">
        <div className="max-w-8xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between text-sm text-donot-crema/70">
          <span>© {new Date().getFullYear()} donot.</span>
          <span>Hecho con harina y café.</span>
        </div>
      </div>

      <Image
        src="/brand/mascota-azul-naranjo.png"
        alt="Mascota de donot."
        width={100}
        height={125}
        className="absolute bottom-4 right-4 md:bottom-6 md:right-10 w-20 md:w-28 h-auto pointer-events-none select-none"
      />
    </footer>
  )
}
