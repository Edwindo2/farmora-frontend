import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Building2, ArrowRight, ArrowLeft, Package, LogOut, RotateCcw, Truck, MapPin,
  CheckCircle2, Loader2, LayoutDashboard, ListOrdered, History, UserCog, Clock, CircleDot, KeyRound,
  Globe2, Store, FileText, Heart, ShoppingBag, Printer, BadgeCheck, Hourglass,
} from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { Badge, FLOW, fmt, date } from '../admin/ui'
import { useAuth } from '../auth'
import { AddressCard, AddressForm, EMPTY_ADDRESS } from '../components/Address'
import { useCart } from '../cart'
import { useWishlist, WishButton } from '../wishlist'
import { packImage } from '../components/Home'
import { quoteHref } from '../lib'

// Customer accounts: register / sign in, then a dashboard with orders, live tracking and tracking history.

export async function accountApi(path, { method = 'GET', body } = {}) {
  const res = await fetch(path.startsWith('/api/') ? path : `/api/account${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || (data.errors || []).join(' ') || 'Something went wrong.')
    err.status = res.status
    throw err
  }
  return data
}

// Loads the signed-in customer: undefined = loading, null = signed out.
export function useMe() {
  const { me, setMe, reload } = useAuth()
  return [me, setMe, reload]
}

const ACCOUNT_TYPES = [
  ['wholesale', 'Wholesale', 'Bulk buyers in Nigeria', Store],
  ['international', 'International', 'Bulk buyers abroad', Globe2],
]
const COUNTRIES = ['Nigeria', 'Ghana', 'Benin', 'Togo', 'Cameroon', 'Côte d’Ivoire', 'Senegal', 'South Africa', 'Kenya', 'United Kingdom', 'Ireland', 'United States', 'Canada', 'Germany', 'France', 'Netherlands', 'Belgium', 'Italy', 'Spain', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'China', 'India', 'Malaysia', 'Australia']

const STATUS_ICON = { received: Clock, confirmed: CheckCircle2, paid: CheckCircle2, processing: CircleDot, shipped: Truck, delivered: Package, cancelled: CircleDot }
const Spinner = () => <div className="grid place-items-center py-24 text-muted"><Loader2 className="h-6 w-6 animate-spin" /></div>
const inputBox = 'flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-4 py-3 transition focus-within:border-grass focus-within:ring-4 focus-within:ring-grass/10'
const primary = 'btn-micro flex w-full items-center justify-center gap-2 rounded-full bg-grass py-3.5 text-[15px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60'

function Field({ icon: Icon, right, ...props }) {
  return (
    <label className={inputBox}>
      <Icon className="h-[18px] w-[18px] shrink-0 text-faint" strokeWidth={1.7} />
      <input {...props} className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint disabled:text-muted" />
      {right}
    </label>
  )
}

// Password rules, checked as the customer types. The server checks the same rules.
const PASSWORD_RULES = [
  ['At least 8 characters', pw => pw.length >= 8],
  ['At least one letter', pw => /[A-Za-z]/.test(pw)],
  ['At least one number', pw => /\d/.test(pw)],
]
function passwordErrors(pw, confirm) {
  const errs = PASSWORD_RULES.filter(([, ok]) => !ok(pw)).map(([l]) => `Password: ${l.toLowerCase()}.`)
  if (pw !== confirm) errs.push('The two passwords do not match.')
  return errs
}
function PasswordRules({ pw, confirm }) {
  const rows = [...PASSWORD_RULES.map(([l, ok]) => [l, ok(pw)]), ['Both passwords match', pw.length > 0 && pw === confirm]]
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 px-1 text-[12px]" aria-label="Password requirements">
      {rows.map(([l, ok]) => (
        <li key={l} className={`flex items-center gap-1.5 ${ok ? 'text-grass' : 'text-faint'}`}>
          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${ok ? 'fill-grass text-white dark:text-paper' : ''}`} />{l}
        </li>
      ))}
    </ul>
  )
}

function PasswordField(props) {
  const [show, setShow] = useState(false)
  return (
    <Field icon={Lock} type={show ? 'text' : 'password'} {...props}
      right={<button type="button" onClick={() => setShow(s => !s)} className="text-faint hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}</button>} />
  )
}

function Errors({ list }) {
  if (!list?.length) return null
  return <ul className="rounded-lg bg-ruby/10 px-3 py-2 text-[13.5px] text-ruby" role="alert">{list.map(e => <li key={e}>{e}</li>)}</ul>
}

/**
 * Sign in / create account / email link. Used on the account page and inside the order form.
 * onDone() runs after a successful sign-in or registration.
 */
export function AuthForms({ onDone: done, initial = 'login', compact = false }) {
  const { reload } = useAuth()
  const onDone = async () => { await reload(); done?.() }
  const [tab, setTab] = useState(initial)
  useEffect(() => { setTab(initial) }, [initial])
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', country: 'Nigeria', accountType: 'wholesale', password: '', confirm: '' })
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { title, text }
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErrors([])
    try {
      if (tab === 'login') {
        await accountApi('/login', { method: 'POST', body: { email: f.email, password: f.password } })
        onDone()
      } else if (tab === 'register') {
        const bad = passwordErrors(f.password, f.confirm)
        if (bad.length) { setErrors(bad); return }
        const { confirm: _confirm, ...body } = f
        const r = await accountApi('/register', { method: 'POST', body })
        if (r.verify) setNotice({ title: 'Check your email', text: `You've ordered with ${f.email} before. We've sent a link to confirm it's you. Open it to finish creating your account and see all your orders.` })
        else onDone()
      } else {
        await accountApi('/login-link', { method: 'POST', body: { email: f.email } })
        setNotice({ title: 'Check your email', text: `If ${f.email} has a Farmora account or orders, we've sent a sign-in link. It works once and expires in 20 minutes.` })
      }
    } catch (err) {
      setErrors(err.message.split(/(?<=\.)\s+/))
    } finally {
      setBusy(false)
    }
  }

  if (notice) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-grass/10 text-grass"><Mail className="h-6 w-6" /></span>
        <h2 className="mt-4 font-display text-[24px] font-bold text-ink">{notice.title}</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{notice.text}</p>
        <button onClick={() => { setNotice(null); setTab('login') }} className="link-u mt-6 text-[14px] font-medium text-grass">Back to sign in</button>
      </div>
    )
  }

  const onLogin = tab === 'login' || tab === 'link'
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-full bg-mist p-1" role="tablist">
        {[['login', 'Sign in'], ['register', 'Create account']].map(([v, l]) => {
          const on = v === 'login' ? onLogin : tab === 'register'
          return <button key={v} type="button" role="tab" aria-selected={on} onClick={() => { setTab(v); setErrors([]) }}
            className={`rounded-full py-2.5 text-[14px] font-semibold transition ${on ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</button>
        })}
      </div>
      <form onSubmit={submit} className="space-y-3.5">
        {tab === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
              {ACCOUNT_TYPES.map(([v, l, d, Icon]) => (
                <button type="button" key={v} role="radio" aria-checked={f.accountType === v}
                  onClick={() => setF({ ...f, accountType: v, country: v === 'international' ? (f.country === 'Nigeria' ? '' : f.country) : (f.country || 'Nigeria') })}
                  className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${f.accountType === v ? 'border-grass bg-grass/10' : 'border-ink/10 hover:border-ink/30'}`}>
                  <Icon className={`mx-auto h-5 w-5 ${f.accountType === v ? 'text-grass' : 'text-faint'}`} />
                  <span className="mt-1 block text-[13px] font-semibold text-ink">{l}</span>
                  <span className="block text-[10.5px] leading-tight text-muted">{d}</span>
                </button>
              ))}
            </div>
            {f.accountType === 'wholesale' && <p className="rounded-lg bg-sun/15 px-3 py-2 text-[12.5px] text-ink">We supply in bulk only. Our team checks new wholesale accounts and will contact you with prices.</p>}
            <Field icon={User} placeholder="Your full name" value={f.name} onChange={set('name')} autoComplete="name" required />
            {<Field icon={Building2} placeholder={f.accountType === 'wholesale' ? 'Business / company name' : 'Company name (optional)'} value={f.company} onChange={set('company')} autoComplete="organization" required={f.accountType === 'wholesale'} />}
            <Field icon={Phone} type="tel" placeholder="Phone / WhatsApp" value={f.phone} onChange={set('phone')} autoComplete="tel" required />
            <label className={inputBox}>
              <Globe2 className="h-[18px] w-[18px] shrink-0 text-faint" strokeWidth={1.7} />
              <input list="farmora-countries" placeholder="Country" value={f.country} onChange={set('country')} autoComplete="country-name" required className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint" />
              <datalist id="farmora-countries">{COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
            </label>
          </>
        )}
        <Field icon={Mail} type="email" placeholder="Email address" value={f.email} onChange={set('email')} autoComplete="email" required />
        {tab !== 'link' && <PasswordField placeholder={tab === 'register' ? 'Create a password' : 'Password'} value={f.password} onChange={set('password')} autoComplete={tab === 'register' ? 'new-password' : 'current-password'} required minLength={tab === 'register' ? 8 : undefined} />}
        {tab === 'register' && <>
          <PasswordField placeholder="Confirm password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" required />
          <PasswordRules pw={f.password} confirm={f.confirm} />
        </>}
        {tab === 'login' && <div className="flex justify-end"><button type="button" onClick={() => { setTab('link'); setErrors([]) }} className="text-[13px] font-medium text-grass hover:underline">Forgot password? Email me a link</button></div>}
        {tab === 'link' && <p className="text-[13px] text-muted">We'll email you a one-time link to sign in. You can set a new password from your dashboard.</p>}
        <Errors list={errors} />
        <button className={primary} disabled={busy}>
          {busy ? 'Please wait…' : tab === 'login' ? <>Sign in <ArrowRight className="arr h-4 w-4" /></> : tab === 'register' ? <>Create my account <ArrowRight className="arr h-4 w-4" /></> : <>Email me a sign-in link <ArrowRight className="arr h-4 w-4" /></>}
        </button>
        {tab === 'link' && <button type="button" onClick={() => setTab('login')} className="w-full text-center text-[13px] text-muted hover:text-ink">Back to password sign-in</button>}
      </form>
      {!compact && tab === 'register' && <p className="mt-4 text-center text-[12px] text-faint">Your account keeps your bulk orders, tracking and invoices in one place.</p>}
    </div>
  )
}

export function Shell({ children }) {
  return (
    <>
      <Nav />
      <div className="min-h-[70svh] bg-mist">{children}</div>
      <Footer />
    </>
  )
}

export function SignInPage({ onDone, initial = 'login' }) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
      <div className="hidden lg:block">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-grass">Your Farmora account</p>
        <h1 className="mt-3 font-display text-[44px] font-extrabold leading-[1.05] text-ink">Bulk orders, tracked <span className="text-ruby">in one place.</span></h1>
        <ul className="mt-8 space-y-3 text-[15px] text-ink">
          {['See every order and its status', 'Follow deliveries with live tracking', 'Full history of every tracking update', 'Invoices for every bulk order'].map(t => (
            <li key={t} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 fill-grass text-white" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-ink/10 bg-paper p-7 shadow-xl md:p-9">
        <AuthForms onDone={onDone} initial={initial} />
      </div>
    </div>
  )
}

/* ---------------- dashboard ---------------- */

const TABS = [
  ['overview', 'Overview', LayoutDashboard], ['orders', 'My orders', ListOrdered], ['history', 'Tracking history', History],
  ['reorder', 'Reorder', RotateCcw], ['invoices', 'Invoices', FileText], ['wishlist', 'Wishlist', Heart],
  ['addresses', 'Addresses', MapPin], ['profile', 'Profile', UserCog],
]

// Opens the quote form pre-filled with an order's items, to order the same again.
export function reorderItems(mode, items) {
  const list = items.map(i => `${i.qty} × ${i.name} (${i.size})`).join(', ')
  window.location.href = quoteHref({ type: mode === 'international' ? 'export' : 'wholesale', product: list })
}

function Progress({ status }) {
  const step = FLOW.indexOf(status)
  if (status === 'cancelled') return <p className="text-[13px] text-ruby">This order was cancelled.</p>
  return (
    <ol className="grid grid-cols-6 gap-1">
      {FLOW.map((s, i) => (
        <li key={s} className="text-center">
          <div className={`h-1.5 rounded-full transition-colors duration-700 ${i <= step ? 'bg-grass' : 'bg-ink/10'}`} />
          <p className={`mt-1.5 truncate text-[10px] capitalize sm:text-[11px] ${i <= step ? 'font-medium text-ink' : 'text-faint'}`}>{s}</p>
        </li>
      ))}
    </ol>
  )
}

const confirmed = o => o.deliveryFee != null && o.total != null
const totalText = o => (confirmed(o) ? fmt(o.total, o.currency) : o.subtotal == null ? 'Quote' : fmt(o.subtotal, o.currency))

function OrderRow({ o }) {
  return (
    <Link to={`/account/orders/${o.reference}`} className="lift group block rounded-2xl border border-ink/10 bg-paper p-5 hover:border-grass/40">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
        <div className="min-w-[10rem] flex-1">
          <p className="flex items-center gap-3"><span className="font-display font-bold text-ink">{o.reference}</span><Badge light value={o.status} /></p>
          <p className="mt-1.5 text-[13px] text-muted">{o.items.map(i => `${i.qty} × ${i.name} (${i.size})`).join(', ')}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-faint"><MapPin className="h-3.5 w-3.5" />{o.destination} · {date(o.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-[20px] font-bold text-ink">{totalText(o)}</p>
          <p className="text-[12px] text-faint">{confirmed(o) ? 'Total' : 'Delivery to be confirmed'}</p>
        </div>
      </div>
      <div className="mt-4"><Progress status={o.status} /></div>
    </Link>
  )
}

function HistoryList({ events, limit }) {
  if (!events) return <Spinner />
  if (!events.length) return <p className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center text-[14px] text-muted">No tracking updates yet. They'll appear here as your orders move along.</p>
  const shown = limit ? events.slice(0, limit) : events
  const groups = [] // by day
  for (const e of shown) {
    const day = new Date(e.at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    let g = groups.find(x => x.day === day)
    if (!g) groups.push((g = { day, items: [] }))
    g.items.push(e)
  }
  return (
    <div className="space-y-6">
      {groups.map(g => (
        <section key={g.day}>
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">{g.day}</h3>
          <ol className="relative ml-4 space-y-4 border-l-2 border-ink/10 pl-7">
            {g.items.map(e => {
              const Icon = STATUS_ICON[e.status] || CircleDot
              return (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[45px] top-2 grid h-8 w-8 place-items-center rounded-full ring-4 ring-mist ${e.status === 'delivered' ? 'bg-grass text-white' : e.status === 'cancelled' ? 'bg-ruby text-white' : 'bg-paper text-grass'}`}><Icon className="h-4 w-4" /></span>
                  <div className="rounded-xl border border-ink/10 bg-paper p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[14px] font-semibold capitalize text-ink">{e.status} <Link to={`/account/orders/${e.reference}`} className="ml-1 font-normal normal-case text-grass hover:underline">{e.reference}</Link></p>
                      <span className="text-[12px] text-faint">{new Date(e.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    {e.note && <p className="mt-1 text-[13.5px] text-muted">{e.note}</p>}
                    {e.status === 'shipped' && e.trackingNumber && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink"><Truck className="h-4 w-4 text-muted" /> Tracking number: <b>{e.trackingNumber}</b></p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}

function SetPasswordNotice({ go }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-sun/60 bg-sun/15 p-5">
      <KeyRound className="h-6 w-6 text-ink" />
      <p className="flex-1 text-[14px] text-ink">You signed in with an email link. Set a password so you can sign in faster next time.</p>
      <button onClick={() => go('profile')} className="rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper">Set a password</button>
    </div>
  )
}

const TILES = [
  ['orders', 'My Orders', 'Track current and previous purchases.', ShoppingBag],
  ['reorder', 'Reorder', 'Request the same products again.', RotateCcw],
  ['addresses', 'My Addresses', 'Save delivery destinations.', MapPin],
  ['invoices', 'My Invoices', 'Access receipts and invoices.', FileText],
  ['wishlist', 'My Wishlist', 'Save favourite products.', Heart],
  ['profile', 'My Profile', 'Manage personal information.', UserCog],
]

function WholesaleBanner({ me, go }) {
  if (me.accountType === 'wholesale' && me.wholesaleStatus === 'approved') return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-grass/30 bg-grass/10 p-4 text-[14px] text-ink"><BadgeCheck className="h-5 w-5 text-grass" /><span className="flex-1"><b>Wholesale account approved.</b> Request a bulk quote any time.</span><Link to={quoteHref()} className="font-semibold text-grass hover:underline">Request bulk quote →</Link></div>
  )
  if (me.wholesaleStatus === 'pending') return (
    <div className="flex items-center gap-3 rounded-2xl border border-sun/60 bg-sun/15 p-4 text-[14px] text-ink"><Hourglass className="h-5 w-5" /><span><b>Wholesale request under review.</b> We'll email you once it's approved. You can request a bulk quote in the meantime.</span></div>
  )
  if (me.wholesaleStatus === 'rejected') return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-4 text-[14px] text-muted">Your wholesale request wasn't approved this time. <button onClick={() => go('profile')} className="font-semibold text-grass hover:underline">Tell us more and apply again</button>.</div>
  )
  return null
}

function Overview({ me, orders, events, go }) {
  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  return (
    <div className="space-y-8">
      {!me.hasPassword && <SetPasswordNotice go={go} />}
      <WholesaleBanner me={me} go={go} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TILES.map(([t, l, d, Icon]) => (
          <button key={t} onClick={() => go(t)} className="lift group rounded-2xl border border-ink/10 bg-paper p-5 text-left hover:border-grass/40">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-grass/10 text-grass transition group-hover:bg-grass group-hover:text-white"><Icon className="h-5 w-5" /></span>
            <span className="mt-4 block font-display text-[17px] font-bold text-ink">{l}</span>
            <span className="mt-1 block text-[13px] leading-snug text-muted">{d}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Total orders', orders.length, ListOrdered], ['In progress', active.length, Truck], ['Delivered', orders.filter(o => o.status === 'delivered').length, Package], ['Tracking updates', events?.length ?? '–', History]].map(([l, v, Icon]) => (
          <div key={l} className="rounded-2xl border border-ink/10 bg-paper p-5">
            <Icon className="h-5 w-5 text-grass" />
            <p className="mt-3 font-display text-[28px] font-bold leading-none text-ink">{v}</p>
            <p className="mt-1 text-[13px] text-muted">{l}</p>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[19px] font-bold text-ink">Track your active orders</h2>
          {orders.length > 0 && <button onClick={() => go('orders')} className="text-[13px] font-medium text-grass hover:underline">All orders</button>}
        </div>
        {active.length ? <div className="space-y-3">{active.map(o => <OrderRow key={o.reference} o={o} />)}</div> : (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-faint" strokeWidth={1.5} />
            <p className="mt-3 text-[14.5px] text-muted">{orders.length ? 'No orders in progress right now.' : "You haven't placed an order yet."}</p>
            <Link to={quoteHref()} className="btn-micro mt-5 inline-flex items-center gap-2 rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep"><FileText className="h-4 w-4" /> Request bulk quote</Link>
          </div>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[19px] font-bold text-ink">Recent tracking updates</h2>
          {events?.length > 4 && <button onClick={() => go('history')} className="text-[13px] font-medium text-grass hover:underline">Full history</button>}
        </div>
        <HistoryList events={events} limit={4} />
      </section>
    </div>
  )
}

function Orders({ orders }) {
  const [filter, setFilter] = useState('all')
  const isActive = o => !['delivered', 'cancelled'].includes(o.status)
  const shown = orders.filter(o => filter === 'all' || (filter === 'active' ? isActive(o) : !isActive(o)))
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-ink/10 bg-paper p-1" role="tablist">
          {[['all', 'All'], ['active', 'In progress'], ['done', 'Completed']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`rounded-full px-4 py-1.5 text-[13px] font-medium ${filter === v ? 'bg-grass text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
        <Link to={quoteHref()} className="btn-micro rounded-full border border-ink/20 bg-paper px-5 py-2 text-[13px] font-medium text-ink hover:border-grass hover:text-grass">Request bulk quote <span className="arr">→</span></Link>
      </div>
      {shown.length ? <div className="space-y-3">{shown.map(o => <OrderRow key={o.reference} o={o} />)}</div>
        : <p className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center text-[14px] text-muted">{orders.length ? 'No orders in this list.' : "You haven't placed an order yet."}</p>}
    </div>
  )
}

function Reorder({ orders }) {
  const { products } = useCart()
  const past = orders.filter(o => o.status !== 'cancelled' && o.items.some(i => i.productId))
  // every product+size bought before, most recent first
  const bought = []
  for (const o of past) for (const i of o.items) {
    if (!i.productId || bought.some(b => b.productId === i.productId && b.sizeId === i.sizeId)) continue
    const product = products.find(p => p.id === i.productId)
    const size = product?.sizes.find(s => s.id === i.sizeId)
    if (product && size) bought.push({ ...i, product, size, last: o.createdAt, deliveryType: o.deliveryType })
  }
  if (!past.length) return <p className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center text-[14px] text-muted">Nothing to reorder yet. Products from your orders will appear here.</p>
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-[19px] font-bold text-ink">Order again</h2>
        <p className="mb-4 text-[14px] text-muted">Products you've ordered before.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {bought.map(b => (
            <div key={`${b.productId}:${b.sizeId}`} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper p-4">
              <Link to={`/product/${b.productId}`} className="h-16 w-16 shrink-0 rounded-xl border border-ink/10 bg-white"><img src={packImage(b.product, b.size)} alt="" className="h-full w-full object-contain p-1" /></Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${b.productId}`} className="block truncate font-display text-[15px] font-bold text-ink hover:text-grass">{b.product.name}</Link>
                <p className="text-[12.5px] text-muted">{b.size.label}</p>
                <p className="text-[11.5px] text-faint">Last ordered {date(b.last)}</p>
              </div>
              <Link to={quoteHref({ type: b.deliveryType === 'international' ? 'export' : 'wholesale', product: b.product.name, size: b.size.label, qty: b.qty })} className="btn-micro shrink-0 rounded-full bg-grass px-4 py-2 text-[13px] font-semibold text-white hover:bg-grass-deep">Request quote</Link>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-[19px] font-bold text-ink">Repeat a whole order</h2>
        <div className="space-y-3">
          {past.map(o => (
            <div key={o.reference} className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/10 bg-paper p-4">
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-ink">{o.reference} <span className="ml-1 text-[12px] font-normal text-faint">{date(o.createdAt)}</span></p>
                <p className="mt-1 text-[13px] text-muted">{o.items.map(i => `${i.qty} × ${i.name} (${i.size})`).join(', ')}</p>
              </div>
              <button onClick={() => reorderItems(o.deliveryType, o.items)} className="btn-micro flex items-center gap-2 rounded-full border border-grass px-4 py-2 text-[13px] font-semibold text-grass hover:bg-grass hover:text-white"><RotateCcw className="h-4 w-4" /> Request again</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Invoices({ orders }) {
  if (!orders.length) return <p className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center text-[14px] text-muted">No invoices yet. Each order gets an invoice you can print or save as PDF.</p>
  return (
    <div>
      <h2 className="mb-1 font-display text-[19px] font-bold text-ink">Invoices & receipts</h2>
      <p className="mb-4 text-[14px] text-muted">Before payment it's a pro-forma invoice; once paid it becomes your receipt.</p>
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-ink/10 text-[12px] uppercase tracking-[0.08em] text-faint">
            <tr><th className="px-4 py-3 font-medium">Order</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Date</th><th className="px-4 py-3 font-medium">Amount</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {orders.map(o => (
              <tr key={o.reference}>
                <td className="px-4 py-3 font-semibold text-ink">{o.reference}</td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{date(o.createdAt)}</td>
                <td className="px-4 py-3 text-ink">{totalText(o)}</td>
                <td className="hidden px-4 py-3 sm:table-cell"><span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${o.paymentStatus === 'paid' ? 'bg-grass/15 text-grass' : 'bg-ink/5 text-muted'}`}>{o.paymentStatus === 'paid' ? 'Paid' : o.status === 'cancelled' ? 'Cancelled' : 'Pro-forma'}</span></td>
                <td className="px-4 py-3 text-right"><Link to={`/account/orders/${o.reference}/invoice`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-grass hover:underline"><FileText className="h-4 w-4" /> View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Wishlist() {
  const { ids } = useWishlist()
  const { products, mode } = useCart()
  const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean)
  if (!items.length) return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center">
      <Heart className="mx-auto h-8 w-8 text-faint" strokeWidth={1.5} />
      <p className="mt-3 text-[14.5px] text-muted">Your wishlist is empty. Tap the heart on any product to save it here.</p>
      <Link to="/shop" className="btn-micro mt-5 inline-flex rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep">Browse products</Link>
    </div>
  )
  return (
    <div>
      <h2 className="mb-4 font-display text-[19px] font-bold text-ink">My wishlist <span className="text-[14px] font-normal text-muted">({items.length})</span></h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(p => {
          const size = p.sizes[0]
          return (
            <div key={p.id} className="relative flex flex-col rounded-2xl border border-ink/10 bg-paper p-4">
              <WishButton productId={p.id} className="absolute right-3 top-3 h-9 w-9 rounded-full bg-paper text-ink shadow-sm" />
              <Link to={`/product/${p.id}`} className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white"><img src={size ? packImage(p, size) : p.image} alt="" className="h-full w-full object-contain p-2" /></Link>
              <Link to={`/product/${p.id}`} className="mt-3 font-display text-[16px] font-bold text-ink hover:text-grass">{p.name}</Link>
              <p className="text-[12.5px] text-muted">{p.tag}</p>
              {size && <p className="mt-1 text-[13px] font-semibold text-grass">Bulk price on request</p>}
              <div className="mt-auto flex gap-2 pt-4">
                {size && <Link to={quoteHref({ type: mode === 'international' ? 'export' : 'wholesale', product: p.name, size: size.label })} className="btn-micro flex-1 rounded-full bg-grass py-2.5 text-center text-[13px] font-semibold text-white hover:bg-grass-deep">Request quote</Link>}
                <Link to={`/product/${p.id}`} className="rounded-full border border-ink/15 px-4 py-2.5 text-[13px] font-semibold text-ink hover:border-grass hover:text-grass">View</Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Addresses({ me }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null) // null | address (new has no id)
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const load = () => accountApi('/addresses').then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])
  async function save(e) {
    e.preventDefault()
    setBusy(true); setErrors([])
    try {
      if (editing.id) await accountApi(`/addresses/${editing.id}`, { method: 'PATCH', body: editing })
      else await accountApi('/addresses', { method: 'POST', body: editing })
      setEditing(null); load()
    } catch (err) { setErrors(err.message.split(/(?<=\.)\s+/)) }
    finally { setBusy(false) }
  }
  async function del(a) { await accountApi(`/addresses/${a.id}`, { method: 'DELETE' }).catch(() => {}); load() }
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold text-ink">Saved addresses</h2>
          <p className="text-[14px] text-muted">Choose one at checkout instead of typing it again.</p>
        </div>
        {!editing && <button onClick={() => { setErrors([]); setEditing({ ...EMPTY_ADDRESS, fullName: me.name, phone: me.phone || '' }) }} className="btn-micro rounded-full bg-grass px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-grass-deep">+ Add address</button>}
      </div>
      {editing && (
        <form onSubmit={save} className="mb-6 rounded-2xl border border-ink/10 bg-paper p-5">
          <h3 className="mb-4 font-display text-[16px] font-bold text-ink">{editing.id ? 'Edit address' : 'New address'}</h3>
          <AddressForm value={editing} onChange={setEditing} />
          {errors.length > 0 && <div className="mt-3"><Errors list={errors} /></div>}
          <div className="mt-4 flex gap-2">
            <button disabled={busy} className="btn-micro rounded-full bg-grass px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60">{busy ? 'Saving…' : 'Save address'}</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-ink/15 px-6 py-2.5 text-[14px] text-muted hover:text-ink">Cancel</button>
          </div>
        </form>
      )}
      {list === null ? <Spinner /> : list.length === 0 && !editing ? (
        <p className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center text-[14px] text-muted">No saved addresses yet. Add one here, or save it during checkout.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map(a => <AddressCard key={a.id} a={a} onEdit={() => { setErrors([]); setEditing(a) }} onDelete={() => del(a)} />)}
        </div>
      )}
    </div>
  )
}

function WholesaleApply({ me, reload }) {
  const [company, setCompany] = useState(me.company || '')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState(null)
  const type = { individual: 'Individual', wholesale: 'Wholesale', international: 'International' }[me.accountType] || 'Individual'
  if (me.accountType === 'international') return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-6 lg:col-span-2"><h2 className="font-display text-[18px] font-bold text-ink">Account type: International</h2><p className="mt-2 text-[14px] text-muted">Request an export quotation any time and our team will reply with prices and shipping.</p></div>
  )
  const status = me.wholesaleStatus
  async function apply(e) {
    e.preventDefault(); setMsg(null)
    try { await accountApi('/wholesale-apply', { method: 'POST', body: { company, note } }); setMsg({ ok: true, text: "Thanks. We'll review your request and email you." }); reload() }
    catch (err) { setMsg({ ok: false, text: err.message }) }
  }
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-6 lg:col-span-2">
      <h2 className="font-display text-[18px] font-bold text-ink">Account type: {type}{status === 'approved' && ' · wholesale approved'}{status === 'pending' && ' · wholesale pending'}</h2>
      {status === 'approved' ? <p className="mt-2 text-[14px] text-muted">Your wholesale account is approved. Request a bulk quote any time.</p>
        : status === 'pending' ? <p className="mt-2 text-[14px] text-muted">Your wholesale request is being reviewed. We'll email you.</p>
        : (
          <form onSubmit={apply} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start">
            <p className="text-[14px] text-muted sm:col-span-3">We supply in bulk only. Apply for a wholesale account so our team can set up your bulk pricing.</p>
            <Field icon={Building2} placeholder="Business / company name" value={company} onChange={e => setCompany(e.target.value)} required />
            <Field icon={Store} placeholder="What you buy and roughly how much (optional)" value={note} onChange={e => setNote(e.target.value)} />
            <button className="btn-micro rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-paper">Apply</button>
          </form>
        )}
      {msg && <p className={`mt-2 text-[13.5px] ${msg.ok ? 'text-grass' : 'text-ruby'}`}>{msg.text}</p>}
    </div>
  )
}

function Profile({ me, reload }) {
  const [f, setF] = useState({ name: me.name, phone: me.phone || '', company: me.company || '', country: me.country || '' })
  const [msg, setMsg] = useState(null)
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)
  async function save(e) {
    e.preventDefault(); setMsg(null)
    try { await accountApi('/me', { method: 'PATCH', body: f }); setMsg({ ok: true, text: 'Profile saved.' }); reload() }
    catch (err) { setMsg({ ok: false, text: err.message }) }
  }
  async function savePw(e) {
    e.preventDefault(); setPwMsg(null)
    const bad = passwordErrors(pw.password, pw.confirm)
    if (bad.length) return setPwMsg({ ok: false, text: bad.join(' ') })
    try { await accountApi('/password', { method: 'POST', body: { current: pw.current, password: pw.password } }); setPw({ current: '', password: '', confirm: '' }); setPwMsg({ ok: true, text: me.hasPassword ? 'Password changed.' : 'Password set. You can now sign in with it.' }); reload() }
    catch (err) { setPwMsg({ ok: false, text: err.message }) }
  }
  const Msg = ({ m }) => m && <p className={`text-[13.5px] ${m.ok ? 'text-grass' : 'text-ruby'}`} role="status">{m.text}</p>
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-3.5 rounded-2xl border border-ink/10 bg-paper p-6">
        <h2 className="font-display text-[18px] font-bold text-ink">Your details</h2>
        <Field icon={Mail} value={me.email} disabled aria-label="Email (can't be changed)" />
        <Field icon={User} placeholder="Full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
        <Field icon={Phone} placeholder="Phone / WhatsApp" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <Field icon={Building2} placeholder="Company (optional)" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} />
        <Field icon={MapPin} placeholder="Country" value={f.country} onChange={e => setF({ ...f, country: e.target.value })} />
        <Msg m={msg} />
        <button className="btn-micro rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep">Save details</button>
      </form>
      <form onSubmit={savePw} className="space-y-3.5 rounded-2xl border border-ink/10 bg-paper p-6">
        <h2 className="font-display text-[18px] font-bold text-ink">{me.hasPassword ? 'Change password' : 'Set a password'}</h2>
        {me.hasPassword && <PasswordField placeholder="Current password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required />}
        <PasswordField placeholder="New password" value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} autoComplete="new-password" required minLength={8} />
        <PasswordField placeholder="Confirm new password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required />
        <PasswordRules pw={pw.password} confirm={pw.confirm} />
        <Msg m={pwMsg} />
        <button className="btn-micro rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-paper">{me.hasPassword ? 'Change password' : 'Set password'}</button>
        <p className="pt-2 text-[12.5px] text-faint">Member since {date(me.since)}.</p>
      </form>
      <WholesaleApply me={me} reload={reload} />
    </div>
  )
}

export default function Account() {
  const [me, setMe, reload] = useMe()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const tab = TABS.some(t => t[0] === params.get('tab')) ? params.get('tab') : 'overview'
  const go = t => setParams(t === 'overview' ? {} : { tab: t })
  const [orders, setOrders] = useState(null)
  const [events, setEvents] = useState(null)

  useEffect(() => {
    if (!me) return
    accountApi('/orders').then(setOrders).catch(() => setOrders([]))
    accountApi('/activity').then(setEvents).catch(() => setEvents([]))
  }, [me])

  const { signOut: doSignOut } = useAuth()
  async function signOut() {
    await doSignOut()
    setOrders(null); setEvents(null)
    nav('/')
  }

  if (me === undefined) return <Shell><Spinner /></Shell>
  if (me === null) return <Shell><SignInPage onDone={reload} /></Shell>

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-grass">My dashboard</p>
            <h1 className="mt-2 font-display text-[32px] font-extrabold leading-tight text-ink md:text-[40px]">Welcome, {me.name.split(' ')[0]}.</h1>
            <p className="mt-1 text-[14px] text-muted">{me.email}{me.company ? ` · ${me.company}` : ''}</p>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2 text-[13.5px] text-muted hover:border-ruby hover:text-ruby"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-paper p-1.5 lg:flex-col lg:self-start" aria-label="Dashboard">
            {TABS.map(([v, l, Icon]) => (
              <button key={v} onClick={() => go(v)} aria-current={tab === v ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[14px] font-medium transition ${tab === v ? 'bg-grass text-white' : 'text-ink hover:bg-grass/10'}`}>
                <Icon className="h-[18px] w-[18px]" />{l}
              </button>
            ))}
          </nav>
          <div className="min-w-0">
            {orders === null ? <Spinner /> : (
              <>
                {tab === 'overview' && <Overview me={me} orders={orders} events={events} go={go} />}
                {tab === 'orders' && <Orders orders={orders} />}
                {tab === 'history' && (
                  <div>
                    <h2 className="mb-1 font-display text-[19px] font-bold text-ink">Tracking history</h2>
                    <p className="mb-6 text-[14px] text-muted">Every update on every order, newest first.</p>
                    <HistoryList events={events} />
                  </div>
                )}
                {tab === 'reorder' && <Reorder orders={orders} />}
                {tab === 'invoices' && <Invoices orders={orders} />}
                {tab === 'wishlist' && <Wishlist />}
                {tab === 'addresses' && <Addresses me={me} />}
                {tab === 'profile' && <Profile me={me} reload={reload} />}
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function AccountVerify() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [error, setError] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // StrictMode runs effects twice; the token only works once
    ran.current = true
    accountApi('/verify', { method: 'POST', body: { token: params.get('token') || '' } })
      .then(() => nav('/account', { replace: true }))
      .catch(err => setError(err.message))
  }, [params, nav])

  return (
    <Shell>
      {error ? (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <h1 className="font-display text-[28px] font-bold text-ink">That link didn't work.</h1>
          <p className="mt-3 text-muted">{error}</p>
          <Link to="/account" className="btn-micro mt-8 inline-flex rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep">Go to sign in</Link>
        </div>
      ) : <Spinner />}
    </Shell>
  )
}

export function AccountOrder() {
  const { reference } = useParams()
  const nav = useNavigate()
  const [me, , reload] = useMe()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (me) accountApi(`/orders/${reference}`).then(setOrder).catch(err => setError(err.message))
  }, [me, reference])

  if (me === undefined) return <Shell><Spinner /></Shell>
  if (me === null) return <Shell><SignInPage onDone={reload} /></Shell>

  const reorderable = order?.items.filter(i => i.productId) || []
  const reorder = () => reorderItems(order.deliveryType, order.items)

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-5 py-10 lg:py-14">
        <button onClick={() => nav('/account?tab=orders')} className="flex items-center gap-2 text-[13.5px] text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> My orders</button>
        {error && <p className="mt-8 text-ruby">{error}</p>}
        {!order && !error && <Spinner />}
        {order && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-ink/10 bg-paper p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[12.5px] text-faint">Order {order.reference} · placed {date(order.createdAt)}</p>
                  <p className="mt-2 font-display text-[24px] font-bold text-ink md:text-[28px]">{order.statusText}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge light value={order.status} />
                  <Link to={`/account/orders/${order.reference}/invoice`} className="btn-micro flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-[13.5px] font-semibold text-ink hover:border-grass hover:text-grass"><FileText className="h-4 w-4" /> Invoice</Link>
                  {reorderable.length > 0 && (
                    <button onClick={reorder} className="btn-micro flex items-center gap-2 rounded-full bg-grass px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-grass-deep"><RotateCcw className="h-4 w-4" /> Reorder</button>
                  )}
                </div>
              </div>
              <div className="mt-8"><Progress status={order.status} /></div>
              {order.trackingNumber && <p className="mt-6 flex items-center gap-2 text-[14px] text-ink"><Truck className="h-4 w-4 text-muted" /> Tracking number: <b>{order.trackingNumber}</b></p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Items</p>
                <ul className="mt-3 divide-y divide-ink/10">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-4 py-3 text-[14px] text-ink">
                      <span>{it.qty} × {it.name} <span className="text-faint">({it.size})</span></span>
                      <span>{it.lineTotal == null ? 'Quote' : fmt(it.lineTotal, order.currency)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-[14px] text-ink">
                  <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{order.subtotal == null ? 'Quote' : fmt(order.subtotal, order.currency)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryFee == null ? 'To be confirmed' : fmt(order.deliveryFee, order.currency)}</dd></div>
                  <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{order.total == null || order.deliveryFee == null ? 'To be confirmed' : fmt(order.total, order.currency)}</dd></div>
                </dl>
                <dl className="mt-5 space-y-1 border-t border-ink/10 pt-4 text-[13px] text-ink">
                  <div className="flex justify-between gap-4"><dt className="text-muted">Payment</dt><dd className="text-right">{order.paymentMethod || '—'} · <span className="capitalize">{order.paymentStatus}</span></dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">Delivering to</dt><dd className="text-right">{[order.address, order.port, order.destination].filter(Boolean).join(', ')}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Tracking history</p>
                <ol className="mt-4 space-y-5 border-l-2 border-ink/10 pl-5">
                  {[...order.events].reverse().map((e, i) => (
                    <li key={i} className="relative">
                      <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-paper ${i === 0 ? 'bg-grass' : 'bg-ink/25'}`} />
                      <p className="text-[13.5px] font-semibold capitalize text-ink">{e.status}</p>
                      {e.note && <p className="text-[13px] text-muted">{e.note}</p>}
                      <p className="text-[11.5px] text-faint">{new Date(e.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-[12.5px] text-faint">Questions about this order? <a href="/#contact" className="link-u text-ink">Contact us</a> and quote {order.reference}.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
