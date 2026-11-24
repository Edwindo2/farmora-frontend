import { ADMIN } from './path'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'
import { Icon } from './AdminLayout'
import { TrendingUp, TrendingDown, Zap, MoreVertical } from 'lucide-react'

const money = (v, cur) => new Intl.NumberFormat(cur === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v || 0)
const DONUT = ['#c4f36a', '#8fcf3a', '#4f8a1e', '#2f5a12', '#d9f5a8']

function Trend({ value, label }) {
  const up = value >= 0
  return (
    <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
      {up ? <TrendingUp className="h-4 w-4 text-lime" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
      <span className={up ? 'text-lime' : 'text-red-400'}>{Math.abs(value)}%</span> {label}
    </p>
  )
}

function Tile({ title, children, className = '' }) {
  return <div className={`relative overflow-hidden rounded-2xl bg-paper p-5 ${className}`}><p className="text-[14px] text-muted">{title}</p>{children}</div>
}

// semicircle gauge for the delivered rate
function Gauge({ value }) {
  const r = 52, c = Math.PI * r, off = c * (1 - value / 100)
  return (
    <svg viewBox="0 0 120 70" className="absolute -bottom-2 right-3 h-24 w-36 opacity-90" aria-hidden="true">
      <path d="M8 62a52 52 0 0 1 104 0" fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="12" strokeLinecap="round" className="text-ink" />
      <path d="M8 62a52 52 0 0 1 104 0" fill="none" stroke="#2f6d26" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
      <line x1="60" y1="62" x2={60 + 40 * Math.cos(Math.PI * (1 - value / 100))} y2={62 - 40 * Math.sin(Math.PI * (1 - value / 100))} stroke="#c4f36a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Donut({ data, total }) {
  const r = 70, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative mx-auto h-[190px] w-[190px] shrink-0">
      <svg viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="26" className="text-ink" />
        {data.map((d, i) => {
          const len = total ? (d.units / total) * c : 0
          const el = <circle key={d.name} cx="90" cy="90" r={r} fill="none" stroke={DONUT[i % DONUT.length]} strokeWidth="26" strokeDasharray={`${Math.max(0, len - 3)} ${c}`} strokeDashoffset={-acc} style={{ transition: 'stroke-dasharray 1s' }} />
          acc += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><p className="text-[30px] font-semibold leading-none">{total}</p><p className="mt-1 text-[12px] text-muted">Units ordered</p></div>
      </div>
    </div>
  )
}

function AreaChart({ daily }) {
  const W = 300, H = 120, max = Math.max(1, ...daily.map(d => d.orders))
  const pts = daily.map((d, i) => [(i / (daily.length - 1)) * W, H - 10 - (d.orders / max) * (H - 30)])
  // smooth line through the points
  const line = pts.reduce((p, [x, y], i, a) => {
    if (!i) return `M${x},${y}`
    const [px, py] = a[i - 1], cx = (px + x) / 2
    return `${p} C${cx},${py} ${cx},${y} ${x},${y}`
  }, '')
  const peak = pts.reduce((b, p, i) => (daily[i].orders >= daily[b].orders ? i : b), 0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3fbf6a" stopOpacity=".55" /><stop offset="1" stopColor="#3fbf6a" stopOpacity="0" /></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity=".08" className="text-ink" />)}
      {Array.from({ length: 10 }).map((_, i) => <line key={i} y1="0" y2={H} x1={(W / 10) * i} x2={(W / 10) * i} stroke="currentColor" strokeOpacity=".05" className="text-ink" />)}
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#area)" />
      <path d={line} fill="none" stroke="#3fbf6a" strokeWidth="2" />
      <circle cx={pts[peak][0]} cy={pts[peak][1]} r="4" fill="#c4f36a" stroke="var(--color-paper)" strokeWidth="2" />
    </svg>
  )
}

export default function Dashboard() {
  const [s, setS] = useState(null)
  useEffect(() => { api('/stats').then(setS).catch(() => {}) }, [])
  if (!s) return <p className="text-faint">Loading…</p>

  const units = s.salesByProduct.reduce((a, b) => a + b.units, 0)
  const peakDay = s.daily.reduce((b, d) => (d.orders >= b.orders ? d : b), s.daily[0])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium">Overview</h1>
        <span className="text-[12px] text-faint">Last 30 days</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile title="Revenue (NGN)"><p className="mt-3 text-[28px] font-semibold tracking-tight">{money(s.revenue.NGN, 'NGN')}</p><Trend value={s.trend.NGN} label="vs last month" /></Tile>
        <Tile title="Revenue (USD)"><p className="mt-3 text-[28px] font-semibold tracking-tight">{money(s.revenue.USD, 'USD')}</p><Trend value={s.trend.USD} label="vs last month" /></Tile>
        <Tile title="Delivered rate"><p className="mt-3 text-[28px] font-semibold">{s.deliveredRate}%</p><p className="mt-2 text-[12px] text-faint">{s.counts.delivered} of {s.totalOrders - s.counts.cancelled} orders</p><Gauge value={s.deliveredRate} /></Tile>
        <Tile title="New orders"><p className="mt-3 text-[28px] font-semibold">{s.orders30}</p><Trend value={s.trend.orders} label="vs last month" /></Tile>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl bg-paper p-6">
          <div className="flex items-center justify-between"><h2 className="text-[19px] font-medium">Sales overview</h2><Link to={`${ADMIN}/products`} className="text-faint hover:text-ink"><MoreVertical className="h-4 w-4" /></Link></div>
          <div className="mt-5 flex flex-col items-center gap-8 sm:flex-row">
            <Donut data={s.salesByProduct} total={units} />
            <div className="w-full flex-1">
              <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime/15 text-lime"><Icon name="orders" /></span>
                <div><p className="text-[13px] text-muted">Orders all time</p><p className="text-[22px] font-semibold">{s.totalOrders}</p></div>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                {s.salesByProduct.length === 0 && <li className="col-span-2 text-[13px] text-faint">No sales yet.</li>}
                {s.salesByProduct.map((p, i) => (
                  <li key={p.name}>
                    <p className="flex items-center gap-2 text-[13px] text-muted"><span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />{p.name.replace(/ \(.+\)/, '')}</p>
                    <p className="mt-1 text-[17px]">{p.units} units</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link to={`${ADMIN}/orders`} className="lift rounded-2xl bg-paper p-5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-night"><Icon name="orders" className="h-4 w-4" /></span>
            <p className="mt-4 text-[12px] text-muted">Open orders</p>
            <p className="text-[20px] font-semibold">{s.open}</p>
            <p className="text-[11px] text-faint">Awaiting action</p>
          </Link>
          <Link to={`${ADMIN}/messages`} className="lift rounded-2xl bg-paper p-5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-night"><Icon name="messages" className="h-4 w-4" /></span>
            <p className="mt-4 text-[12px] text-muted">New messages</p>
            <p className="text-[20px] font-semibold">{s.newMessages} <span className="text-[12px] font-normal text-lime">· {s.customers} customers</span></p>
            <p className="text-[11px] text-faint">Contact inbox</p>
          </Link>
          <div className="relative h-[190px] overflow-hidden rounded-2xl bg-paper p-5 sm:col-span-2">
            <p className="relative z-10 text-[15px] font-medium">Orders per day</p>
            <p className="relative z-10 mt-1 inline-flex items-center gap-2 border-l-2 border-lime pl-2 text-[11px] text-faint">Busiest: {new Date(peakDay.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}<span className="text-[15px] font-semibold text-ink">{peakDay.orders}</span></p>
            <div className="absolute inset-x-0 bottom-0 h-[120px]"><AreaChart daily={s.daily} /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="overflow-hidden rounded-2xl bg-paper">
          <div className="flex items-center justify-between p-6 pb-4"><h2 className="text-[19px] font-medium">Customer list</h2><Link to={`${ADMIN}/customers`} className="text-faint hover:text-ink"><MoreVertical className="h-4 w-4" /></Link></div>
          <table className="w-full text-left text-[14px]">
            <thead className="border-y border-ink/10 text-[12px] text-muted">
              <tr><th className="px-6 py-3 font-medium">Name ↕</th><th className="px-6 py-3 text-center font-medium">Orders ↕</th><th className="px-6 py-3 text-right font-medium">Total value ↕</th></tr>
            </thead>
            <tbody>
              {s.topCustomers.length === 0 && <tr><td colSpan="3" className="px-6 py-6 text-faint">No customers yet.</td></tr>}
              {s.topCustomers.map((c, i) => (
                <tr key={c.email} className="transition-colors hover:bg-ink/[0.04]">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold text-night ${['bg-lime', 'bg-amber-300', 'bg-sky-300', 'bg-rose-300', 'bg-violet-300'][i % 5]}`}>{c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
                      <div><p>{c.name}</p><p className="text-[12px] text-faint">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">{c.orders}</td>
                  <td className="px-6 py-3 text-right">{[c.ngn ? money(c.ngn, 'NGN') : null, c.usd ? money(c.usd, 'USD') : null].filter(Boolean).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 text-white">
          <img src="/journey/1-bunch.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-night/95 via-[#0f2a12]/85 to-[#1f5a1c]/70" />
          <div className="relative flex h-full flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] backdrop-blur"><span className="grid h-5 w-5 place-items-center rounded-full bg-lime text-night"><Zap className="h-3 w-3" /></span>Needs attention</span>
            <div className="mt-6 flex items-end gap-4">
              <p className="text-[52px] font-semibold leading-none">{s.counts.received}</p>
              <p className="border-l border-white/20 pl-4 text-[14px] leading-snug text-white/70">New orders<br />awaiting confirmation</p>
            </div>
            <p className="mt-5 max-w-[22em] text-[14px] text-white/80">Confirm stock and set delivery fees so customers can pay online.</p>
            {s.pendingApplications > 0 && <Link to={`${ADMIN}/customers`} className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] text-white hover:bg-white/20"><Icon name="customers" className="h-4 w-4" />{s.pendingApplications} distributor / wholesale application{s.pendingApplications > 1 ? 's' : ''} waiting</Link>}
            <div className="mt-auto flex items-center gap-3 pt-6">
              <Link to={`${ADMIN}/orders?status=received`} className="btn-micro flex-1 rounded-full bg-lime py-3 text-center text-[14px] font-medium text-night">Review orders</Link>
              <Link to={`${ADMIN}/messages`} className="grid h-11 w-11 place-items-center rounded-full bg-[#2f6d26] text-lime"><Icon name="messages" className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
