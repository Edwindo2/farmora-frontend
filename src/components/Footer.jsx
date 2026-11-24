import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'
import { Logo } from './Nav'
import Social from './Social'
import { useSite, telHref } from '../site'

const COLUMNS = [
  ['Quick Links', [['Home', '/'], ['About Us', '/#about'], ['Our Products', '/shop'], ['Become a Distributor', '/register?type=distributor'], ['My Orders', '/account']]],
  ['Our Services', [['Request Bulk Quote', '/?quote=wholesale#contact'], ['Export Quotation', '/?quote=export#contact'], ['Shipping & Logistics', '/#faq'], ['FAQs', '/#faq'], ['Contact Us', '/#contact']]],
]

function Newsletter() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ status: 'idle', error: '' })
  async function submit(e) {
    e.preventDefault()
    setState({ status: 'sending', error: '' })
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return setState({ status: 'idle', error: data.error || 'Something went wrong.' })
      setState({ status: 'done', error: '' }); setEmail('')
    } catch {
      setState({ status: 'idle', error: 'We could not reach the server. Please try again.' })
    }
  }
  return (
    <div>
      <h4 className="font-display text-[16px] font-semibold">Subscribe to Our Newsletter</h4>
      <p className="mt-2 text-[13.5px] text-white/75">Get the latest updates and offers.</p>
      {state.status === 'done' ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-[13.5px]"><CheckCircle2 className="h-4 w-4 text-sun" /> Thanks, you're subscribed.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2.5 text-[13.5px] text-[#1b2a1d] outline-none placeholder:text-[#7b867a] focus:ring-2 focus:ring-sun" />
          <button disabled={state.status === 'sending'} className="btn-micro shrink-0 rounded-full border-2 border-sun px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-sun hover:text-[#123d1a] disabled:opacity-60">Subscribe</button>
        </form>
      )}
      {state.error && <p className="mt-2 text-[12.5px] text-[#ffb4a8]" role="alert">{state.error}</p>}
      <Social size="lg" className="mt-5" />
    </div>
  )
}

export default function Footer() {
  const { contact: c } = useSite()
  const place = [c.address, c.city, c.state].filter(Boolean).join(', ')
  return (
    <footer className="bg-grass-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-3 lg:px-8 xl:grid-cols-[1.15fr_.75fr_.85fr_1.15fr_1.5fr] xl:gap-0 xl:divide-x xl:divide-white/15 [&>*]:xl:px-6 [&>*:first-child]:xl:pl-0 [&>*:last-child]:xl:pr-0">
        <div>
          <Logo light />
          <p className="mt-4 max-w-[22em] text-[13.5px] leading-relaxed text-white/70">Wholesale palm oil supply for distributors, businesses and bulk buyers in Nigeria and worldwide.</p>
        </div>
        {COLUMNS.map(([h, links]) => (
          <div key={h}>
            <h4 className="font-display text-[16px] font-semibold">{h}</h4>
            <ul className="mt-4 space-y-2">
              {links.map(([l, href]) => <li key={l}><Link to={href} className="link-u text-[14px] text-white/80 hover:text-white">{l}</Link></li>)}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="font-display text-[16px] font-semibold">Contact Us</h4>
          <ul className="mt-4 space-y-3 text-[13.5px] text-white/85">
            {(c.phone || c.phone2) && (
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
                <span>{[c.phone, c.phone2].filter(Boolean).map(p => <a key={p} href={telHref(p)} className="block hover:text-white">{p}</a>)}</span></li>
            )}
            {c.email && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-sun" /><a href={`mailto:${c.email}`} className="break-all hover:text-white">{c.email}</a></li>}
            {place && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun" />{c.mapUrl ? <a href={c.mapUrl} target="_blank" rel="noreferrer" className="hover:text-white">{place}</a> : <span>{place}</span>}</li>}
          </ul>
        </div>
        <Newsletter />
      </div>
      <div className="bg-[#0f4a1c]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-[12.5px] text-white/75 lg:px-8">
          <span>© {new Date().getFullYear()} Farmora AgriTrade Limited. All Rights Reserved.</span>
          <span className="tracking-wide">Quality • Trusted • Global</span>
        </div>
      </div>
    </footer>
  )
}
