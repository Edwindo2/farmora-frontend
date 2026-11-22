import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Lines, totalOf } from './Order'
import { Link } from 'react-router-dom'
import { money, currencyOf } from '../lib'
import { useCart } from '../cart'

export default function CartDrawer() {
  const { price: fmtPrice } = useCart()
  const { drawer: open, closeDrawer: onClose, cart, mode, setQty, remove } = useCart()
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-deep/40 backdrop-blur-sm transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-mist p-7 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Your order"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] font-bold">Your order</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 hover:border-ink" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <Lines cart={cart} mode={mode} setQty={setQty} remove={remove} />
        </div>
        <div className="border-t border-ink/10 pt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="font-display text-[24px] font-bold">{cart.length ? fmtPrice(totalOf(cart, mode)) : '—'}</span>
          </div>
          {cart.length ? (
            <div className="mt-6 grid gap-2">
              <Link to="/checkout" onClick={onClose} className="block rounded-full bg-grass py-3.5 text-center text-[14.5px] font-semibold text-white transition hover:bg-grass-deep">Checkout</Link>
              <Link to="/cart" onClick={onClose} className="block rounded-full border border-ink/20 py-3 text-center text-[14px] font-semibold text-ink transition hover:border-grass hover:text-grass">View cart</Link>
            </div>
          ) : (
            <Link to="/shop" onClick={onClose} className="mt-6 block rounded-full bg-grass py-3.5 text-center text-[14.5px] font-semibold text-white transition hover:bg-grass-deep">Browse our oils</Link>
          )}
        </div>
      </aside>
    </div>
  )
}
