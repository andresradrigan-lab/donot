import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { MiniCart } from '@/components/store/MiniCart'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-5rem)] flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <MiniCart />
    </>
  )
}
