import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, MapPin } from 'lucide-react'
import { TikTokIcon } from '@/components/store/SocialIcons'

const NAV = [
  { href: '/droop/droop_001', label: 'Drop activo' },
  { href: '/galeria', label: 'Galería' },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function Footer() {
  return (
    <footer className="relative bg-donot-verde text-donot-crema mt-24 overflow-hidden">
      {/* Decoración: blob rosado en esquina */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-donot-rosado/15 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-donot-naranjo/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-8xl mx-auto px-6 md:px-10 py-16 md:py-20 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr] items-start">
        {/* Brand */}
        <div className="flex flex-col gap-5 max-w-md">
          <Image
            src="/brand/do-not-rosado-horizontal.png"
            alt="donot."
            width={1182}
            height={1282}
            quality={100}
            sizes="200px"
            className="h-24 md:h-28 w-auto object-contain"
          />
          <p className="text-donot-crema/85 leading-relaxed">
            Donas que no deberían existir.<br />
            Hechas a mano en Concón–Reñaca, V Región de Chile.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Image
              src="/brand/mascota-crema-verde.png"
              alt=""
              width={507}
              height={769}
              quality={100}
              sizes="80px"
              className="h-20 w-auto object-contain"
            />
            <p className="font-display italic text-donot-rosado text-lg leading-tight">
              "Solo recuerda <br />no comerlas todas."
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-3">
          <h4 className="font-display italic text-2xl text-donot-rosado mb-1">
            Navegación
          </h4>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-donot-crema/85 hover:text-donot-rosado transition w-fit"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <h4 className="font-display italic text-2xl text-donot-rosado mb-1">
            Encuéntranos
          </h4>
          <a
            href="https://www.instagram.com/donot_cl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-donot-crema/85 hover:text-donot-rosado transition w-fit"
          >
            <Instagram size={18} /> @donot_cl
          </a>
          <a
            href="https://www.tiktok.com/@donot_cl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-donot-crema/85 hover:text-donot-rosado transition w-fit"
          >
            <TikTokIcon size={18} /> @donot_cl
          </a>
          <a
            href="mailto:hola@donot.cl"
            className="inline-flex items-center gap-2.5 text-donot-crema/85 hover:text-donot-rosado transition w-fit"
          >
            <Mail size={18} /> hola@donot.cl
          </a>
          <span className="inline-flex items-center gap-2.5 text-donot-crema/85">
            <MapPin size={18} /> Concón · Reñaca
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-donot-crema/15">
        <div className="max-w-8xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between gap-4 flex-wrap text-sm">
          <span className="text-donot-crema/60">
            © {new Date().getFullYear()} donot.
          </span>
          <a
            href="https://morgansmedia.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-donot-crema/60 hover:text-donot-rosado transition"
          >
            Desarrollado por <span className="font-semibold text-donot-crema/85 hover:text-donot-rosado">MorgansMedia</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
