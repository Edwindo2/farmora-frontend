import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Mail, Truck, LayoutDashboard, ShoppingBag } from 'lucide-react'
import { Shell, accountApi } from './Account'
import { Steps } from './Cart'
import { fmt } from '../admin/ui'

// Shown right after checkout.
export default function OrderSuccess() {
  const { reference } = useParams()
  const [order, setOrder] = useState(null)
  useEffect(() => { accountApi(`/orders/${reference}`).then(setOrder).catch(() => {}) }, [reference])
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-5 py-10 lg:py-16">
        <div className="flex justify-center"><Steps step={3} /></div>
        <div className="mt-10 rounded-3xl border border-ink/10 bg-paper p-8 text-center shadow-xl md:p-12">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-grass/10 text-grass" style={{ animation: 'heroIn .5s both' }}><CheckCircle2 className="h-11 w-11" /></span>
          <h1 className="mt-6 font-display text-[30px] font-extrabold text-ink md:text-[36px]">Thank you for your order!</h1>
          <p className="mt-2 text-[15px] text-muted">Your order reference is</p>
          <p className="mt-1 font-display text-[26px] font-bold tracking-wide text-grass">{reference}</p>
          {order && (
            <p className="mt-2 text-[14px] text-muted">{order.items.reduce((s, i) => s + i.qty, 0)} item(s) · Subtotal {order.subtotal == null ? 'to be quoted' : fmt(order.subtotal, order.currency)} · {order.destination}</p>
          )}
          <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
            {[[Mail, 'Check your email', "We've sent your order confirmation."], [CheckCircle2, 'We confirm', 'Stock, delivery cost and payment details within one business day.'], [Truck, 'Track it', 'Follow every step in your dashboard.']].map(([Icon, t, d]) => (
              <li key={t} className="rounded-2xl bg-mist p-4"><Icon className="h-5 w-5 text-grass" /><p className="mt-2 text-[14px] font-semibold text-ink">{t}</p><p className="mt-1 text-[12.5px] leading-relaxed text-muted">{d}</p></li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/account/orders/${reference}`} className="btn-micro inline-flex items-center gap-2 rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep"><Truck className="h-4 w-4" /> Track this order</Link>
            <Link to="/account" className="btn-micro inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-[14px] font-semibold text-ink hover:border-grass hover:text-grass"><LayoutDashboard className="h-4 w-4" /> My dashboard</Link>
            <Link to="/shop" className="btn-micro inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-muted hover:text-ink"><ShoppingBag className="h-4 w-4" /> Continue shopping</Link>
          </div>
        </div>
      </div>
    </Shell>
  )
}
