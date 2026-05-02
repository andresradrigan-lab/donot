import { CheckoutForm } from '@/components/store/CheckoutForm'

export const metadata = {
  title: 'Checkout · donot.',
}

interface Props {
  searchParams: { cupon?: string }
}

export default function CheckoutPage({ searchParams }: Props) {
  return (
    <section className="px-6 md:px-10 py-12 md:py-16 max-w-7xl mx-auto">
      <h1 className="font-display text-4xl md:text-5xl text-donot-verde mb-2">
        Casi listo.
      </h1>
      <p className="text-donot-muted mb-10 max-w-xl">
        Completa los datos y elige cómo pagar. Confirmamos tu pedido apenas
        veamos el pago.
      </p>
      <CheckoutForm initialCouponCode={searchParams.cupon} />
    </section>
  )
}
