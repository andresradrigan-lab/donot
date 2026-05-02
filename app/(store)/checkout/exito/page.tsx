import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { CheckoutSuccessRefresher } from '@/components/store/CheckoutSuccessRefresher'

export const metadata = {
  title: 'Pedido confirmado · donot.',
}

interface Props {
  searchParams: { token?: string; payment_id?: string; status?: string }
}

export default function CheckoutSuccessPage({ searchParams }: Props) {
  const token = searchParams.token

  return (
    <section className="px-6 md:px-10 py-16 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
      <Image
        src="/brand/mascota-crema-verde.png"
        alt="Mascota de donot."
        width={200}
        height={250}
        className="h-48 w-auto"
        priority
      />
      <h1 className="font-display text-4xl md:text-5xl text-donot-verde">
        Listo. Tus donitas están reservadas.
      </h1>
      <p className="text-donot-muted text-lg max-w-md">
        Te llegará un correo con todos los detalles. Si seleccionaste despacho,
        te avisamos cuando estén en camino.
      </p>

      {token ? (
        <>
          <CheckoutSuccessRefresher token={token} />
          <Link href={`/pedido/${token}`}>
            <Button size="lg">Ver mi pedido</Button>
          </Link>
        </>
      ) : (
        <Link href="/">
          <Button size="lg">Volver al inicio</Button>
        </Link>
      )}

      <Link
        href="/droop/droop_001"
        className="text-donot-naranjo font-semibold hover:underline"
      >
        Ver el drop activo
      </Link>
    </section>
  )
}
