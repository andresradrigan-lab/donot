import { CartView } from '@/components/store/CartView'

export const metadata = {
  title: 'Tu cajita · donot.',
}

export default function CartPage() {
  return (
    <section className="relative px-6 md:px-10 py-12 md:py-16 max-w-6xl mx-auto overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-20 -right-32 w-96 h-96 rounded-full bg-donot-rosado/10 blur-3xl pointer-events-none"
      />

      <div className="relative mb-10 max-w-2xl">
        <span className="inline-block px-3 py-1 rounded-full bg-donot-naranjo/15 text-donot-naranjo text-xs font-bold uppercase tracking-[0.2em] mb-3">
          Carrito
        </span>
        <h1 className="font-display text-4xl md:text-6xl text-donot-verde leading-[1.05]">
          Tu <span className="italic text-donot-naranjo">cajita</span>.
        </h1>
        <p className="text-donot-muted mt-3 text-lg">
          Revisa los sabores, ajusta cantidades y aplica un código si tienes uno.
        </p>
      </div>
      <div className="relative">
        <CartView />
      </div>
    </section>
  )
}
