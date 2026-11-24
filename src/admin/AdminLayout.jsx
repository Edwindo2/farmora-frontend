import { ADMIN } from './path'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { api } from './api'
import { useTheme } from '../lib'
import { LanguagePicker } from '../translate'
import { LayoutGrid, ShoppingBag, Droplet, Users, MessageSquare, Store, CircleHelp, Search, RefreshCw, Bell, Globe, Mail, Phone, LogOut, Menu, Sun, Moon, MapPin, MessageSquareQuote, Wallet, ShieldCheck, Megaphone } from 'lucide-react'

const ICONS = {
  overview: LayoutGrid, orders: ShoppingBag, products: Droplet, customers: Users, messages: MessageSquare,
  store: Store, help: CircleHelp, search: Search, refresh: RefreshCw, bell: Bell, globe: Globe,
  order: ShoppingBag, message: MessageSquare, mail: Mail, phone: Phone, logout: LogOut, menu: Menu, pin: MapPin, quote: MessageSquareQuote, wallet: Wallet, kyc: ShieldCheck, send: Megaphone,
}
export function Icon({ name, className = 'h-[18px] w-[18px]' }) {
  const C = ICONS[name]
  return <C className={className} strokeWidth={1.7} aria-hidden="true" />
}

// Light / dark switch, shared with the main site.
export function ThemeButton({ className = '' }) {
  const [theme, toggle] = useTheme()
  const dark = theme === 'dark'
  return (
    <button onClick={toggle} className={`grid h-9 w-9 place-items-center rounded-full hover:bg-ink/[0.06] hover:text-ink ${className}`} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.7} />}
    </button>
  )
}

const GROUPS = [
  ['Dashboards', [[`${ADMIN}`, 'Overview', 'overview', true], [`${ADMIN}/orders`, 'Orders', 'orders'], [`${ADMIN}/products`, 'Products', 'products'], [`${ADMIN}/customers`, 'Customers', 'customers'], [`${ADMIN}/kyc`, 'KYC verification', 'kyc'], [`${ADMIN}/notify`, 'Send message', 'send']]],
  ['Settings', [[`${ADMIN}/messages`, 'Messages', 'messages'], [`${ADMIN}/faq`, 'FAQ', 'help'], [`${ADMIN}/content`, 'Reviews & updates', 'quote'], [`${ADMIN}/location`, 'Location & contact', 'pin']]],
]
const TITLES = { '': 'Overview', orders: 'Orders', products: 'Products', customers: 'Customers', kyc: 'KYC verification', notify: 'Send message', messages: 'Messages', faq: 'FAQ', location: 'Location & contact', content: 'Reviews & updates' }

const ago = d => {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
const HUES = ['bg-lime text-night', 'bg-amber-300 text-night', 'bg-sky-300 text-night', 'bg-rose-300 text-night', 'bg-violet-300 text-night']

// Notification rows, used in the right panel and in the bell dropdown.
function NotificationItems({ items, onPick, limit = 6 }) {
  return (
    <ul className="space-y-4">
      {items.length === 0 && <li className="text-[13px] text-faint">Nothing new.</li>}
      {items.slice(0, limit).map((n, i) => (
        <li key={i}>
          <Link to={ADMIN + n.link} onClick={onPick} className="group flex gap-3">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.action ? 'bg-lime text-night' : 'bg-lime/15 text-lime'}`}><Icon name={n.type} className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[13px] leading-snug group-hover:text-lime">{n.text}</span>
              <span className="text-[11px] text-faint">{ago(n.at)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const SEEN_KEY = 'farmora-admin-notes-seen'
const readSeen = () => { try { return Number(localStorage.getItem(SEEN_KEY)) || 0 } catch { return 0 } }

// Bell with an unread count; opens the notifications as a dropdown (on every screen size).
function NotificationBell({ feed }) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(readSeen)
  const ref = useRef(null)
  const items = feed?.notifications || []
  const unread = items.filter(n => n.action || new Date(n.at).getTime() > seen).length
  useEffect(() => {
    if (!open) return
    const t = Date.now()
    setSeen(t)
    try { localStorage.setItem(SEEN_KEY, String(t)) } catch { /* private mode */ }
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-ink/[0.06] hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} aria-expanded={open}>
        <Icon name="bell" />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] font-semibold text-night">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-ink/10 bg-shell p-5 text-ink shadow-2xl">
          <p className="mb-4 text-[15px] font-medium">Notifications</p>
          <NotificationItems items={items} onPick={() => setOpen(false)} limit={8} />
          <Link to={`${ADMIN}/messages`} onClick={() => setOpen(false)} className="mt-4 block border-t border-ink/10 pt-3 text-center text-[12.5px] text-muted hover:text-lime">Open messages</Link>
        </div>
      )}
    </div>
  )
}

function RightPanel({ feed }) {
  if (!feed) return null
  return (
    <aside className="hidden w-[290px] shrink-0 border-l border-ink/10 p-6 xl:block">
      <h3 className="text-[17px] font-medium">Notifications</h3>
      <div className="mt-4"><NotificationItems items={feed.notifications} /></div>

      <div className="my-6 h-px bg-ink/10" />
      <h3 className="text-[17px] font-medium">Activities</h3>
      <ol className="relative mt-4 space-y-5 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-ink/10">
        {feed.activities.length === 0 && <li className="text-[13px] text-faint">No activity yet.</li>}
        {feed.activities.map((a, i) => (
          <li key={i} className="relative">
            <Link to={ADMIN + a.link} className="group flex gap-3">
              <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${HUES[i % HUES.length]}`}>{initials(a.by.split('@')[0])}</span>
              <span>
                <span className="block text-[13px] capitalize leading-snug group-hover:text-lime">{a.text}</span>
                <span className="text-[11px] text-faint">{ago(a.at)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="my-6 h-px bg-ink/10" />
      <h3 className="text-[17px] font-medium">Recent customers</h3>
      <ul className="mt-3 space-y-1">
        {feed.contacts.map((c, i) => (
          <li key={c.email} className="group flex items-center gap-3 rounded-full px-2 py-1.5 transition-colors hover:bg-lime hover:text-night">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${HUES[(i + 2) % HUES.length]} group-hover:bg-night group-hover:text-[#c4f36a]`}>{initials(c.name)}</span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{c.name}</span>
            <a href={`mailto:${c.email}`} className="opacity-50 group-hover:opacity-100" aria-label={`Email ${c.name}`}><Icon name="mail" className="h-4 w-4" /></a>
            {c.phone && <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="opacity-50 group-hover:opacity-100" aria-label={`WhatsApp ${c.name}`}><Icon name="phone" className="h-4 w-4" /></a>}
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default function AdminLayout() {
  const nav = useNavigate()
  const loc = useLocation()
  const [me, setMe] = useState(null)
  const [feed, setFeed] = useState(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [tick, setTick] = useState(0) // bump to make pages reload their data

  const loadFeed = useCallback(() => api('/feed').then(setFeed).catch(() => {}), [])
  useEffect(() => { api('/me').then(setMe).catch(() => {}) }, [])
  useEffect(() => { loadFeed() }, [loadFeed, loc.pathname, tick])

  async function logout() {
    await api('/logout', { method: 'POST' }).catch(() => {})
    nav(`${ADMIN}/login`)
  }

  if (!me) return <div className="admin grid min-h-svh place-items-center bg-mist text-faint">Loading…</div>

  const [seg = '', sub] = loc.pathname.slice(ADMIN.length).split('/').filter(Boolean)
  const title = TITLES[seg] || 'Overview'

  return (
    <div className="admin min-h-svh bg-mist p-0 text-ink lg:p-4">
      <div className="flex min-h-[calc(100svh-2rem)] overflow-hidden bg-shell lg:rounded-2xl lg:border lg:border-ink/10">
        {/* sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[240px] shrink-0 flex-col border-r border-ink/10 bg-shell p-5 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-[12px] font-semibold text-night">{initials(me.name || me.email)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium">{me.name}</span>
              <span className="block truncate text-[11px] text-faint">{me.email}</span>
            </span>
          </div>

          <form onSubmit={e => { e.preventDefault(); nav(`${ADMIN}/orders?q=${encodeURIComponent(q)}`); setOpen(false) }} className="mt-6 flex items-center gap-2 rounded-xl bg-ink/[0.05] px-3 py-2 text-faint focus-within:ring-1 focus-within:ring-lime/50">
            <Icon name="search" className="h-4 w-4" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search orders…" className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
          </form>

          {GROUPS.map(([g, items]) => (
            <div key={g} className="mt-8">
              <p className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">{g}</p>
              <nav className="mt-2 space-y-1">
                {items.map(([to, label, icon, end]) => (
                  <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition-all ${isActive ? 'bg-lime font-medium text-night' : 'text-muted hover:bg-ink/[0.05] hover:text-ink'}`}>
                    <Icon name={icon} />{label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
          <nav className="mt-1 space-y-1">
            <a href="/shop" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-muted hover:bg-ink/[0.05] hover:text-ink"><Icon name="store" />View store</a>
            <a href="/#faq" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-muted hover:bg-ink/[0.05] hover:text-ink"><Icon name="help" />Help centre</a>
          </nav>

          <div className="mt-auto pt-8">
            <button onClick={logout} className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-[13px] text-muted hover:border-lime hover:text-lime"><Icon name="logout" className="h-4 w-4" />Sign out</button>
            <div className="flex items-center justify-center gap-2">
              <img src="/emblem.png" alt="" className="h-7 w-7 rounded-full bg-white p-0.5" />
              <span className="font-brand text-[13px] font-semibold tracking-[0.18em]">FARMORA</span>
            </div>
          </div>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

        {/* main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-ink/10 px-5 py-4 md:px-7">
            <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 lg:hidden" aria-label="Menu"><Icon name="menu" /></button>
            <Icon name="overview" className="hidden h-5 w-5 text-muted sm:block" />
            <nav className="flex min-w-0 items-center gap-2 text-[13px]">
              <Link to={`${ADMIN}`} className="text-faint hover:text-ink">Dashboards</Link>
              <span className="text-faint">/</span>
              <Link to={seg ? `${ADMIN}/${seg}` : `${ADMIN}`} className={sub ? 'text-faint hover:text-ink' : ''}>{title}</Link>
              {sub && <><span className="text-faint">/</span><span className="truncate">{sub}</span></>}
            </nav>
            <div className="ml-auto flex items-center gap-1 text-muted">
              <button onClick={() => setTick(t => t + 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/[0.06] hover:text-ink" aria-label="Refresh"><Icon name="refresh" /></button>
              <NotificationBell feed={feed} />
              <a href="/shop" className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/[0.06] hover:text-ink" aria-label="View store"><Icon name="globe" /></a>
              <LanguagePicker variant="pill" className="ml-1 hidden sm:block" />
              <ThemeButton />
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden p-5 md:p-7">
            <Outlet context={{ tick }} key={tick} />
          </main>
        </div>

        <RightPanel feed={feed} />
      </div>
    </div>
  )
}
