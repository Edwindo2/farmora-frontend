import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, Menu, X, ShoppingCart, Search, ChevronDown, Home, Mail, Phone, MapPin, LogOut, LayoutDashboard, ListOrdered, History, UserCog, LogIn } from 'lucide-react'
import { useTheme } from '../lib'
import { useCart } from '../cart'
import { useSite, telHref } from '../site'
import { useAuth } from '../auth'
import { LanguagePicker } from '../translate'
import Social from './Social'

// Farmora logo: the round emblem plus "FARMORA / AgriTrade Limited". `light` = on a dark background.
export function Logo({ light = false, className = '' }) {
  return (
    <Link to="/" onClick={() => window.scrollTo(0, 0)} translate="no" className={`notranslate flex shrink-0 items-center gap-2.5 ${className}`} aria-label="Farmora home">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5 md:h-14 md:w-14">
        <img src="/emblem.png" alt="" className="h-11 w-11 object-contain md:h-[52px] md:w-[52px]" />
      </span>
      <span className="leading-none">
        <span className={`block font-display text-[21px] font-extrabold tracking-[-0.01em] md:text-[25px] ${light ? 'text-white' : 'text-ink'}`}>FARMORA<sup className="ml-0.5 text-[9px] font-semibold">™</sup></span>
        <span className={`block font-display text-[13px] font-bold md:text-[15px] ${light ? 'text-white' : 'text-ruby'}`}>AgriTrade Limited</span>
      </span>
    </Link>
  )
}

// Section links scroll on the home page; from other pages they go home first.
function SmartLink({ href, ...props }) {
  const { pathname } = useLocation()
  if (!href.includes('#')) return <Link to={href} {...props} />
  return pathname === '/' ? <a href={href.slice(1)} {...props} /> : <Link to={href} {...props} />
}

function TopBar() {
  const { contact: c } = useSite()
  const place = [c.address, c.city, c.state].filter(Boolean).join(', ')
  return (
    <div className="hidden bg-forest text-[12.5px] text-white/90 md:block">
      <div className="mx-auto flex h-9 max-w-[1600px] items-center gap-6 px-5 lg:px-8">
        {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 whitespace-nowrap hover:text-white"><Mail className="h-4 w-4 text-sun" strokeWidth={1.8} />{c.email}</a>}
        {(c.phone || c.phone2) && (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Phone className="h-4 w-4 text-sun" strokeWidth={1.8} />
            {[c.phone, c.phone2].filter(Boolean).map((p, i) => <span key={p}>{i > 0 && <span className="mx-1.5 opacity-50">|</span>}<a href={telHref(p)} className="hover:text-white">{p}</a></span>)}
          </span>
        )}
        {place && <span className="ml-auto hidden items-center gap-2 truncate xl:flex"><MapPin className="h-4 w-4 text-sun" strokeWidth={1.8} />{place}</span>}
        <Social className={place ? 'ml-auto xl:ml-4' : 'ml-auto'} />
      </div>
    </div>
  )
}

// Desktop dropdown menu item
function MenuItem({ label, href, items, active, icon: Icon }) {
  const [open, setOpen] = useState(false)
  const base = `flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[13.5px] font-medium transition-colors ${active ? 'bg-grass text-white' : 'text-ink hover:bg-grass/10 hover:text-grass'}`
  if (!items) return <SmartLink href={href} className={base}>{Icon && <Icon className="h-4 w-4" />}{label}</SmartLink>
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className={base} aria-expanded={open} onClick={() => setOpen(o => !o)} onBlur={e => { if (!e.currentTarget.parentElement.contains(e.relatedTarget)) setOpen(false) }}>
        {label}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`absolute left-0 top-full z-50 pt-2 transition ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <ul className="min-w-[220px] rounded-xl border border-ink/10 bg-paper p-1.5 shadow-xl">
          {items.map(([l, h]) => (
            <li key={l}><SmartLink href={h} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-[13.5px] text-ink hover:bg-grass/10 hover:text-grass">{l}</SmartLink></li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Login / Register when signed out; "Hi, name" menu when signed in.
function AccountMenu() {
  const { me, signOut } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  if (me === undefined) return <span className="hidden h-10 w-24 md:block" />
  if (!me) {
    return (
      <div className="hidden items-center gap-1 md:flex">
        <Link to="/login" className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] font-semibold text-ink hover:text-grass"><LogIn className="h-4 w-4" />Login</Link>
        <Link to="/register" className="btn-micro rounded-full border-2 border-grass px-4 py-1.5 text-[13.5px] font-semibold text-grass hover:bg-grass hover:text-white">Register</Link>
      </div>
    )
  }
  const items = [['Dashboard', '/account', LayoutDashboard], ['My orders', '/account?tab=orders', ListOrdered], ['Tracking history', '/account?tab=history', History], ['Addresses', '/account?tab=addresses', MapPin], ['Profile', '/account?tab=profile', UserCog]]
  return (
    <div ref={ref} className="relative hidden md:block">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex items-center gap-2 rounded-full border border-ink/15 py-1 pl-1 pr-3 text-[13.5px] font-semibold text-ink hover:border-grass">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-grass text-[12px] font-bold text-white">{me.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
        <span className="max-w-[90px] truncate">Hi, {me.name.split(' ')[0]}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-ink/10 bg-paper p-1.5 shadow-xl">
          <p className="truncate px-3 py-2 text-[12px] text-faint">{me.email}</p>
          {items.map(([l, h, Icon]) => <Link key={l} to={h} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink hover:bg-grass/10 hover:text-grass"><Icon className="h-4 w-4" />{l}</Link>)}
          <button onClick={async () => { setOpen(false); await signOut(); nav('/') }} className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-ink/10 px-3 py-2 text-[13.5px] text-ruby hover:bg-ruby/10"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      )}
    </div>
  )
}

function useMenu() {
  const { products } = useCart()
  return [
    ['Home', '/', null, Home],
    ['About Us', null, [['Our story', '/#about'], ['Why choose Farmora', '/#why'], ['Contact us', '/#contact']]],
    ['Our Products', null, [...products.slice(0, 6).map(p => [p.name, '/shop']), ['All products', '/shop']]],
    ['Shop Online', null, [['Shop now', '/shop'], ['Place an order', '/shop#order'], ['Track my orders', '/account'], ['My dashboard', '/account?tab=history']]],
    ['Wholesale', null, [['Wholesale & bulk prices', '/?quote=wholesale#contact'], ['For local buyers', '/#buyers']]],
    ['Global Trade', null, [['For international buyers', '/#buyers'], ['Request export quotation', '/?quote=export#contact']]],
    ['FAQs', '/#faq'],
    ['Contact Us', '/#contact'],
  ]
}

function SearchBox({ onDone }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <form onSubmit={e => { e.preventDefault(); nav(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop'); onDone() }} className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2 shadow-lg">
      <Search className="h-4 w-4 text-faint" />
      <input ref={ref} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Escape' && onDone()} placeholder="Search palm oil, pack sizes…" aria-label="Search products" className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint" />
      <button className="rounded-full bg-grass px-3 py-1 text-[12px] font-medium text-white">Search</button>
    </form>
  )
}

function MobileAccount({ close }) {
  const { me, signOut } = useAuth()
  const nav = useNavigate()
  if (me === undefined) return null
  if (!me) return (
    <div className="grid grid-cols-2 gap-2 py-4 md:hidden">
      <Link to="/login" onClick={close} className="rounded-full border-2 border-grass py-2.5 text-center text-[14px] font-semibold text-grass">Login</Link>
      <Link to="/register" onClick={close} className="rounded-full bg-grass py-2.5 text-center text-[14px] font-semibold text-white">Register</Link>
    </div>
  )
  return (
    <div className="border-b border-ink/10 py-4 md:hidden">
      <p className="text-[13px] text-muted">Signed in as <b className="text-ink">{me.name}</b></p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to="/account" onClick={close} className="rounded-full bg-grass py-2.5 text-center text-[14px] font-semibold text-white">My dashboard</Link>
        <button onClick={async () => { close(); await signOut(); nav('/') }} className="rounded-full border border-ink/15 py-2.5 text-[14px] font-semibold text-ruby">Sign out</button>
      </div>
    </div>
  )
}

export default function Nav() {
  const { count, openDrawer } = useCart()
  const [theme, toggleTheme] = useTheme()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const menu = useMenu()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setOpen(false); setSearch(false) }, [pathname])

  const iconBtn = 'btn-micro grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-ink hover:border-grass hover:text-grass'

  return (
    <>
      <TopBar />
      <header className={`sticky top-0 z-40 bg-paper/95 backdrop-blur-md transition-shadow ${scrolled ? 'shadow-[0_4px_20px_-8px_rgba(0,0,0,.18)]' : ''}`}>
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-3 px-4 md:h-[84px] lg:px-8">
          <Logo />
          <nav className="mx-auto hidden items-center gap-0.5 2xl:flex" aria-label="Main">
            {menu.map(([label, href, items, icon]) => (
              <MenuItem key={label} label={label} href={href} items={items} icon={icon} active={label === 'Home' ? pathname === '/' : label === 'Shop Online' && pathname === '/shop'} />
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 2xl:ml-0">
            <LanguagePicker variant="pill" className="hidden md:block" />
            <button onClick={toggleTheme} className={`${iconBtn} hidden md:grid`} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            </button>
            <AccountMenu />
            <button onClick={() => setSearch(s => !s)} className="btn-micro grid h-10 w-10 place-items-center rounded-full bg-grass text-white hover:bg-grass-deep md:h-11 md:w-11" aria-label="Search" aria-expanded={search}>
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <button onClick={openDrawer} className="btn-micro relative grid h-10 w-10 place-items-center rounded-full bg-grass text-white hover:bg-grass-deep md:h-11 md:w-11" aria-label={`Your cart, ${count} item${count === 1 ? '' : 's'}`}>
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
              <span key={count} className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ruby px-1 text-[10.5px] font-semibold text-white ring-2 ring-paper ${count ? 'bump' : ''}`}>{count}</span>
            </button>
            <button onClick={() => setOpen(o => !o)} className={`${iconBtn} 2xl:hidden`} aria-label="Menu" aria-expanded={open}>
              {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
        {search && <div className="absolute inset-x-0 top-full px-4 pt-2"><div className="mx-auto max-w-xl"><SearchBox onDone={() => setSearch(false)} /></div></div>}
        {open && (
          <nav className="max-h-[calc(100svh-72px)] overflow-y-auto border-t border-ink/10 bg-paper px-5 pb-6 2xl:hidden" aria-label="Mobile">
            <MobileAccount close={() => setOpen(false)} />
            {menu.map(([label, href, items]) => items ? (
              <details key={label} className="group border-b border-ink/10">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-display text-[17px] font-semibold text-ink">{label}<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
                <ul className="pb-3">{items.map(([l, h]) => <li key={l}><SmartLink href={h} onClick={() => setOpen(false)} className="block py-2 pl-3 text-[15px] text-muted hover:text-grass">{l}</SmartLink></li>)}</ul>
              </details>
            ) : (
              <SmartLink key={label} href={href} onClick={() => setOpen(false)} className="block border-b border-ink/10 py-3.5 font-display text-[17px] font-semibold text-ink">{label}</SmartLink>
            ))}
            <LanguagePicker variant="inline" className="border-b border-ink/10 [&>button]:font-display [&>button]:text-[17px] [&>button]:font-semibold" />
            <button onClick={toggleTheme} className="flex w-full items-center justify-between py-3.5 font-display text-[17px] font-semibold text-ink">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              {theme === 'dark' ? <Sun className="h-5 w-5" strokeWidth={1.7} /> : <Moon className="h-5 w-5" strokeWidth={1.7} />}
            </button>
          </nav>
        )}
      </header>
    </>
  )
}
