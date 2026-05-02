import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/droop/droop_001', label: 'Drop' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-donot-crema/95 backdrop-blur border-b border-donot-border">
      <div className="max-w-8xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-6">
        <Link href="/" aria-label="donot. — ir al inicio" className="shrink-0">
          <Image
            src="/brand/do-not-verde-fondo-crema.png"
            alt="donot."
            width={120}
            height={48}
            priority
            className="h-10 w-auto md:h-12"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-donot-verde font-sans font-medium">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-donot-naranjo transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/carrito"
          aria-label="Ver mi cajita"
          className="relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-donot-verde text-donot-crema hover:bg-donot-verde/90 transition"
        >
          <ShoppingBag size={20} />
        </Link>
      </div>
    </header>
  )
}
