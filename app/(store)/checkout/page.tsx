import { CheckoutForm } from '@/components/store/CheckoutForm'

export const metadata = {
  title: 'Checkout · donot.',
}

interface Props {
  searchParams: { cupon?: string }
}

export default function CheckoutPage({ searchParams }: Props) {
  return (
    <section className="relative px-6 md:px-10 py-12 md:py-16 max-w-7xl mx-auto overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-24 -right-32 w-96 h-96 rounded-full bg-donot-rosado/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-donot-azulPastel/20 blur-3xl pointer-events-none"
      />

      <div className="relative mb-10 max-w-2xl">
        <span className="inline-block px-3 py-1 rounded-full bg-donot-verde/10 text-donot-verde text-xs font-bold uppercase tracking-[0.2em] mb-3">
          Checkout
        </span>
        <h1 className="font-display text-4xl md:text-6xl text-donot-verde leading-[1.05]">
          Casi <span className="italic text-donot-naranjo">listo</span>.
        </h1>
        <p className="text-donot-muted mt-3 text-lg">
          Completa los datos y elige cómo pagar. Confirmamos tu pedido apenas veamos el pago.
        </p>
      </div>

      <div className="relative">
        <CheckoutForm initialCouponCode={searchParams.cupon} />
      </div>
    </section>
  )
}
