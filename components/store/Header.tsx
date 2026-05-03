'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { readCart } from '@/lib/cart'
import { openMiniCart } from '@/components/store/MiniCart'

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/droop/droop_001', label: 'Drop' },
  { href: '/galeria', label: 'Galería' },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function Header() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => {
      const cart = readCart()
      setCount(cart.items.reduce((s, it) => s + it.quantity, 0))
    }
    refresh()
    window.addEventListener('donot:cart-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('donot:cart-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-donot-crema/95 backdrop-blur border-b border-donot-border">
      <div className="max-w-8xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-6">
        <Link href="/" aria-label="donot. — ir al inicio" className="shrink-0">
          <Image
            src="/brand/do-not-verde-horizontal.png"
            alt="donot."
            width={200}
            height={56}
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

        <button
          type="button"
          onClick={() => openMiniCart()}
          aria-label="Ver mi cajita"
          className="relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-donot-verde text-donot-crema hover:bg-donot-verde/90 transition"
        >
          <ShoppingBag size={20} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-donot-naranjo text-white text-[10px] font-bold border-2 border-donot-crema">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
