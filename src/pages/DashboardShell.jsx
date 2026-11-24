// The customer dashboard frame, laid out like the admin: a full-height sidebar (profile, search, grouped menu),
// a slim top bar with breadcrumb and actions, the page in the middle and a notifications / account panel on the right.
// Uses the admin surface tokens (.admin) so light and dark mode match the admin dashboard.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutGrid, Search, Bell, RefreshCw, Sun, Moon, Globe, Menu, X, LogOut, Store, CircleHelp, Mail, MessageCircle,
} from 'lucide-react'
import { useTheme } from '../lib'
import { useSite, waHref } from '../site'
import { LanguagePicker } from '../translate'
import { NotificationList } from './CustomerDashboard'
import { Avatar, KycBadge } from './CustomerExtras'

const iconBtn = 'relative grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-ink/[0.06] hover:text-ink'

function Bell_({ notes, unread, markSeen }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    markSeen()
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className={iconBtn} aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} aria-expanded={open}>
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] font-semibold text-night">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-ink/10 bg-paper p-5 shadow-2xl" onClick={() => setOpen(false)}>
          <p className="mb-4 text-[15px] font-medium text-ink">Notifications</p>
          <NotificationList notes={notes} limit={8} />
        </div>
      )}
    </div>
  )
}

function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const dark = theme === 'dark'
  return (
    <button onClick={toggle} className={iconBtn} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.7} />}
    </button>
  )
}

function RightPanel({ me, notes }) {
  const { contact: c } = useSite()
  const type = { wholesale: 'Wholesale', distributor: 'Distributor', international: 'International' }[me.accountType] || 'Buyer'
  const status = me.wholesaleStatus === 'approved' ? 'Approved' : me.wholesaleStatus === 'pending' ? 'Under review' : me.wholesaleStatus === 'rejected' ? 'Not approved' : 'Active'
  const row = 'flex items-center justify-between gap-3 py-1.5 text-[13px]'
  return (
    <aside className="hidden w-[290px] shrink-0 border-l border-ink/10 p-6 xl:block">
      <h3 className="text-[17px] font-medium text-ink">Notifications</h3>
      <div className="mt-4"><NotificationList notes={notes} limit={5} /></div>

      <div className="my-6 h-px bg-ink/10" />
      <h3 className="text-[17px] font-medium text-ink">My account</h3>
      <dl className="mt-3">
        <div className={row}><dt className="text-muted">Account type</dt><dd className="font-medium text-ink">{type}</dd></div>
        <div className={row}><dt className="text-muted">Status</dt><dd className={`font-medium ${status === 'Approved' || status === 'Active' ? 'text-lime' : 'text-ink'}`}>{status}</dd></div>
        <div className={row}><dt className="text-muted">Verification</dt><dd><Link to="/account?tab=kyc"><KycBadge status={me.kycStatus} /></Link></dd></div>
        {me.area && <div className={row}><dt className="text-muted">Areas covered</dt><dd className="truncate text-right text-ink">{me.area}</dd></div>}
        {me.company && <div className={row}><dt className="text-muted">Business</dt><dd className="truncate text-right text-ink">{me.company}</dd></div>}
      </dl>

      <div className="my-6 h-px bg-ink/10" />
      <h3 className="text-[17px] font-medium text-ink">Contact Farmora</h3>
      <ul className="mt-3 space-y-1">
        {(c.whatsapp || c.phone) && (
          <li><a href={waHref(c.whatsapp || c.phone)} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-full px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-lime hover:text-night">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#25d366] text-white"><MessageCircle className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1 truncate">WhatsApp</span><span className="text-[12px] text-faint group-hover:text-night">{c.whatsapp || c.phone}</span>
          </a></li>
        )}
        {c.email && (
          <li><a href={`mailto:${c.email}`} className="group flex items-center gap-3 rounded-full px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-lime hover:text-night">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-300 text-night"><Mail className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1 truncate">{c.email}</span>
          </a></li>
        )}
      </ul>
    </aside>
  )
}

export default function DashboardShell({ me, groups, tab, go, title, crumb, badges = {}, notes, unread, markSeen, onRefresh, onSignOut, onSearch, actions, children }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const pick = v => { go(v); setOpen(false); window.scrollTo({ top: 0 }) }

  return (
    <div className="admin min-h-svh bg-mist text-ink lg:p-4">
      <div className="flex min-h-svh overflow-hidden bg-shell lg:min-h-[calc(100svh-2rem)] lg:rounded-2xl lg:border lg:border-ink/10">
        {/* sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-shell p-5 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => pick('profile')} className="flex min-w-0 flex-1 items-center gap-3 text-left" title="Profile">
              <Avatar me={me} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium text-ink">{me.name}</span>
                <span className="block truncate text-[11px] text-faint">{me.email}</span>
              </span>
            </button>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted lg:hidden" aria-label="Close menu"><X className="h-4 w-4" /></button>
          </div>

          <form onSubmit={e => { e.preventDefault(); onSearch(q); setOpen(false) }} className="mt-6 flex items-center gap-2 rounded-xl bg-ink/[0.05] px-3 py-2 text-faint focus-within:ring-1 focus-within:ring-lime/50">
            <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search orders…" className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
          </form>

          {groups.map(([g, items]) => (
            <div key={g} className="mt-7">
              <p className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">{g}</p>
              <nav className="mt-2 space-y-0.5">
                {items.map(([v, label, Icon]) => {
                  const on = tab === v
                  const b = badges[v]
                  return (
                    <button key={v} onClick={() => pick(v)} aria-current={on ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] transition-all ${on ? 'bg-lime font-medium text-night' : 'text-muted hover:bg-ink/[0.05] hover:text-ink'}`}>
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} /><span className="truncate">{label}</span>
                      {typeof b === 'number' && b > 0 && <span className={`ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] font-semibold ${on ? 'bg-night text-lime' : 'bg-lime text-night'}`}>{b}</span>}
                      {typeof b === 'string' && <span className={`ml-auto h-2 w-2 rounded-full ${b}`} />}
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
          <nav className="mt-1 space-y-0.5">
            <Link to="/shop" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-muted hover:bg-ink/[0.05] hover:text-ink"><Store className="h-[18px] w-[18px]" strokeWidth={1.7} />Our products</Link>
            <a href="/#faq" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-muted hover:bg-ink/[0.05] hover:text-ink"><CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.7} />Help centre</a>
          </nav>

          <div className="mt-auto pt-8">
            <button onClick={onSignOut} className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-[13px] text-muted hover:border-lime hover:text-lime"><LogOut className="h-4 w-4" />Sign out</button>
            <Link to="/" className="flex items-center justify-center gap-2 text-ink">
              <img src="/emblem.png" alt="" className="h-7 w-7 rounded-full bg-white p-0.5" />
              <span className="font-brand text-[13px] font-semibold tracking-[0.18em]">FARMORA</span>
            </Link>
          </div>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

        {/* main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink/10 bg-shell/90 px-4 py-3.5 backdrop-blur md:px-7">
            <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-muted lg:hidden" aria-label="Menu"><Menu className="h-[18px] w-[18px]" /></button>
            <LayoutGrid className="hidden h-[18px] w-[18px] text-muted sm:block" strokeWidth={1.7} />
            <nav className="flex min-w-0 items-center gap-2 text-[13px]">
              <button onClick={() => go('overview')} className="text-faint hover:text-ink">Dashboard</button>
              <span className="text-faint">/</span>
              {crumb ? <><button onClick={() => go(tab)} className="truncate text-faint hover:text-ink">{title}</button><span className="text-faint">/</span><span className="truncate text-ink">{crumb}</span></> : <span className="truncate text-ink">{title}</span>}
            </nav>
            <div className="ml-auto flex items-center gap-0.5">
              <ThemeToggle />
              <button onClick={onRefresh} className={iconBtn} aria-label="Refresh" title="Refresh"><RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.7} /></button>
              <Bell_ notes={notes} unread={unread} markSeen={markSeen} />
              <Link to="/" className={`${iconBtn} hidden sm:grid`} aria-label="Back to the website" title="Back to the website"><Globe className="h-[18px] w-[18px]" strokeWidth={1.7} /></Link>
              <LanguagePicker variant="pill" className="ml-1 hidden md:block" />
            </div>
          </header>

          <main className="@container min-w-0 flex-1 overflow-x-hidden p-4 md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[20px] font-medium text-ink">{crumb || title}</h1>
              {actions}
            </div>
            {children}
          </main>
        </div>

        <RightPanel me={me} notes={notes} />
      </div>
    </div>
  )
}

export const DateChip = () => (
  <span className="text-[12.5px] text-muted">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
)
