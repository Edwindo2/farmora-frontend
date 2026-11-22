import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Badge, FLOW, fmt, date } from '../admin/ui'
import { LanguagePicker } from '../translate'

// Public order tracking: customers enter their order reference and email.
export default function Track() {
  const [params, setParams] = useSearchParams()
  const [ref, setRef] = useState(params.get('ref') || '')
  const [email, setEmail] = useState(params.get('email') || '')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookup(r = ref, e = email) {
    if (!r || !e) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/orders/track?reference=${encodeURIComponent(r.trim())}&email=${encodeURIComponent(e.trim())}`)
      const data = await res.json()
      if (!res.ok) { setOrder(null); setError(data.error) } else { setOrder(data); setParams({ ref: r.trim().toUpperCase() }, { replace: true }) }
    } catch {
      setError('We could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // came from the order confirmation link
  useEffect(() => { if (params.get('ref') && params.get('email')) lookup() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const step = order ? FLOW.indexOf(order.status) : -1

  return (
    <div className="min-h-svh bg-mist">
      <header className="flex items-center justify-between px-5 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-black/5"><img src="/emblem.png" alt="" className="h-9 w-9" /></span>
          <span className="font-brand text-[16px] font-semibold tracking-[0.16em] text-ink">FARMORA</span>
        </Link>
        <div className="flex items-center gap-4"><LanguagePicker variant="pill" /><Link to="/" className="link-u text-[13px] text-muted">← Back to shop</Link></div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <p className="text-[11px] tracking-[0.28em] uppercase text-scarlet">Track your order</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.03em] md:text-6xl">Where's my <em>oil?</em></h1>

        <form onSubmit={e => { e.preventDefault(); lookup() }} className="mt-10 grid gap-3 rounded-xl border border-ink/10 bg-paper p-5 sm:grid-cols-[1fr_1.3fr_auto]">
          <input className="rounded-lg border border-ink/15 px-3 py-2.5 text-[14px] uppercase outline-none focus:border-ink" placeholder="Order ref, e.g. FM-7Q2K9D" value={ref} onChange={e => setRef(e.target.value)} />
          <input className="rounded-lg border border-ink/15 px-3 py-2.5 text-[14px] outline-none focus:border-ink" type="email" placeholder="Email used on the order" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn-micro rounded-lg bg-grass px-5 py-2.5 text-[14px] font-medium text-white hover:bg-grass-deep" disabled={loading}>{loading ? 'Checking…' : 'Track'}</button>
        </form>
        {error && <p className="mt-4 text-[14px] text-scarlet" role="alert">{error}</p>}
        <p className="mt-4 text-[13px] text-muted">Ordered more than once? <Link to="/account" className="link-u text-ink">Sign in to see all your orders</Link></p>

        {order && (
          <div className="mt-10 space-y-6">
            <div className="rounded-xl border border-ink/10 bg-paper p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] text-faint">Order {order.reference} · placed {date(order.createdAt)}</p>
                  <p className="mt-2 font-serif text-3xl">{order.statusText}</p>
                </div>
                <Badge light value={order.status} />
              </div>

              {order.status !== 'cancelled' && (
                <ol className="mt-8 grid grid-cols-6 gap-1">
                  {FLOW.map((s, i) => (
                    <li key={s} className="text-center">
                      <div className={`h-1.5 rounded-full transition-colors duration-700 ${i <= step ? 'bg-grass' : 'bg-ink/10'}`} />
                      <p className={`mt-2 text-[10px] capitalize tracking-wide sm:text-[11px] ${i <= step ? 'text-ink' : 'text-faint'}`}>{s}</p>
                    </li>
                  ))}
                </ol>
              )}
              {order.trackingNumber && <p className="mt-6 text-[14px]">Tracking number: <b>{order.trackingNumber}</b></p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-ink/10 bg-paper p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Items</p>
                <ul className="mt-3 divide-y divide-ink/10">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-4 py-3 text-[14px]">
                      <span>{it.qty} × {it.name} <span className="text-faint">({it.size})</span></span>
                      <span>{it.lineTotal == null ? 'Quote' : fmt(it.lineTotal, order.currency)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-[14px]">
                  <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{fmt(order.subtotal, order.currency)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryFee == null ? 'To be confirmed' : fmt(order.deliveryFee, order.currency)}</dd></div>
                  <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{fmt(order.total, order.currency)}</dd></div>
                </dl>
              </div>
              <div className="rounded-xl border border-ink/10 bg-paper p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Updates</p>
                <ol className="mt-4 space-y-5 border-l border-ink/15 pl-5">
                  {[...order.events].reverse().map((e, i) => (
                    <li key={i} className="relative">
                      <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-scarlet' : 'bg-ink/30'}`} />
                      <p className="text-[13px] font-medium capitalize">{e.status}</p>
                      {e.note && <p className="text-[13px] text-muted">{e.note}</p>}
                      <p className="text-[11px] text-faint">{date(e.at)}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-[12px] text-faint">Delivering to {order.destination}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Tracking now lives in the customer dashboard. Old /track links (e.g. in earlier emails) go there.
export function TrackRedirect() {
  const [params] = useSearchParams()
  const ref = (params.get('ref') || '').trim().toUpperCase()
  return <Navigate to={ref ? `/account/orders/${encodeURIComponent(ref)}` : '/account'} replace />
}
