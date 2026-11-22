import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Nav from '../components/Nav'
import Shop from '../components/Shop'
import CartDrawer from '../components/CartDrawer'
import Footer from '../components/Footer'
import { ScrollProgress } from '../components/Motion'
import { useReveal } from '../lib'
import { useCart } from '../cart'

// The shop: all oils, the cart and the order form.
export default function ShopPage() {
  useReveal()
  const { hash } = useLocation()
  const { ready } = useCart()

  useEffect(() => { document.title = 'Shop palm oil · Farmora' ; return () => { document.title = 'Farmora — Palm Oil from Nigeria, Delivered Anywhere' } }, [])

  // /shop#order: scroll once products (and the cart) are in place
  useEffect(() => {
    if (!ready) return
    // (newer browsers return a Promise from scrollTo, which must not be returned from an effect)
    if (!hash) { window.scrollTo(0, 0); return }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150)
    return () => clearTimeout(t)
  }, [hash, ready])

  return (
    <>
      <ScrollProgress />
      <Nav />
      <main>
        <header className="relative overflow-hidden bg-forest px-5 py-20 text-white md:px-12 md:py-28">
          <img src="/bg/oil-pour.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/80 to-transparent" />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">The Farmora shop</p>
            <h1 className="mt-4 max-w-[12em] font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[60px] [&_em]:not-italic [&_em]:text-sun">Palm oil, from our farms <em>to your door.</em></h1>
            <p className="mt-5 max-w-[34em] font-light leading-relaxed text-white/75">Choose your oil and pack size, then send your order. We confirm stock, delivery cost and payment by email within one business day. You won't be charged until then.</p>
          </div>
        </header>
        <Shop />
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
