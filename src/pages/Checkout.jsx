import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Plus, Lock, ShieldCheck, Loader2, MapPin, CreditCard, ClipboardList, ArrowLeft } from 'lucide-react'
import { Shell, accountApi } from './Account'
import { Steps } from './Cart'
import { useCart } from '../cart'
import { useAuth } from '../auth'
import { useSite } from '../site'
import { packImage } from '../components/Home'
import { totalOf, PAYMENT } from '../components/Order'
import { AddressCard, AddressForm, EMPTY_ADDRESS } from '../components/Address'
import { money, priceOf, currencyOf } from '../lib'

const field = 'w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[14.5px] text-ink outline-none transition placeholder:text-faint focus:border-grass focus:ring-4 focus:ring-grass/10'

function Section({ n, title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-5 md:p-7">
      <h2 className="mb-5 flex items-center gap-3 font-display text-[18px] font-bold text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-grass text-[13px] text-white">{n}</span>
        {title}
        <Icon className="ml-auto h-5 w-5 text-faint" />
      </h2>
      {children}
    </section>
  )
}

export default function Checkout() {
  const { price: fmtPrice } = useCart()
  const { me } = useAuth()
  const { cart, mode, setMode, clear, ready, converted, displayCurrency } = useCart()
  const { contact } = useSite()
  const [addresses, setAddresses] = useState(null)
  const [selected, setSelected] = useState(null) // address id or 'new'
  const [draft, setDraft] = useState(EMPTY_ADDRESS)
  const [saveNew, setSaveNew] = useState(true)
  const [payment, setPayment] = useState('')
  const [shipping, setShipping] = useState('fob')
  const [neededBy, setNeededBy] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(null) // reference once the order is placed

  const local = mode === 'local'
  const cur = currencyOf(mode)
  const subtotal = totalOf(cart, mode)
  const hub = contact.hub || contact.city || 'Nigeria'
  const SHIP = [['air', 'Air freight', 'Small parcels, fastest'], ['fob', `Sea freight – FOB ${hub}`, 'You arrange the ship from our port'], ['cif', 'Sea freight – CIF to my port', 'We ship to your port'], ['advise', 'Not sure – please advise', "We'll suggest the best option"]]

  useEffect(() => {
    if (!me) return
    accountApi('/addresses').then(list => {
      setAddresses(list)
    }).catch(() => setAddresses([]))
  }, [me])

  // addresses that match where they're buying (Nigeria vs abroad)
  const matching = useMemo(() => (addresses || []).filter(a => a.deliveryType === mode), [addresses, mode])
  useEffect(() => {
    if (!addresses) return
    const def = matching.find(a => a.isDefault) || matching[0]
    setSelected(def ? def.id : 'new')
    setDraft(d => ({ ...d, deliveryType: mode, fullName: d.fullName || me?.name || '', phone: d.phone || me?.phone || '' }))
    setPayment('')
  }, [addresses, matching, mode, me])

  if (me === null) return <Navigate to="/login?next=/checkout" replace />
  if (me === undefined || !ready) return <Shell><div className="grid place-items-center py-32 text-muted"><Loader2 className="h-6 w-6 animate-spin" /></div></Shell>
  if (placed) return <Navigate to={`/order-success/${placed}`} replace />
  if (!cart.length) return <Navigate to="/cart" replace />

  const pay = payment || PAYMENT[mode][0]

  async function placeOrder() {
    setBusy(true); setErrors([])
    try {
      let addr = matching.find(a => a.id === selected)
      if (!addr) {
        if (saveNew) addr = await accountApi('/addresses', { method: 'POST', body: { ...draft, deliveryType: mode } })
        else addr = { ...draft, deliveryType: mode }
      }
      const order = await accountApi('/api/orders', {
        method: 'POST',
        body: {
          customer: { name: me.name, phone: addr.phone || me.phone, company: me.company, buyerType: me.buyerType },
          delivery: local
            ? { type: 'local', country: 'Nigeria', state: addr.state, city: addr.city, address: [addr.address, addr.fullName !== me.name ? `Recipient: ${addr.fullName}, ${addr.phone}` : ''].filter(Boolean).join(' · ') }
            : { type: 'international', country: addr.country, city: addr.city, port: addr.port, shipping },
          payment: pay,
          neededBy,
          items: cart.map(l => ({ productId: l.product.id, sizeId: l.size.id, qty: l.qty })),
          notes: [notes, !local && addr.address ? `Delivery address: ${addr.address}` : '', addr.fullName !== me.name && !local ? `Recipient: ${addr.fullName}, ${addr.phone}` : ''].filter(Boolean).join('\n'),
        },
      })
      setPlaced(order.reference) // set first, so emptying the cart doesn't bounce to /cart
      clear()
    } catch (err) {
      setErrors(err.message.split(/(?<=\.)\s+/))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/cart" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
            <h1 className="mt-2 font-display text-[30px] font-extrabold text-ink md:text-[36px]">Checkout</h1>
          </div>
          <Steps step={1} />
        </div>
        {errors.length > 0 && <ul className="mt-6 rounded-xl bg-ruby/10 px-4 py-3 text-[14px] text-ruby" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Section n="1" title="Delivery address" icon={MapPin}>
              <div className="mb-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Where should we deliver?">
                {[['local', 'Deliver in Nigeria · ₦'], ['international', 'Ship abroad · $']].map(([v, l]) => (
                  <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)}
                    className={`rounded-full px-4 py-2 text-[13.5px] font-medium ${mode === v ? 'bg-grass text-white' : 'border border-ink/15 text-muted hover:border-ink/40'}`}>{l}</button>
                ))}
              </div>
              {addresses === null ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {matching.map(a => <AddressCard key={a.id} a={a} selected={selected === a.id} onSelect={() => setSelected(a.id)} />)}
                  <button type="button" onClick={() => setSelected('new')} aria-pressed={selected === 'new'}
                    className={`flex min-h-[120px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-[14px] font-semibold ${selected === 'new' ? 'border-grass text-grass' : 'border-ink/20 text-muted hover:border-ink/40'}`}>
                    <Plus className="h-5 w-5" /> {matching.length ? 'Use a new address' : 'Add a delivery address'}
                  </button>
                </div>
              )}
              {selected === 'new' && (
                <div className="mt-5 rounded-2xl bg-mist p-4 md:p-5">
                  <AddressForm value={{ ...draft, deliveryType: mode }} onChange={setDraft} lockType />
                  <label className="mt-3 flex items-center gap-2 text-[13.5px] text-ink"><input type="checkbox" checked={saveNew} onChange={e => setSaveNew(e.target.checked)} /> Save this address to my account</label>
                </div>
              )}
              {!local && (
                <div className="mt-6">
                  <p className="mb-3 text-[13.5px] font-semibold text-ink">Shipping method</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SHIP.map(([v, l, d]) => (
                      <button key={v} type="button" onClick={() => setShipping(v)} aria-pressed={shipping === v}
                        className={`rounded-xl border-2 p-3 text-left ${shipping === v ? 'border-grass bg-grass/5' : 'border-ink/10 hover:border-ink/30'}`}>
                        <span className="block text-[14px] font-semibold text-ink">{l}</span>
                        <span className="block text-[12.5px] text-muted">{d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section n="2" title="Payment & timing" icon={CreditCard}>
              <p className="mb-3 text-[13.5px] text-muted">You don't pay now. After we confirm stock and delivery cost, we'll send payment details for the method you choose.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PAYMENT[mode].map(p => (
                  <button key={p} type="button" onClick={() => setPayment(p)} aria-pressed={pay === p}
                    className={`rounded-xl border-2 p-3 text-left text-[14px] font-semibold text-ink ${pay === p ? 'border-grass bg-grass/5' : 'border-ink/10 hover:border-ink/30'}`}>{p}</button>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-[13px] text-muted">Needed by (optional)</span>
                  <input type="date" className={field} value={neededBy} min={new Date().toISOString().slice(0, 10)} onChange={e => setNeededBy(e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className="mb-1.5 block text-[13px] text-muted">Order notes (optional)</span>
                  <textarea className={`${field} min-h-24 resize-y`} placeholder="Packaging, labels, specifications (FFA, moisture), documents…" value={notes} onChange={e => setNotes(e.target.value)} /></label>
              </div>
            </Section>
          </div>

          <aside className="h-fit rounded-2xl border border-ink/10 bg-paper p-6 lg:sticky lg:top-28">
            <h2 className="flex items-center justify-between font-display text-[19px] font-bold text-ink">Order review <ClipboardList className="h-5 w-5 text-faint" /></h2>
            <ul className="mt-4 max-h-72 divide-y divide-ink/10 overflow-y-auto">
              {cart.map(l => {
                const unit = priceOf(l.size, mode)
                return (
                  <li key={l.key} className="flex items-center gap-3 py-3">
                    <span className="relative h-14 w-14 shrink-0 rounded-lg border border-ink/10 bg-white">
                      <img src={packImage(l.product, l.size)} alt="" className="h-full w-full object-contain p-1" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10.5px] font-bold text-paper">{l.qty}</span>
                    </span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-ink">{l.product.name}</span><span className="text-[12.5px] text-muted">{l.size.label}</span></span>
                    <span className="text-[14px] font-semibold text-ink">{unit == null ? 'Quote' : fmtPrice(unit * l.qty)}</span>
                  </li>
                )
              })}
            </ul>
            <dl className="mt-4 space-y-2.5 border-t border-ink/10 pt-4 text-[14.5px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold text-ink">{subtotal == null ? 'Quote needed' : fmtPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-ink">Confirmed after order</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-[16px]"><dt className="font-bold text-ink">Estimated total</dt><dd className="font-display font-bold text-ink">{subtotal == null ? 'Quote' : fmtPrice(subtotal)}</dd></div>
            </dl>
            <button onClick={placeOrder} disabled={busy} className="btn-micro mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ruby py-4 text-[15.5px] font-bold text-white shadow-lg shadow-ruby/20 hover:brightness-110 disabled:opacity-60">
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing order…</> : <><Lock className="h-4 w-4" /> Place order</>}
            </button>
            {converted && <p className="mt-3 text-[12.5px] text-muted">Prices shown in {displayCurrency} are approximate. Your order is charged in US dollars{subtotal != null ? ` (${money(subtotal, 'USD')} before delivery)` : ''}.</p>}
            <p className="mt-3 flex items-start gap-2 text-[12.5px] text-muted"><ShieldCheck className="h-4 w-4 shrink-0 text-grass" />Ordering as <b className="text-ink">{me.email}</b>. We'll email your confirmation and you can track it in your dashboard.</p>
          </aside>
        </div>
      </div>
    </Shell>
  )
}
