import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'No alcanzó el pago · donot.',
}

export default function CheckoutErrorPage() {
  return (
    <section className="px-6 md:px-10 py-16 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
      <Image
        src="/brand/mascota-azul-naranjo.png"
        alt="Mascota de donot."
        width={200}
        height={250}
        className="h-48 w-auto"
      />
      <h1 className="font-display text-4xl md:text-5xl text-donot-verde">
        No alcanzó el pago.
      </h1>
      <p className="text-donot-muted text-lg max-w-md">
        Algo se nos quemó en el horno. Reintenta en un toque — tu cajita sigue
        guardada.
      </p>
      <Link href="/checkout">
        <Button size="lg">Reintenta</Button>
      </Link>
      <Link
        href="/carrito"
        className="text-donot-naranjo font-semibold hover:underline"
      >
        Volver a mi cajita
      </Link>
    </section>
  )
}
