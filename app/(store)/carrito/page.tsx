import { CartPreview } from '@/components/store/CartPreview'

export const metadata = {
  title: 'Tu cajita · donot.',
}

export default function CartPage() {
  return (
    <section className="px-6 md:px-10 py-12 md:py-16 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl text-donot-verde mb-2">
        Tu cajita
      </h1>
      <p className="text-donot-muted mb-8">
        Vista preliminar. El carrito completo y el checkout se arman en el
        siguiente sprint.
      </p>
      <CartPreview />
    </section>
  )
}
