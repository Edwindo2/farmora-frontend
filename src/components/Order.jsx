import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { SectionHead, Backdrop } from './Story'
import { ModeToggle } from './Shop'
import { useCart } from '../cart'
import { AuthForms } from '../pages/Account'
import { money, priceOf, currencyOf } from '../lib'

const field =
  'w-full border-b border-ink/20 bg-transparent py-3 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-scarlet'

export function Lines({ cart, mode, setQty, remove }) {
  const { price: fmtPrice } = useCart()
  const cur = currencyOf(mode)
  if (!cart.length) return <p className="py-6 text-[14px] text-faint">Your order is empty. Add a product to get started.</p>
  return (
    <ul>
      {cart.map(l => (
        <li key={l.key} className="flex items-center gap-4 border-b border-ink/10 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[16px] font-semibold">{l.product.name}</p>
            <p className="text-[12px] text-faint">{l.size.label}</p>
          </div>
          <div className="flex items-center rounded-full border border-ink/15 text-[13px]">
            <button className="px-3 py-1.5 text-muted hover:text-ink" onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-6 text-center">{l.qty}</span>
            <button className="px-3 py-1.5 text-muted hover:text-ink" onClick={() => setQty(l.key, l.qty + 1)} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
          </div>
          <p className="w-28 text-right text-[14px]">
            {priceOf(l.size, mode) == null ? <span className="text-faint">Quote</span> : fmtPrice(priceOf(l.size, mode) * l.qty)}
          </p>
          <button onClick={() => remove(l.key)} className="text-faint hover:text-ink" aria-label={`Remove ${l.product.name}`}><Trash2 className="h-4 w-4" /></button>
        </li>
      ))}
    </ul>
  )
}

export function totalOf(cart, mode) {
  if (cart.some(l => priceOf(l.size, mode) == null)) return null
  return cart.reduce((s, l) => s + priceOf(l.size, mode) * l.qty, 0)
}

export const NG_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara']
export const SHIPPING = ['Air freight (small parcels)', 'Sea freight – FOB Lagos', 'Sea freight – CIF to my port', 'Not sure – please advise']
export const PAYMENT = {
  local: ['Bank transfer', 'Card payment (link)', 'Pay on delivery (Lagos only)'],
  international: ['Bank transfer (USD)', 'Letter of credit', 'Not sure – please advise'],
}

const EMPTY = { buyerType: 'individual', name: '', email: '', phone: '', company: '', country: '', state: '', city: '', address: '', port: '', shipping: SHIPPING[0], payment: '', neededBy: '', notes: '' }

function Group({ n, title, children }) {
  return (
    <fieldset>
      <legend className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.24em] uppercase text-faint">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-grass text-[10px] tracking-normal text-white">{n}</span>
        {title}
      </legend>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export default function Order() {
  const { price: fmtPrice } = useCart()
  const { cart, mode, setMode, setQty, remove, clear } = useCart()
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState({ status: 'idle', errors: [], result: null })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const total = totalOf(cart, mode)
  const local = mode === 'local'
  const payment = form.payment || PAYMENT[mode][0]
  const [me, setMe] = useState(null)
  const [meLoaded, setMeLoaded] = useState(false)
  const [meTick, setMeTick] = useState(0)

  // Customers must be signed in to order. Once they are, fill in their details from the account and last order.
  useEffect(() => {
    fetch('/api/account/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return
        setMe(data)
        const d = data.lastDelivery || {}
        const ship = { air: 0, fob: 1, cif: 2, advise: 3 }[d.shippingMethod]
        setForm(f => ({
          ...f,
          buyerType: data.buyerType || f.buyerType,
          name: f.name || data.name || '',
          email: f.email || data.email || '',
          phone: f.phone || data.phone || '',
          company: f.company || data.company || '',
          state: f.state || d.state || '',
          city: f.city || d.city || '',
          address: f.address || d.address || '',
          country: f.country || (d.type === 'international' ? d.country : '') || '',
          port: f.port || d.port || '',
          shipping: ship != null ? SHIPPING[ship] : f.shipping,
        }))
      })
      .catch(() => {})
      .finally(() => setMeLoaded(true))
  }, [meTick])

  async function submit(e) {
    e.preventDefault()
    if (!me) {
      document.getElementById('order-signin')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return setState({ status: 'error', errors: ['Please sign in or create an account first.'], result: null })
    }
    setState({ status: 'sending', errors: [], result: null })
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { buyerType: form.buyerType, name: form.name, email: form.email, phone: form.phone, company: form.company },
          delivery: local
            ? { type: 'local', country: 'Nigeria', state: form.state, city: form.city, address: form.address }
            : { type: 'international', country: form.country, city: form.city, port: form.port, shipping: form.shipping },
          payment,
          neededBy: form.neededBy,
          items: cart.map(l => ({ productId: l.product.id, sizeId: l.size.id, qty: l.qty })),
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) return setState({ status: 'error', errors: data.errors || ['Something went wrong.'], result: null })
      setState({ status: 'done', errors: [], result: { ...data, email: form.email.trim() } })
      // keep a signed-in buyer's details for the next order
      setForm(me ? f => ({ ...f, payment: '', neededBy: '', notes: '' }) : EMPTY)
      clear()
    } catch {
      setState({ status: 'error', errors: ['We could not reach the server. Please try again.'], result: null })
    }
  }

  const needed = local
    ? ['Products and pack sizes', 'Your name, email and phone / WhatsApp', 'State, city and full delivery address', 'How you would like to pay']
    : ['Products, pack sizes and volume', 'Your name, email and phone / WhatsApp', 'Country, city and destination port', 'Shipping method (air, FOB or CIF)', 'How you would like to pay']

  return (
    <section id="order" className="relative overflow-hidden px-5 py-28 md:px-12 md:py-40">
      <Backdrop src="/bg/fronds.jpg" className="-scale-x-100 dark:opacity-20" overlay="bg-paper/55" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHead n="02" label="Order" title={<>Bring it <em>home.</em></>}>
          Send us your order and we will confirm stock, delivery cost and payment details by email within one business day.
        </SectionHead>

        {state.status === 'done' ? (
          <div className="reveal in border border-scarlet/40 bg-mist p-10 md:p-14">
            <p className="eyebrow">Order received</p>
            <h3 className="mt-5 font-display text-4xl font-bold">Thank you.</h3>
            <p className="mt-5 max-w-[34em] font-light leading-relaxed text-muted">
              Your order reference is <span className="text-ink">{state.result.id}</span>. We will email you shortly to
              confirm delivery and payment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={`/account/orders/${state.result.id}`} className="btn-micro rounded-full bg-grass px-6 py-3 text-[13px] font-medium text-white hover:bg-grass-deep">
                Track this order <span className="arr">→</span>
              </Link>
              <button onClick={() => setState({ status: 'idle', errors: [], result: null })} className="btn-micro rounded-full border border-ink/30 px-6 py-3 text-[13px] hover:border-ink">
                Place another order
              </button>
              <Link to="/account" className="btn-micro rounded-full px-6 py-3 text-[13px] text-muted hover:text-ink">
                My dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
          {meLoaded && !me && (
            <div id="order-signin" className="reveal in mb-14 grid items-center gap-8 rounded-3xl border border-grass/25 bg-paper p-6 shadow-lg md:grid-cols-[1fr_400px] md:p-10">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-grass">Step 1 · Your account</p>
                <h3 className="mt-2 font-display text-[28px] font-bold leading-tight text-ink">Sign in or create an account to order</h3>
                <p className="mt-3 max-w-[30em] text-[15px] leading-relaxed text-muted">Your account keeps every order in one place, so you can follow delivery, see the full tracking history and reorder in one click.</p>
              </div>
              <AuthForms initial="register" compact onDone={() => setMeTick(t => t + 1)} />
            </div>
          )}
          <form onSubmit={submit} className="reveal grid gap-14 md:grid-cols-[1.1fr_.9fr] md:gap-20" noValidate>
            <div className="space-y-12">
              <div>
                <p className="mb-4 text-[11px] tracking-[0.24em] uppercase text-faint">Where are you buying from?</p>
                <ModeToggle mode={mode} setMode={m => { setMode(m); setForm(f => ({ ...f, payment: '' })) }} />
              </div>

              <div className="rounded-sm border border-ink/10 bg-mist/80 p-6">
                <p className="text-[11px] tracking-[0.24em] uppercase text-scarlet">What we need to process your order</p>
                <ul className="mt-4 grid gap-2 text-[14px] text-muted sm:grid-cols-2">
                  {needed.map(n => (
                    <li key={n} className="flex gap-2.5"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-scarlet" />{n}</li>
                  ))}
                </ul>
              </div>

              {me && (
                <p className="-mb-6 text-[13px] text-muted">Signed in as <span className="text-ink">{me.email}</span>. We've filled in your details. <Link to="/account" className="link-u text-ink">My dashboard</Link></p>
              )}

              <Group n="1" title="About you">
                <div className="flex gap-2 sm:col-span-2" role="radiogroup" aria-label="Buyer type">
                  {[['individual', 'Individual / household'], ['business', 'Business / company']].map(([v, l]) => (
                    <button type="button" key={v} role="radio" aria-checked={form.buyerType === v} onClick={() => setForm(f => ({ ...f, buyerType: v }))}
                      className={`btn-micro rounded-full px-4 py-2 text-[13px] ${form.buyerType === v ? 'bg-grass text-white' : 'border border-ink/15 text-muted hover:border-ink/40'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <input className={field} placeholder="Full name *" value={form.name} onChange={set('name')} autoComplete="name" />
                <input className={`${field} disabled:opacity-60`} placeholder="Email *" type="email" value={form.email} onChange={set('email')} autoComplete="email" disabled={!!me} title={me ? "Orders use your account email" : undefined} />
                <input className={field} placeholder="Phone / WhatsApp *" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                <input className={field} placeholder={form.buyerType === 'business' ? 'Company name *' : 'Company (optional)'} value={form.company} onChange={set('company')} autoComplete="organization" />
              </Group>

              <Group n="2" title={local ? 'Delivery address' : 'Shipping details'}>
                {local ? (
                  <>
                    <select className={field} value={form.state} onChange={set('state')} aria-label="State">
                      <option value="">State *</option>
                      {NG_STATES.map(st => <option key={st}>{st}</option>)}
                    </select>
                    <input className={field} placeholder="City / town *" value={form.city} onChange={set('city')} autoComplete="address-level2" />
                    <input className={`${field} sm:col-span-2`} placeholder="Street address, landmark *" value={form.address} onChange={set('address')} autoComplete="street-address" />
                  </>
                ) : (
                  <>
                    <input className={field} placeholder="Country *" value={form.country} onChange={set('country')} autoComplete="country-name" />
                    <input className={field} placeholder="City *" value={form.city} onChange={set('city')} autoComplete="address-level2" />
                    <input className={field} placeholder="Destination port / airport *" value={form.port} onChange={set('port')} />
                    <select className={field} value={form.shipping} onChange={set('shipping')} aria-label="Shipping method">
                      {SHIPPING.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </>
                )}
              </Group>

              <Group n="3" title="Payment & timing">
                <select className={field} value={payment} onChange={set('payment')} aria-label="Preferred payment">
                  {PAYMENT[mode].map(o => <option key={o}>{o}</option>)}
                </select>
                <label className="flex flex-col">
                  <span className="text-[11px] tracking-[0.12em] uppercase text-faint">Needed by (optional)</span>
                  <input className={field} type="date" value={form.neededBy} onChange={set('neededBy')} min={new Date().toISOString().slice(0, 10)} />
                </label>
                <textarea className={`${field} min-h-24 resize-y sm:col-span-2`} placeholder="Notes: packaging, labels, specs (FFA, moisture), documents…" value={form.notes} onChange={set('notes')} />
              </Group>
            </div>

            <div className="self-start border border-ink/10 bg-paper p-7 md:p-9">
              <p className="text-[11px] tracking-[0.24em] uppercase text-faint">Your order</p>
              <Lines cart={cart} mode={mode} setQty={setQty} remove={remove} />
              <div className="flex items-baseline justify-between pt-6">
                <span className="text-muted">Subtotal</span>
                <span className="font-display text-[24px] font-bold">{cart.length ? fmtPrice(total) : '—'}</span>
              </div>
              <p className="mt-2 text-[12px] text-faint">Delivery cost is confirmed after you order. You won't be charged yet.</p>
              {state.errors.length > 0 && (
                <ul className="mt-6 space-y-1 text-[13px] text-scarlet" role="alert">
                  {state.errors.map(e => <li key={e}>{e}</li>)}
                </ul>
              )}
              <button
                type="submit"
                disabled={state.status === 'sending'}
                className="btn-micro mt-8 w-full rounded-full bg-grass py-4 text-[14px] font-medium text-white hover:bg-grass-deep disabled:opacity-60"
              >
                {state.status === 'sending' ? 'Sending…' : 'Send order'}
              </button>
              {meLoaded && !me && <p className="mt-3 text-center text-[12.5px] text-faint">Sign in or create an account above to send your order.</p>}
            </div>
          </form>
          </>
        )}
      </div>
    </section>
  )
}
