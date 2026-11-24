// Customer dashboard pieces in the style of the admin: stat cards, purchase donut, monthly chart,
// recent orders and a notifications panel. Colours come from the site tokens, so light and dark both work.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, CheckCircle2, CreditCard, Package, Truck, ShoppingCart, ShoppingBag, Wallet, BadgeCheck, Hourglass,
  TrendingUp, Mail, MessageCircle, MoreVertical, Sun, Moon, RefreshCw, Megaphone, ShieldAlert, ShieldCheck, MapPin,
} from 'lucide-react'
import { Badge, fmt } from '../admin/ui'
import { useSite, waHref } from '../site'
import { useTheme } from '../lib'

const DONUT = ['#1f8a34', '#7cc242', '#f7c815', '#d7261e', '#2f6d26', '#b8912f']
const SEEN_KEY = 'farmora-notes-seen'

const ago = d => {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} days ago`
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
// whole amounts for the dashboard figures, e.g. ₦1,503,000
const money = (v, cur) => new Intl.NumberFormat(cur === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v || 0)
const sumBy = (orders, cur) => orders.filter(o => o.currency === cur && o.paymentStatus === 'paid').reduce((t, o) => t + (o.total || 0), 0)

/* ---------- notifications ---------- */

// Notifications for the signed-in customer: account approval, orders ready to pay, and order updates.
export function useNotifications(me, orders, events, notices = []) {
  return useMemo(() => {
    const list = []
    if (['wholesale', 'distributor'].includes(me.accountType)) {
      if (me.wholesaleStatus === 'approved') list.push({ key: 'acct', icon: BadgeCheck, text: `Your ${me.accountType} account is approved.`, sub: 'Your prices now show on every product.', link: '/account?tab=order', at: me.since })
      if (me.wholesaleStatus === 'pending') list.push({ key: 'acct', icon: Hourglass, text: `Your ${me.accountType} application is under review.`, sub: "We'll email you once it's approved.", link: '/account?tab=profile', at: me.since })
    }
    if (me.kycStatus === 'none') list.push({ key: 'kyc', icon: ShieldAlert, text: 'Verify your identity (KYC).', sub: 'Upload an ID to verify your trade account.', link: '/account?tab=kyc', at: me.since, action: true })
    if (me.kycStatus === 'rejected') list.push({ key: 'kyc', icon: ShieldAlert, text: 'Please re-upload your KYC documents.', sub: me.kycNote, link: '/account?tab=kyc', at: me.since, action: true })
    if (me.kycStatus === 'pending') list.push({ key: 'kyc', icon: Hourglass, text: 'Your KYC documents are being reviewed.', link: '/account?tab=kyc', at: me.since })
    notices.forEach(n => list.push({ key: `n-${n.id}`, icon: n.title.toLowerCase().includes('verified') ? ShieldCheck : Megaphone, text: n.title, sub: n.body, link: n.link || '/account?tab=messages', at: n.at, unread: !n.read }))
    ;(orders || []).filter(o => o.status === 'confirmed' && o.paymentStatus === 'unpaid' && o.total != null).forEach(o => list.push({
      key: `pay-${o.reference}`, icon: CreditCard, text: `Order ${o.reference} is ready for payment.`, sub: fmt(o.total, o.currency), link: `/account/orders/${o.reference}`, at: o.createdAt, action: true,
    }))
    ;(events || []).slice(0, 12).forEach(e => list.push({
      key: e.id, icon: e.location ? MapPin : e.status === 'delivered' ? Package : e.status === 'shipped' ? Truck : e.status === 'paid' ? Wallet : CheckCircle2,
      text: e.location ? `Order ${e.reference} is now at ${e.location}` : `Order ${e.reference}: ${e.status}`, sub: e.note, link: `/account/orders/${e.reference}`, at: e.at,
    }))
    return list.sort((a, b) => (b.action ? 1 : 0) - (a.action ? 1 : 0) || new Date(b.at) - new Date(a.at))
  }, [me, orders, events, notices])
}

function readSeen() { try { return Number(localStorage.getItem(SEEN_KEY)) || 0 } catch { return 0 } }

export function useUnread(notes) {
  const [seen, setSeen] = useState(readSeen)
  const unread = notes.filter(n => n.action || n.unread || new Date(n.at).getTime() > seen).length
  const markSeen = () => { const t = Date.now(); setSeen(t); try { localStorage.setItem(SEEN_KEY, String(t)) } catch { /* private mode */ } }
  return [unread, markSeen]
}

export function NotificationList({ notes, limit = 6 }) {
  if (!notes.length) return <p className="text-[13px] text-faint">You're all caught up.</p>
  return (
    <ul className="space-y-4">
      {notes.slice(0, limit).map(n => (
        <li key={n.key}>
          <Link to={n.link} className="group flex gap-3">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.action ? 'bg-sun text-[#123d1a]' : 'bg-grass/15 text-grass'}`}><n.icon className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium leading-snug text-ink group-hover:text-grass">{n.text}</span>
              {n.sub && <span className="block truncate text-[12px] text-muted">{n.sub}</span>}
              <span className="text-[11px] text-faint">{ago(n.at)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// Right-hand column: notifications, account status and the Farmora contacts.
export function SidePanel({ me, notes }) {
  const { contact: c } = useSite()
  const type = { wholesale: 'Wholesale', distributor: 'Distributor', international: 'International' }[me.accountType] || 'Buyer'
  const status = me.wholesaleStatus === 'approved' ? 'Approved' : me.wholesaleStatus === 'pending' ? 'Under review' : me.wholesaleStatus === 'rejected' ? 'Not approved' : 'Active'
  return (
    <aside className="space-y-6 rounded-3xl border border-ink/10 bg-paper p-6">
      <section id="notifications">
        <h3 className="flex items-center gap-2 text-[17px] font-semibold text-ink"><Bell className="h-4 w-4 text-grass" /> Notifications</h3>
        <div className="mt-4"><NotificationList notes={notes} /></div>
      </section>
      <div className="h-px bg-ink/10" />
      <section>
        <h3 className="text-[17px] font-semibold text-ink">My account</h3>
        <dl className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between gap-3"><dt className="text-muted">Account type</dt><dd className="font-medium text-ink">{type}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd className={`font-medium ${status === 'Approved' || status === 'Active' ? 'text-grass' : 'text-ink'}`}>{status}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Verification</dt><dd><Link to="/account?tab=kyc" className={`font-medium hover:underline ${me.kycStatus === 'approved' ? 'text-grass' : me.kycStatus === 'rejected' ? 'text-ruby' : 'text-ink'}`}>{{ approved: 'Verified', pending: 'In review', rejected: 'Re-upload needed', none: 'Not verified' }[me.kycStatus || 'none']}</Link></dd></div>
          {me.area && <div className="flex justify-between gap-3"><dt className="text-muted">Areas covered</dt><dd className="text-right text-ink">{me.area}</dd></div>}
          {me.company && <div className="flex justify-between gap-3"><dt className="text-muted">Business</dt><dd className="text-right text-ink">{me.company}</dd></div>}
        </dl>
      </section>
      <div className="h-px bg-ink/10" />
      <section>
        <h3 className="text-[17px] font-semibold text-ink">Contact Farmora</h3>
        <ul className="mt-3 space-y-1">
          {(c.whatsapp || c.phone) && (
            <li><a href={waHref(c.whatsapp || c.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-full px-3 py-2 text-[13px] text-ink transition hover:bg-grass hover:text-white"><MessageCircle className="h-4 w-4" />WhatsApp {c.whatsapp || c.phone}</a></li>
          )}
          {c.email && <li><a href={`mailto:${c.email}`} className="flex items-center gap-3 rounded-full px-3 py-2 text-[13px] text-ink transition hover:bg-grass hover:text-white"><Mail className="h-4 w-4" /><span className="truncate">{c.email}</span></a></li>}
        </ul>
      </section>
    </aside>
  )
}

/* ---------- header bar inside the dashboard frame ---------- */

export function FrameBar({ title, unread, onBell, onRefresh }) {
  const [theme, toggle] = useTheme()
  const dark = theme === 'dark'
  const iconBtn = 'relative grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink'
  return (
    <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-3.5 md:px-6">
      <nav className="flex min-w-0 items-center gap-2 text-[13px]">
        <span className="text-faint">Dashboard</span><span className="text-faint">/</span><span className="truncate font-medium text-ink">{title}</span>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <button onClick={toggle} className={iconBtn} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button onClick={onRefresh} className={iconBtn} aria-label="Refresh" title="Refresh"><RefreshCw className="h-[18px] w-[18px]" /></button>
        <button onClick={onBell} className={iconBtn} aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} title="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ruby px-1 text-[10px] font-semibold text-white">{unread}</span>}
        </button>
      </div>
    </div>
  )
}

/* ---------- charts ---------- */

function Donut({ data, total }) {
  const r = 70, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative mx-auto h-[180px] w-[180px] shrink-0">
      <svg viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="currentColor" strokeWidth="26" className="text-ink/[0.07]" />
        {data.map((d, i) => {
          const len = total ? (d.units / total) * c : 0
          const el = <circle key={d.name} cx="90" cy="90" r={r} fill="none" stroke={DONUT[i % DONUT.length]} strokeWidth="26" strokeDasharray={`${Math.max(0, len - (data.length > 1 ? 3 : 0))} ${c}`} strokeDashoffset={-acc} style={{ transition: 'stroke-dasharray 1s' }} />
          acc += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><p className="font-display text-[28px] font-bold leading-none text-ink">{total.toLocaleString()}</p><p className="mt-1 text-[12px] text-muted">Units ordered</p></div>
      </div>
    </div>
  )
}

function AreaChart({ points }) {
  const W = 300, H = 120, max = Math.max(1, ...points.map(p => p.v))
  const pts = points.map((p, i) => [(i / Math.max(1, points.length - 1)) * W, H - 12 - (p.v / max) * (H - 34)])
  const line = pts.reduce((acc, [x, y], i, a) => {
    if (!i) return `M${x},${y}`
    const [px, py] = a[i - 1], cx = (px + x) / 2
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`
  }, '')
  const peak = points.reduce((b, p, i) => (p.v >= points[b].v ? i : b), 0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full text-grass" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="cust-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".45" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity=".08" />)}
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#cust-area)" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[peak][0]} cy={pts[peak][1]} r="4" fill="#f7c815" stroke="var(--color-paper)" strokeWidth="2" />
    </svg>
  )
}

function Gauge({ value }) {
  const r = 52, c = Math.PI * r, off = c * (1 - value / 100)
  const a = Math.PI * (1 - value / 100)
  return (
    <svg viewBox="0 0 120 70" className="absolute -bottom-1 right-1 h-12 w-[4.5rem] opacity-90" aria-hidden="true">
      <path d="M8 62a52 52 0 0 1 104 0" fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="12" strokeLinecap="round" className="text-ink" />
      <path d="M8 62a52 52 0 0 1 104 0" fill="none" stroke="#1f8a34" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
      <line x1="60" y1="62" x2={60 + 38 * Math.cos(a)} y2={62 - 38 * Math.sin(a)} stroke="#f7c815" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ---------- overview ---------- */

function Stat({ title, value, sub, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper p-4 @md:p-5">
      <p className="text-[13px] text-muted">{title}</p>
      <p className="mt-2 break-words text-[19px] font-semibold @md:text-[22px] @5xl:text-[24px] leading-tight tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">{sub}</p>}
      {children}
    </div>
  )
}

export function CustomerOverview({ me, orders, go, banners }) {
  const live = orders.filter(o => o.status !== 'cancelled')
  const active = live.filter(o => o.status !== 'delivered')
  const delivered = live.filter(o => o.status === 'delivered').length
  const toPay = live.filter(o => o.status === 'confirmed' && o.paymentStatus === 'unpaid' && o.total != null)
  const ngn = sumBy(live, 'NGN'), usd = sumBy(live, 'USD')
  const units = live.reduce((t, o) => t + o.itemCount, 0)
  const rate = live.length ? Math.round((delivered / live.length) * 100) : 0

  const byProduct = useMemo(() => {
    const m = {}
    live.forEach(o => o.items.forEach(i => { m[i.name] = (m[i.name] || 0) + i.qty }))
    return Object.entries(m).map(([name, u]) => ({ name, units: u })).sort((a, b) => b.units - a.units)
  }, [live])

  // orders per month, last 6 months (oldest first)
  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1)
      const v = orders.filter(o => { const t = new Date(o.createdAt); return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() }).length
      return { label: d.toLocaleDateString(undefined, { month: 'short' }), v }
    })
  }, [orders])
  const busiest = months.reduce((b, m) => (m.v >= b.v ? m : b), months[0])

  const spent = [ngn ? money(ngn, 'NGN') : null, usd ? money(usd, 'USD') : null].filter(Boolean).join(' · ') || money(0, me.accountType === 'international' ? 'USD' : 'NGN')

  return (
    <div className="space-y-4">
      {banners}

      <div className="grid grid-cols-2 gap-3 @md:gap-4 @3xl:grid-cols-4">
        <Stat title="Total paid" value={spent} sub={<><TrendingUp className="h-4 w-4 text-grass" />{live.filter(o => o.paymentStatus === 'paid').length} paid orders</>} />
        <Stat title="Orders" value={orders.length} sub={<>{active.length} in progress</>} />
        <Stat title="Delivered" value={`${rate}%`} sub={<>{delivered} of {live.length} orders</>}><Gauge value={rate} /></Stat>
        <Stat title="Awaiting payment" value={toPay.length} sub={toPay.length ? <button onClick={() => go('orders')} className="font-semibold text-grass hover:underline">Pay now →</button> : 'Nothing due'} />
      </div>

      <div className="grid gap-4 @3xl:grid-cols-[1.45fr_1fr]">
        <section className="rounded-2xl border border-ink/10 bg-paper p-5">
          <div className="flex items-center justify-between"><h2 className="text-[17px] font-medium text-ink">Purchase overview</h2><button onClick={() => go('orders')} className="text-faint hover:text-ink" aria-label="All orders"><MoreVertical className="h-4 w-4" /></button></div>
          <div className="mt-5 flex flex-col items-center gap-7 sm:flex-row">
            <Donut data={byProduct} total={units} />
            <div className="w-full flex-1">
              <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-grass/15 text-grass"><ShoppingBag className="h-5 w-5" /></span>
                <div><p className="text-[13px] text-muted">Orders all time</p><p className="text-[22px] font-semibold text-ink">{orders.length}</p></div>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                {byProduct.length === 0 && <li className="col-span-2 text-[13px] text-faint">Your products will show here after your first order.</li>}
                {byProduct.map((p, i) => (
                  <li key={p.name}>
                    <p className="flex items-center gap-2 text-[13px] text-muted"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DONUT[i % DONUT.length] }} /><span className="truncate">{p.name.replace(/ \(.+\)/, '')}</span></p>
                    <p className="mt-1 text-[16px] font-medium text-ink">{p.units.toLocaleString()} units</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <button onClick={() => go('orders')} className="lift rounded-2xl border border-ink/10 bg-paper p-5 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-grass text-white"><Truck className="h-4 w-4" /></span>
            <p className="mt-4 text-[12px] text-muted">In progress</p>
            <p className="text-[20px] font-semibold text-ink">{active.length}</p>
            <p className="text-[11px] text-faint">Being prepared or on the way</p>
          </button>
          <button onClick={() => go('order')} className="lift rounded-2xl border border-ink/10 bg-paper p-5 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-grass text-white"><ShoppingCart className="h-4 w-4" /></span>
            <p className="mt-4 text-[12px] text-muted">Units ordered</p>
            <p className="text-[20px] font-semibold text-ink">{units.toLocaleString()}</p>
            <p className="text-[11px] text-faint">Place a new order →</p>
          </button>
          <div className="relative h-[190px] overflow-hidden rounded-2xl border border-ink/10 bg-paper p-5 sm:col-span-2">
            <p className="relative z-10 text-[15px] font-semibold text-ink">Orders per month</p>
            <p className="relative z-10 mt-1 inline-flex items-center gap-2 border-l-2 border-sun pl-2 text-[11px] text-faint">Busiest: {busiest.label} <span className="text-[15px] font-semibold text-ink">{busiest.v}</span></p>
            <div className="absolute inset-x-0 bottom-5 h-[110px]"><AreaChart points={months} /></div>
            <div className="absolute inset-x-5 bottom-1.5 flex justify-between text-[10px] text-faint">{months.map(m => <span key={m.label}>{m.label}</span>)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 @3xl:grid-cols-[1.45fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
          <div className="flex items-center justify-between p-5 pb-4"><h2 className="text-[17px] font-medium text-ink">Recent orders</h2><button onClick={() => go('orders')} className="text-[13px] font-medium text-grass hover:underline">All orders</button></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[14px]">
              <thead className="border-y border-ink/10 text-[12px] text-muted">
                <tr><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Items</th><th className="px-5 py-3 text-right font-medium">Total</th><th className="px-5 py-3 text-right font-medium">Status</th></tr>
              </thead>
              <tbody className="text-ink">
                {orders.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-faint">No orders yet. <button onClick={() => go('order')} className="font-semibold text-grass hover:underline">Place your first order</button></td></tr>}
                {orders.slice(0, 6).map(o => (
                  <tr key={o.reference} className="transition-colors hover:bg-ink/[0.03]">
                    <td className="px-5 py-3"><Link to={`/account/orders/${o.reference}`} className="font-semibold hover:text-grass">{o.reference}</Link><p className="text-[12px] text-faint">{new Date(o.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p></td>
                    <td className="px-5 py-3 text-muted">{o.itemCount.toLocaleString()} units</td>
                    <td className="px-5 py-3 text-right">{o.total == null ? 'To be confirmed' : money(o.total, o.currency)}</td>
                    <td className="px-5 py-3 text-right"><Badge light value={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="relative min-h-[260px] overflow-hidden rounded-2xl p-6 text-white">
          <img src="/journey/1-bunch.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-deep/95 via-[#0f2a12]/85 to-[#1f5a1c]/70" />
          <div className="relative flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] backdrop-blur"><span className="grid h-5 w-5 place-items-center rounded-full bg-sun text-[#123d1a]"><ShoppingCart className="h-3 w-3" /></span>{me.accountType === 'distributor' ? 'Distributor supply' : 'Bulk supply'}</span>
            <div className="mt-5 flex items-end gap-4">
              <p className="font-display text-[46px] font-bold leading-none">5+</p>
              <p className="border-l border-white/25 pl-4 text-[14px] leading-snug text-white/80">Minimum per<br />pack size</p>
            </div>
            <p className="mt-4 max-w-[22em] text-[14px] text-white/80">Order packs, gallons or drums. We confirm price and delivery, then you pay online.</p>
            <div className="mt-auto flex items-center gap-3 pt-6">
              <button onClick={() => go('order')} className="btn-micro flex-1 rounded-full bg-sun py-3 text-center text-[14px] font-bold text-[#123d1a] hover:brightness-105">Place an order</button>
              <button onClick={() => go('orders')} className="grid h-11 w-11 place-items-center rounded-full bg-grass text-white" aria-label="My orders"><ShoppingBag className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Bell button: scrolls to the notifications panel and marks them as read.
export const openNotifications = markSeen => {
  document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  markSeen()
}
