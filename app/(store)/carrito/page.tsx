import { CartView } from '@/components/store/CartView'

export const metadata = {
  title: 'Tu cajita · donot.',
}

export default function CartPage() {
  return (
    <section className="px-6 md:px-10 py-12 md:py-16 max-w-6xl mx-auto">
      <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-2">
        Tu cajita
      </h1>
      <p className="text-donot-muted mb-10">
        Revisa los sabores, ajusta cantidades y aplica un código si tienes uno.
      </p>
      <CartView />
    </section>
  )
}
