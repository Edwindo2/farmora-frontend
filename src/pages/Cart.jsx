import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ShieldCheck, Truck, Lock } from 'lucide-react'
import { Shell } from './Account'
import { useCart } from '../cart'
import { useAuth } from '../auth'
import { ModeToggle } from '../components/Shop'
import { packImage } from '../components/Home'
import { totalOf } from '../components/Order'
import { money, priceOf, currencyOf } from '../lib'

export function Steps({ step }) {
  const steps = ['Cart', 'Delivery', 'Payment', 'Done']
  return (
    <ol className="flex items-center gap-2 text-[12.5px] sm:gap-3 sm:text-[13px]" aria-label="Checkout progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-3">
          <span className={`flex items-center gap-2 ${i <= step ? 'font-semibold text-ink' : 'text-faint'}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${i < step ? 'bg-grass text-white' : i === step ? 'bg-ink text-paper' : 'bg-ink/10 text-faint'}`}>{i + 1}</span>{s}
          </span>
          {i < steps.length - 1 && <span className="h-px w-5 bg-ink/20 sm:w-10" />}
        </li>
      ))}
    </ol>
  )
}

export default function Cart() {
  const { price: fmtPrice } = useCart()
  const { cart, mode, setMode, setQty, remove, ready } = useCart()
  const { me } = useAuth()
  const nav = useNavigate()
  const cur = currencyOf(mode)
  const subtotal = totalOf(cart, mode)
  const count = cart.reduce((s, l) => s + l.qty, 0)

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-[30px] font-extrabold text-ink md:text-[36px]">Your cart {count > 0 && <span className="text-[18px] font-semibold text-muted">({count} item{count === 1 ? '' : 's'})</span>}</h1>
          <Steps step={0} />
        </div>

        {ready && cart.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-ink/20 bg-paper p-14 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-faint" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-[22px] font-bold text-ink">Your cart is empty</h2>
            <p className="mt-1 text-muted">Browse our palm oils and add what you need.</p>
            <Link to="/shop" className="btn-micro mt-6 inline-flex items-center gap-2 rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep">Start shopping <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13.5px] text-muted">Prices shown in {cur === 'NGN' ? 'naira for delivery in Nigeria' : 'US dollars for international shipping'}.</p>
                <ModeToggle mode={mode} setMode={setMode} />
              </div>
              <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper">
                {cart.map(l => {
                  const unit = priceOf(l.size, mode)
                  return (
                    <li key={l.key} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                      <Link to={`/product/${l.product.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-white">
                        <img src={packImage(l.product, l.size)} alt="" className="h-full w-full object-contain p-1.5" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/product/${l.product.id}`} className="font-display text-[15.5px] font-bold text-ink hover:text-grass">{l.product.name}</Link>
                        <p className="text-[13px] text-muted">{l.size.label} · {fmtPrice(unit)} each</p>
                        <button onClick={() => remove(l.key)} className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-faint hover:text-ruby"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                      </div>
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button onClick={() => setQty(l.key, l.qty - 1)} className="grid h-9 w-9 place-items-center text-muted hover:text-ink" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-[14px] font-semibold text-ink">{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty + 1)} className="grid h-9 w-9 place-items-center text-muted hover:text-ink" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="w-28 text-right font-display text-[16px] font-bold text-ink">{unit == null ? <span className="text-[13px] font-medium text-faint">Quote</span> : fmtPrice(unit * l.qty)}</p>
                    </li>
                  )
                })}
              </ul>
              <Link to="/shop" className="link-u mt-5 inline-flex text-[14px] font-medium text-grass">← Continue shopping</Link>
            </div>

            <aside className="h-fit rounded-2xl border border-ink/10 bg-paper p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-[19px] font-bold text-ink">Order summary</h2>
              <dl className="mt-5 space-y-3 text-[14.5px]">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold text-ink">{subtotal == null ? 'Quote needed' : fmtPrice(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-ink">Confirmed after order</dd></div>
                <div className="flex justify-between border-t border-ink/10 pt-3 text-[16px]"><dt className="font-bold text-ink">Estimated total</dt><dd className="font-display font-bold text-ink">{subtotal == null ? 'Quote' : fmtPrice(subtotal)}</dd></div>
              </dl>
              <button onClick={() => nav(me ? '/checkout' : '/login?next=/checkout')} disabled={!cart.length} className="btn-micro mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-grass py-3.5 text-[15px] font-semibold text-white hover:bg-grass-deep disabled:opacity-50">
                <Lock className="h-4 w-4" /> Proceed to checkout
              </button>
              {!me && me !== undefined && <p className="mt-3 text-center text-[12.5px] text-muted">You'll sign in or create an account first.</p>}
              <ul className="mt-6 space-y-2.5 border-t border-ink/10 pt-5 text-[13px] text-muted">
                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-grass" />No payment now. We confirm stock and delivery cost first.</li>
                <li className="flex gap-2"><Truck className="h-4 w-4 shrink-0 text-grass" />Track every step in your dashboard.</li>
              </ul>
            </aside>
          </div>
        )}
      </div>
    </Shell>
  )
}
