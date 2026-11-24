import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Building2, ArrowRight, ArrowLeft, Package, LogOut, RotateCcw, Truck, MapPin,
  CheckCircle2, Loader2, LayoutDashboard, ListOrdered, History, UserCog, Clock, CircleDot, KeyRound,
  Globe2, Store, Handshake, FileText, Heart, CreditCard, ShoppingCart, ShoppingBag, Printer, BadgeCheck, Hourglass, Megaphone, ShieldCheck,
} from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { Badge, FLOW, fmt, date } from '../admin/ui'
import { useAuth } from '../auth'
import { AddressCard, AddressForm, EMPTY_ADDRESS, NG_STATES } from '../components/Address'
import { TierPrice } from '../components/Shop'
import { CustomerOverview, useNotifications, useUnread } from './CustomerDashboard'
import DashboardShell, { DateChip } from './DashboardShell'
import { Avatar, KycBadge, PhotoCard, KycPanel, Messages, useNotices, CurrentLocation, EventLocation } from './CustomerExtras'
import { useCart } from '../cart'
import { useWishlist, WishButton } from '../wishlist'
import { packImage } from '../components/Home'
import { quoteHref, orderHref, priceOf, currencyOf } from '../lib'

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
  ['distributor', 'Distributor', 'Resell Farmora oil', Handshake],
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
const TYPE_IDS = ['wholesale', 'distributor', 'international']

export function AuthForms({ onDone: done, initial = 'login', compact = false }) {
  // /register?type=distributor opens the form with that account type picked
  const [params] = useSearchParams()
  const startType = TYPE_IDS.includes(params.get('type')) ? params.get('type') : 'wholesale'
  const { reload } = useAuth()
  const onDone = async () => { await reload(); done?.() }
  const [tab, setTab] = useState(initial)
  useEffect(() => { setTab(initial) }, [initial])
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', country: 'Nigeria', accountType: startType, area: '', monthlyVolume: '', password: '', confirm: '' })
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
        const { confirm: _confirm, area, monthlyVolume, ...rest } = f
        const body = f.accountType === 'distributor' ? { ...rest, area, monthlyVolume } : rest
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
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
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
            {f.accountType === 'distributor' && <p className="rounded-lg bg-grass/10 px-3 py-2 text-[12.5px] text-ink"><b>Become a Farmora distributor.</b> We supply you at special distributor prices and you resell to retailers and customers in your area. Our team reviews every application; once approved, your distributor prices appear when you sign in.</p>}
            {f.accountType === 'international' && <p className="rounded-lg bg-sun/15 px-3 py-2 text-[12.5px] text-ink">For bulk buyers outside Nigeria. Request export quotations with shipping to your port.</p>}
            <Field icon={User} placeholder="Your full name" value={f.name} onChange={set('name')} autoComplete="name" required />
            <Field icon={Building2} placeholder="Business / company name (optional)" value={f.company} onChange={set('company')} autoComplete="organization" />
            {f.accountType === 'distributor' && <>
              <Field icon={MapPin} placeholder="States / areas you will cover" value={f.area} onChange={set('area')} required />
              <Field icon={Package} placeholder="Expected monthly volume, e.g. 50 jerrycans (optional)" value={f.monthlyVolume} onChange={set('monthlyVolume')} />
            </>}
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
  const [params] = useSearchParams()
  const distributor = params.get('type') === 'distributor'
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
      <div className="hidden lg:block">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-grass">Your Farmora account</p>
        <h1 className="mt-3 font-display text-[44px] font-extrabold leading-[1.05] text-ink">{distributor ? <>Become a Farmora <span className="text-ruby">distributor.</span></> : <>Bulk orders, tracked <span className="text-ruby">in one place.</span></>}</h1>
        <ul className="mt-8 space-y-3 text-[15px] text-ink">
          {(distributor
            ? ['Special distributor prices on every pack size', 'Reliable supply to resell in your area', 'Dedicated support from our sales team', 'Track your orders and invoices online']
            : ['See every order and its status', 'Follow deliveries with live tracking', 'Full history of every tracking update', 'Invoices for every bulk order']).map(t => (
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

const GROUPS = [
  ['Dashboards', [['overview', 'Overview', LayoutDashboard], ['order', 'Place order', ShoppingCart], ['orders', 'My orders', ListOrdered], ['history', 'Tracking history', History], ['invoices', 'Invoices', FileText], ['reorder', 'Reorder', RotateCcw]]],
  ['Account', [['messages', 'Messages', Megaphone], ['kyc', 'Verification (KYC)', ShieldCheck], ['wishlist', 'Wishlist', Heart], ['addresses', 'Addresses', MapPin], ['profile', 'Profile', UserCog]]],
]
const TABS = GROUPS.flatMap(g => g[1])

// Orders, updates, messages and notifications for the dashboard frame (shared by the dashboard and order pages).
function useDashboard(me) {
  const [tick, setTick] = useState(0) // bump to reload
  const [orders, setOrders] = useState(null)
  const [events, setEvents] = useState(null)
  useEffect(() => {
    if (!me) return
    accountApi('/orders').then(setOrders).catch(() => setOrders([]))
    accountApi('/activity').then(setEvents).catch(() => setEvents([]))
  }, [me, tick])
  const [notices, markRead] = useNotices(me, tick)
  const notes = useNotifications(me || {}, orders, events, notices)
  const [unread, markSeenLocal] = useUnread(notes)
  const unreadMessages = notices.filter(n => !n.read).length
  const badges = {
    orders: orders?.some(o => o.status === 'confirmed' && o.paymentStatus === 'unpaid') ? 'bg-sun' : undefined,
    messages: unreadMessages,
    kyc: me && ['none', 'rejected'].includes(me.kycStatus) ? 'bg-ruby' : undefined,
  }
  return { tick, refresh: () => setTick(t => t + 1), orders, events, notices, markRead, notes, unread, markSeen: () => { markSeenLocal(); markRead() }, badges }
}

// Opens "Place order" with an order's items filled in, to order the same again.
export function reorderItems(_mode, items) {
  window.location.href = orderHref(items.filter(i => i.productId && i.sizeId).map(i => ({ product: i.productId, size: i.sizeId, qty: i.qty })))
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
          {o.currentLocation && !['delivered', 'cancelled'].includes(o.status) && <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-grass/10 px-2.5 py-1 text-[12px] font-medium text-grass"><Truck className="h-3.5 w-3.5" />Now at {o.currentLocation}</p>}
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
                    <EventLocation location={e.location} />
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

function WholesaleBanner({ me, go }) {
  if (me.accountType === 'distributor' && me.wholesaleStatus === 'approved') return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-grass/30 bg-grass/10 p-4 text-[14px] text-ink"><BadgeCheck className="h-5 w-5 text-grass" /><span className="flex-1"><b>Approved distributor.</b> Your distributor prices show on every product.</span><Link to="/shop" className="font-semibold text-grass hover:underline">See my prices →</Link></div>
  )
  if (me.accountType === 'distributor' && me.wholesaleStatus === 'pending') return (
    <div className="flex items-center gap-3 rounded-2xl border border-sun/60 bg-sun/15 p-4 text-[14px] text-ink"><Hourglass className="h-5 w-5" /><span><b>Distributor application under review.</b> We'll email you once it's approved, then your distributor prices will appear here.</span></div>
  )
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

function Orders({ orders, q = '', clearSearch }) {
  const [filter, setFilter] = useState('all')
  const isActive = o => !['delivered', 'cancelled'].includes(o.status)
  const needle = q.trim().toLowerCase()
  const matches = o => !needle || [o.reference, o.destination, o.status, ...o.items.map(i => `${i.name} ${i.size}`)].some(v => String(v || '').toLowerCase().includes(needle))
  const shown = orders.filter(o => (filter === 'all' || (filter === 'active' ? isActive(o) : !isActive(o))) && matches(o))
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-ink/10 bg-paper p-1" role="tablist">
          {[['all', 'All'], ['active', 'In progress'], ['done', 'Completed']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`rounded-full px-4 py-1.5 text-[13px] font-medium ${filter === v ? 'bg-grass text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
        <Link to="/account?tab=order" className="btn-micro rounded-full border border-ink/20 bg-paper px-5 py-2 text-[13px] font-medium text-ink hover:border-grass hover:text-grass">Place an order <span className="arr">→</span></Link>
      </div>
      {needle && <p className="mb-3 text-[13px] text-muted">Results for "<b className="text-ink">{q}</b>" · <button onClick={clearSearch} className="text-grass hover:underline">Clear</button></p>}
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
              <Link to={orderHref([{ product: b.productId, size: b.sizeId, qty: b.qty }])} className="btn-micro shrink-0 rounded-full bg-grass px-4 py-2 text-[13px] font-semibold text-white hover:bg-grass-deep">Order again</Link>
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
  const { items: saved } = useWishlist()
  const { products } = useCart()
  // one card per saved pack size (older whole-product saves show the first pack size)
  const items = saved.map(w => {
    const p = products.find(x => x.id === w.productId)
    const size = p && (p.sizes.find(s => s.id === w.sizeId) || (!w.sizeId ? p.sizes[0] : null))
    return p && size ? { p, size, sizeId: w.sizeId } : null
  }).filter(Boolean)
  if (!items.length) return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center">
      <Heart className="mx-auto h-8 w-8 text-faint" strokeWidth={1.5} />
      <p className="mt-3 text-[14.5px] text-muted">Your wishlist is empty. Tap the heart on any pack size to save it here.</p>
      <Link to="/shop" className="btn-micro mt-5 inline-flex rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep">Browse products</Link>
    </div>
  )
  return (
    <div>
      <p className="mb-4 text-[14px] text-muted">{items.length} saved pack size{items.length > 1 ? 's' : ''}.</p>
      <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-3">
        {items.map(({ p, size, sizeId }) => (
          <div key={`${p.id}:${sizeId || ''}`} className="relative flex flex-col rounded-2xl border border-ink/10 bg-paper p-4">
            <WishButton productId={p.id} sizeId={sizeId} className="absolute right-3 top-3 h-9 w-9 rounded-full bg-paper text-ink shadow-sm" />
            <Link to={`/product/${p.id}`} className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white"><img src={packImage(p, size)} alt="" className="h-full w-full object-contain p-2" /></Link>
            <Link to={`/product/${p.id}`} className="mt-3 font-display text-[16px] font-bold text-ink hover:text-grass">{size.label}</Link>
            <p className="text-[12.5px] text-muted">{p.name}</p>
            <TierPrice size={size} className="mt-1 text-[13px] font-semibold text-grass" />
            <div className="mt-auto flex gap-2 pt-4">
              <Link to={orderHref([{ product: p.id, size: size.id }])} className="btn-micro flex-1 rounded-full bg-grass py-2.5 text-center text-[13px] font-semibold text-white hover:bg-grass-deep">Order now</Link>
              <Link to={`/product/${p.id}`} className="rounded-full border border-ink/15 px-4 py-2.5 text-[13px] font-semibold text-ink hover:border-grass hover:text-grass">View</Link>
            </div>
          </div>
        ))}
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
  const type = { individual: 'Individual', wholesale: 'Wholesale', distributor: 'Distributor', international: 'International' }[me.accountType] || 'Individual'
  const status = me.wholesaleStatus
  if (me.accountType === 'distributor') return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-6 lg:col-span-2">
      <h2 className="font-display text-[18px] font-bold text-ink">Account type: Distributor{status === 'approved' ? ' · approved' : status === 'pending' ? ' · under review' : status === 'rejected' ? ' · not approved' : ''}</h2>
      <p className="mt-2 text-[14px] text-muted">{me.area ? `Areas covered: ${me.area}. ` : ''}{me.monthlyVolume ? `Expected volume: ${me.monthlyVolume}.` : ''}</p>
      {status === 'rejected' && <p className="mt-2 text-[14px] text-muted">Please <Link to="/#contact" className="font-semibold text-grass hover:underline">contact us</Link> to tell us more about your business.</p>}
    </div>
  )
  if (me.accountType === 'international') return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-6 lg:col-span-2"><h2 className="font-display text-[18px] font-bold text-ink">Account type: International</h2><p className="mt-2 text-[14px] text-muted">Request an export quotation any time and our team will reply with prices and shipping.</p></div>
  )
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
      <PhotoCard me={me} reload={reload} />
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


/* ---------------- place an order ---------------- */

const MIN_QTY = 5 // minimum order: 5 packs, gallons or drums of each pack size
const SHIP_OPTIONS = [['fob', 'Sea freight – FOB Nigerian port'], ['cif', 'Sea freight – CIF to my port'], ['air', 'Air freight'], ['advise', 'Not sure – please advise']]

// Order form in the dashboard: products from the admin, quantities (minimum 5 each), delivery details.
// We then confirm the final price and delivery cost, and the customer pays online from the order page.
function PlaceOrder({ me }) {
  const nav = useNavigate()
  const { products, mode, price } = useCart()
  const international = me.accountType === 'international'
  const local = !international
  const last = me.lastDelivery || {}
  const [params] = useSearchParams()
  // ?add=productId:sizeId:qty,... from "Order now" / "Reorder" buttons
  const [qty, setQty] = useState(() => Object.fromEntries((params.get('add') || '').split(',').filter(Boolean).map(x => { const [p, s, n] = x.split(':'); return [`${p}:${s}`, Math.max(MIN_QTY, Number(n) || MIN_QTY)] })))
  const picked = Object.keys(qty)
  const [d, setD] = useState({
    state: last.type === 'local' ? last.state || '' : '', city: last.city || '', address: last.type === 'local' ? last.address || '' : '',
    country: international ? last.country || me.country || '' : 'Nigeria', port: last.port || '', shipping: 'advise',
  })
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const setF = k => e => setD({ ...d, [k]: e.target.value })

  const lines = products.flatMap(p => p.sizes.filter(s => s.inStock).map(s => ({ p, s, key: `${p.id}:${s.id}`, n: Number(qty[`${p.id}:${s.id}`]) || 0 })))
  const chosen = lines.filter(l => l.n > 0)
  const priced = chosen.every(l => l.s.tier && priceOf(l.s, mode) != null)
  const subtotal = priced ? chosen.reduce((t, l) => t + priceOf(l.s, mode) * l.n, 0) : null

  async function submit(e) {
    e.preventDefault()
    const errs = []
    if (!chosen.length) errs.push('Enter a quantity for at least one product.')
    chosen.filter(l => l.n < MIN_QTY).forEach(l => errs.push(`Minimum order is ${MIN_QTY} for ${l.p.name}, ${l.s.label}.`))
    if (errs.length) return setErrors(errs)
    setBusy(true); setErrors([])
    try {
      const r = await accountApi('/api/orders', {
        method: 'POST',
        body: {
          customer: { name: me.name, phone: me.phone, company: me.company, buyerType: me.company ? 'business' : 'individual' },
          delivery: local ? { type: 'local', state: d.state, city: d.city, address: d.address } : { type: 'international', country: d.country, city: d.city, port: d.port, shipping: d.shipping },
          items: chosen.map(l => ({ productId: l.p.id, sizeId: l.s.id, qty: l.n })),
          notes,
        },
      })
      nav(`/account/orders/${r.reference}`)
    } catch (err) {
      setErrors(err.message.split(/(?<=\.)\s+/))
    } finally {
      setBusy(false)
    }
  }

  if (me.wholesaleStatus === 'pending') return (
    <div className="rounded-2xl border border-sun/60 bg-sun/15 p-6 text-[14px] text-ink"><Hourglass className="mb-2 h-6 w-6" /><b>Your account is under review.</b> You can place orders once our team approves it. You'll get an email when that happens. You can still <Link to={quoteHref()} className="font-semibold text-grass hover:underline">request a bulk quote</Link>.</div>
  )

  const box = 'w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[14.5px] text-ink outline-none focus:border-grass'
  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h2 className="font-display text-[22px] font-bold text-ink">Place an order</h2>
        <p className="mt-1 text-[14px] text-muted">Enter the quantity for each pack size you need. The minimum order is {MIN_QTY} of each pack size (packs, gallons or drums). Our team confirms the final price and delivery cost, then you can pay online from the order page.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        <ul className="divide-y divide-ink/10">
          {lines.map(({ p, s, key, n }) => (
            <li key={key} className={`flex flex-wrap items-center gap-4 p-4 ${picked.includes(key) ? 'bg-grass/[0.06]' : ''}`}>
              <img src={packImage(p, s)} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-ink/10 bg-white object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold text-ink">{p.name}</p>
                <p className="text-[13px] text-muted">{s.label}</p>
                <TierPrice size={s} className="text-[12.5px] font-medium text-grass" />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                Qty
                <input type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={qty[key] ?? ''} onChange={e => setQty({ ...qty, [key]: e.target.value.replace(/\D/g, '') })}
                  aria-label={`Quantity of ${p.name}, ${s.label}`} className={`w-24 rounded-xl border bg-paper px-3 py-2 text-center text-[15px] font-semibold text-ink outline-none focus:border-grass ${n > 0 && n < MIN_QTY ? 'border-ruby' : 'border-ink/15'}`} />
              </label>
            </li>
          ))}
          {!lines.length && <li className="p-6 text-center text-[14px] text-muted">No products are available right now.</li>}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-paper p-5">
        <h3 className="font-display text-[17px] font-bold text-ink">{local ? 'Delivery in Nigeria' : 'Export shipping'}</h3>
        {local ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={box} value={d.state} onChange={setF('state')} required aria-label="State">
              <option value="">State</option>
              {NG_STATES.map(st => <option key={st}>{st}</option>)}
            </select>
            <input className={box} placeholder="City / town" value={d.city} onChange={setF('city')} required />
            <input className={`${box} sm:col-span-2`} placeholder="Delivery address (street, landmark)" value={d.address} onChange={setF('address')} required />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={box} placeholder="Country" value={d.country} onChange={setF('country')} required />
            <input className={box} placeholder="City" value={d.city} onChange={setF('city')} required />
            <input className={box} placeholder="Destination port or airport" value={d.port} onChange={setF('port')} required />
            <select className={box} value={d.shipping} onChange={setF('shipping')} aria-label="Shipping method">
              {SHIP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
        <textarea className={`${box} min-h-20`} placeholder="Notes for our team (optional): delivery dates, packaging, etc." value={notes} onChange={e => setNotes(e.target.value)} />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-grass/30 bg-grass/5 p-5">
        <div className="text-[14px] text-ink">
          <p><b>{chosen.length}</b> item{chosen.length === 1 ? '' : 's'} · {chosen.reduce((t, l) => t + l.n, 0)} units</p>
          <p className="text-muted">{subtotal != null && chosen.length ? <>Estimated subtotal: <b className="text-ink">{price(subtotal, { plain: true })}</b> ({currencyOf(mode)}). Delivery cost is confirmed by our logistics team.</> : 'Prices and delivery cost are confirmed by our team before you pay.'}</p>
        </div>
        <button disabled={busy} className="btn-micro flex items-center gap-2 rounded-full bg-grass px-7 py-3.5 text-[14.5px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60">
          {busy ? 'Sending…' : <>Place order <ArrowRight className="arr h-4 w-4" /></>}
        </button>
      </section>
      <Errors list={errors} />
    </form>
  )
}

// Payment box on an order page: "Pay now" with Flutterwave once the order is confirmed with a final total.
function PayBox({ order, onPaid }) {
  const [params, setParams] = useSearchParams()
  const [state, setState] = useState({ busy: false, msg: '' })

  // back from Flutterwave checkout: ?payment=done&status=successful&transaction_id=…
  useEffect(() => {
    const id = params.get('transaction_id')
    if (params.get('payment') !== 'done') return
    setParams({}, { replace: true })
    if (params.get('status') === 'cancelled' || !id) { setState({ busy: false, msg: 'Payment was cancelled. You can try again when ready.' }); return }
    setState({ busy: true, msg: 'Confirming your payment…' })
    accountApi(`/orders/${order.reference}/verify-payment`, { method: 'POST', body: { transactionId: id } })
      .then(r => { setState({ busy: false, msg: r.paid ? 'Payment received. Thank you!' : r.message || 'We could not confirm the payment yet.' }); if (r.paid) onPaid() })
      .catch(err => setState({ busy: false, msg: err.message }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function pay() {
    setState({ busy: true, msg: '' })
    try { const r = await accountApi(`/orders/${order.reference}/pay`, { method: 'POST' }); window.location.href = r.link }
    catch (err) { setState({ busy: false, msg: err.message }) }
  }

  if (order.paymentStatus === 'paid') return (
    <div className="flex items-center gap-3 rounded-2xl border border-grass/30 bg-grass/10 p-5 text-[14px] text-ink"><BadgeCheck className="h-5 w-5 text-grass" /><span><b>Paid.</b> {order.paymentMethod ? `${order.paymentMethod}. ` : ''}Thank you, we're preparing your order.</span></div>
  )
  if (order.status === 'cancelled') return null
  if (!order.canPay) return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper p-5">
      <CreditCard className="h-6 w-6 shrink-0 text-grass" />
      <p className="text-[14px] text-ink"><b>Payment:</b> once we confirm the final price and delivery cost, you can pay here by Flutterwave or bank transfer.</p>
    </div>
  )
  return <PayOptions order={order} pay={pay} state={state} onReported={onPaid} />
}

function CopyRow({ label, value, mono }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard?.writeText(String(value)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {}) }
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-right text-ink ${mono ? 'font-mono text-[15px] font-semibold tracking-wider' : 'text-[14px] font-medium'}`}>{value}</span>
        <button type="button" onClick={copy} className="shrink-0 rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-medium text-muted hover:border-grass hover:text-grass">{copied ? 'Copied' : 'Copy'}</button>
      </dd>
    </div>
  )
}

// Two ways to pay a confirmed order: Flutterwave (card / transfer / USSD) or a direct bank transfer.
function PayOptions({ order, pay, state, onReported }) {
  const [method, setMethod] = useState(order.payOnline ? 'online' : 'bank')
  const [payer, setPayer] = useState('')
  const [sent, setSent] = useState({ busy: false, error: '', at: order.transferSentAt })
  async function reportTransfer() {
    setSent(s => ({ ...s, busy: true, error: '' }))
    try { const r = await accountApi(`/orders/${order.reference}/transfer-sent`, { method: 'POST', body: { payer } }); setSent({ busy: false, error: '', at: r.transferSentAt }); onReported?.() }
    catch (err) { setSent(s => ({ ...s, busy: false, error: err.message })) }
  }
  const amount = fmt(order.total, order.currency)
  const opt = on => `flex flex-1 items-center gap-3 rounded-xl border p-4 text-left transition ${on ? 'border-grass bg-grass/[0.07] ring-2 ring-grass/20' : 'border-ink/15 hover:border-grass/50'}`
  const b = order.bank
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-grass">Ready for payment</p>
          <p className="mt-1 text-[24px] font-semibold text-ink">{amount}</p>
          <p className="text-[12.5px] text-muted">Including delivery · order {order.reference}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row" role="radiogroup" aria-label="How would you like to pay?">
        <button type="button" role="radio" aria-checked={method === 'online'} onClick={() => setMethod('online')} className={opt(method === 'online')}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sun/25 text-ink"><CreditCard className="h-5 w-5" /></span>
          <span><span className="block text-[14px] font-semibold text-ink">Pay online</span><span className="block text-[12px] text-muted">Card, bank transfer or USSD via Flutterwave</span></span>
        </button>
        <button type="button" role="radio" aria-checked={method === 'bank'} onClick={() => setMethod('bank')} className={opt(method === 'bank')}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-grass/15 text-grass"><Building2 className="h-5 w-5" /></span>
          <span><span className="block text-[14px] font-semibold text-ink">Bank transfer</span><span className="block text-[12px] text-muted">Pay into our account, then tell us</span></span>
        </button>
      </div>

      {method === 'online' && (
        <div className="mt-5">
          {order.payOnline ? (
            <>
              <button onClick={pay} disabled={state.busy} className="btn-micro flex w-full items-center justify-center gap-2 rounded-full bg-grass py-3.5 text-[15px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60 sm:w-auto sm:px-8"><CreditCard className="h-4 w-4" /> {state.busy ? 'Please wait…' : `Pay ${amount} with Flutterwave`}</button>
              <p className="mt-2 text-[12px] text-faint">You'll be taken to Flutterwave's secure page and brought back here once paid.</p>
            </>
          ) : (
            <p className="rounded-xl bg-ink/[0.04] p-4 text-[13.5px] text-muted">Online payment is coming soon. Please use <button type="button" onClick={() => setMethod('bank')} className="font-semibold text-grass hover:underline">bank transfer</button> for now.</p>
          )}
          {state.msg && <p className="mt-2 text-[13px] text-muted" role="status">{state.msg}</p>}
        </div>
      )}

      {method === 'bank' && (
        <div className="mt-5">
          {!b ? (
            <p className="rounded-xl bg-ink/[0.04] p-4 text-[13.5px] text-muted">Our bank details for {order.currency === 'USD' ? 'dollar' : 'Naira'} payments are not listed yet. Please <a href="/#contact" className="font-semibold text-grass hover:underline">contact us</a> and quote {order.reference}.</p>
          ) : (
            <div className="grid gap-5 @3xl:grid-cols-[1.2fr_1fr]">
              <dl className="divide-y divide-ink/10 rounded-xl border border-ink/10 px-4">
                <CopyRow label="Amount" value={amount} />
                <CopyRow label="Bank" value={b.bankName} />
                <CopyRow label="Account name" value={b.accountName} />
                <CopyRow label="Account number" value={b.accountNumber} mono />
                {b.swift && <CopyRow label="SWIFT / BIC" value={b.swift} mono />}
                <CopyRow label="Description / narration" value={order.reference} mono />
              </dl>
              <div className="space-y-3 text-[13.5px]">
                {b.note && <p className="rounded-xl bg-sun/15 p-3 text-ink">{b.note}</p>}
                <p className="text-muted">Use <b className="text-ink">{order.reference}</b> as the description so we can match your payment.</p>
                {sent.at ? (
                  <div className="flex gap-3 rounded-xl border border-grass/30 bg-grass/10 p-4 text-ink">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-grass" />
                    <p><b>Thanks, we've been notified.</b> We'll confirm once the transfer arrives, usually within a few hours on working days.</p>
                  </div>
                ) : (
                  <>
                    <input value={payer} onChange={e => setPayer(e.target.value)} placeholder="Name on the paying account (optional)" className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-grass" />
                    <button onClick={reportTransfer} disabled={sent.busy} className="btn-micro flex w-full items-center justify-center gap-2 rounded-full bg-grass py-3 text-[14px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> {sent.busy ? 'Sending…' : "I've made the transfer"}</button>
                    {sent.error && <p className="text-[13px] text-ruby" role="alert">{sent.error}</p>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function Account() {
  const [me, , reload] = useMe()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const tab = TABS.some(t => t[0] === params.get('tab')) ? params.get('tab') : 'overview'
  const q = params.get('q') || ''
  const go = t => setParams(t === 'overview' ? {} : { tab: t })
  const d = useDashboard(me)
  const { signOut: doSignOut } = useAuth()
  async function signOut() { await doSignOut(); nav('/') }

  if (me === undefined) return <Shell><Spinner /></Shell>
  if (me === null) return <Shell><SignInPage onDone={reload} /></Shell>

  const { orders, events } = d
  const title = TABS.find(t => t[0] === tab)?.[1] || 'Overview'
  return (
    <DashboardShell me={me} groups={GROUPS} tab={tab} go={go} title={title} badges={d.badges}
      notes={d.notes} unread={d.unread} markSeen={d.markSeen} onRefresh={d.refresh} onSignOut={signOut}
      onSearch={v => setParams(v.trim() ? { tab: 'orders', q: v.trim() } : { tab: 'orders' })}
      actions={tab === 'overview' ? <DateChip /> : null}>
      {orders === null ? <Spinner /> : (
        <>
          {tab === 'overview' && <CustomerOverview me={me} orders={orders} go={go} banners={<>{!me.hasPassword && <SetPasswordNotice go={go} />}<WholesaleBanner me={me} go={go} /></>} />}
          {tab === 'order' && <PlaceOrder me={me} />}
          {tab === 'orders' && <Orders orders={orders} q={q} clearSearch={() => go('orders')} />}
          {tab === 'history' && (
            <div>
              <p className="mb-6 text-[14px] text-muted">Every update on every order, newest first.</p>
              <HistoryList events={events} />
            </div>
          )}
          {tab === 'messages' && <Messages notices={d.notices} markRead={d.markRead} />}
          {tab === 'kyc' && <KycPanel reload={reload} />}
          {tab === 'reorder' && <Reorder orders={orders} />}
          {tab === 'invoices' && <Invoices orders={orders} />}
          {tab === 'wishlist' && <Wishlist />}
          {tab === 'addresses' && <Addresses me={me} />}
          {tab === 'profile' && <Profile me={me} reload={reload} />}
        </>
      )}
    </DashboardShell>
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
  const d = useDashboard(me)
  const { signOut: doSignOut } = useAuth()

  useEffect(() => {
    if (me) accountApi(`/orders/${reference}`).then(setOrder).catch(err => setError(err.message))
  }, [me, reference])

  if (me === undefined) return <Shell><Spinner /></Shell>
  if (me === null) return <Shell><SignInPage onDone={reload} /></Shell>

  const reorderable = order?.items.filter(i => i.productId) || []
  const reorder = () => reorderItems(order.deliveryType, order.items)

  return (
    <DashboardShell me={me} groups={GROUPS} tab="orders" go={t => nav(t === 'overview' ? '/account' : `/account?tab=${t}`)} title="My orders" crumb={reference.toUpperCase()} badges={d.badges}
      notes={d.notes} unread={d.unread} markSeen={d.markSeen} onRefresh={() => { d.refresh(); accountApi(`/orders/${reference}`).then(setOrder).catch(() => {}) }}
      onSignOut={async () => { await doSignOut(); nav('/') }} onSearch={v => nav(`/account?tab=orders${v.trim() ? `&q=${encodeURIComponent(v.trim())}` : ''}`)}
      actions={<button onClick={() => nav('/account?tab=orders')} className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All orders</button>}>
      <div>
        {error && <p className="mt-8 text-ruby">{error}</p>}
        {!order && !error && <Spinner />}
        {order && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-ink/10 bg-paper p-5 md:p-6">
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
              <CurrentLocation order={order} />
              {order.trackingNumber && <p className="mt-6 flex items-center gap-2 text-[14px] text-ink"><Truck className="h-4 w-4 text-muted" /> Tracking number: <b>{order.trackingNumber}</b></p>}
            </div>

            <PayBox order={order} onPaid={() => accountApi(`/orders/${reference}`).then(setOrder)} />

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
                      <EventLocation location={e.location} />
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
    </DashboardShell>
  )
}
