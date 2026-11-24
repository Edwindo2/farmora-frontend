import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Words } from './Motion'
import { Mail, Phone, MapPin, Clock, ArrowRight, MessageCircle } from 'lucide-react'
import { useSite, telHref, waHref } from '../site'

const TOPICS = ['Bulk / export order', 'Become a distributor', 'General question', 'Delivery / logistics']

// Contact details come from the admin (Location & contact).
function details(c) {
  const office = [c.address, c.city, c.state !== c.city ? c.state : '', c.country].filter(Boolean).join(', ')
  return [
    c.email && { label: 'Email', value: c.email, href: `mailto:${c.email}`, Icon: Mail },
    c.phone && { label: c.whatsapp ? 'Phone' : 'Phone / WhatsApp', value: c.phone, href: telHref(c.phone), Icon: Phone },
    c.whatsapp && { label: 'WhatsApp', value: c.whatsapp, href: waHref(c.whatsapp), Icon: MessageCircle, external: true },
    office && { label: 'Office', value: office, href: c.mapUrl || undefined, Icon: MapPin, external: true },
    c.hours && { label: 'Hours', value: c.hours, Icon: Clock },
  ].filter(Boolean)
}

const field =
  'w-full rounded-none border-b border-white/25 bg-transparent py-3 text-[15px] text-white placeholder:text-white/45 outline-none transition-colors focus:border-gold'

export default function Contact() {
  const { contact } = useSite()
  const DETAILS = details(contact)
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: TOPICS[0], message: '' })
  const [state, setState] = useState({ status: 'idle', errors: [], id: null })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  // "Request export quotation" / "Wholesale" links arrive as /?quote=export#contact
  const { search } = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(search)
    const q = params.get('quote')
    const product = [params.get('product'), params.get('size')].filter(Boolean).join(', ')
    const qty = params.get('qty') || ''
    if (q === 'distributor') {
      setForm(f => ({ ...f, topic: 'Become a distributor', message: 'Hello Farmora, I would like to become a distributor.\nBusiness name:\nLocation / area covered:\nExpected monthly volume:\n' }))
    } else if (q === 'export' || q === 'wholesale') {
      setForm(f => ({ ...f, topic: 'Bulk / export order', message: q === 'export'
        ? `Hello Farmora, I would like an export quotation.\nProduct and pack size: ${product}\nQuantity: ${qty}\nDestination country and port:\n`
        : `Hello Farmora, I would like a bulk quote.\nProduct and pack size: ${product}\nQuantity: ${qty}\nDelivery location:\n` }))
    }
  }, [search])

  async function submit(e) {
    e.preventDefault()
    setState({ status: 'sending', errors: [], id: null })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setState({ status: 'error', errors: data.errors || ['Something went wrong.'], id: null })
      setState({ status: 'done', errors: [], id: data.id })
      setForm({ name: '', email: '', phone: '', topic: TOPICS[0], message: '' })
    } catch {
      setState({ status: 'error', errors: ['We could not reach the server. Please try again.'], id: null })
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-forest px-5 py-16 text-white md:px-8 md:py-24">
      <img src="/bg/fronds.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen" />
      <div className="relative mx-auto grid max-w-6xl gap-16 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div className="reveal">
          <p className="flex items-center gap-4 text-[11px] tracking-[0.28em] uppercase text-gold">
            <span>Contact us</span>
            <span className="draw h-px w-14 bg-gold/70" style={{ '--d': '.15s' }} />
          </p>
          <h2 className="mt-5 font-display text-[38px] font-extrabold leading-[1.02] tracking-[-0.02em] md:text-[54px]">
            <Words>Let's talk <span className="text-sun">palm oil.</span></Words>
          </h2>
          <p className="mt-6 max-w-[28em] font-light leading-relaxed text-white/75">
            Questions about products, bulk pricing, export or delivery? Send us a message and our team will reply within
            one business day.
          </p>

          <ul className="mt-12 grid gap-4">
            {DETAILS.map((d, i) => {
              const inner = (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 text-gold transition-colors group-hover:border-gold group-hover:bg-gold/10">
                    <d.Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10.5px] tracking-[0.2em] uppercase text-white/50">{d.label}</span>
                    <span className="mt-1 block break-words text-[15px] [overflow-wrap:anywhere]">{d.value}</span>
                  </span>
                </>
              )
              return (
                <li key={d.label} className="reveal" style={{ '--d': `${0.1 + i * 0.08}s` }}>
                  {d.href ? (
                    <a href={d.href} {...(d.external ? { target: '_blank', rel: 'noreferrer' } : {})} className="group flex items-center gap-4 rounded-sm border border-white/10 p-4 transition-colors hover:border-white/30">{inner}</a>
                  ) : (
                    <div className="group flex items-center gap-4 rounded-sm border border-white/10 p-4">{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="reveal sheen self-start overflow-hidden rounded-sm border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm md:p-10" style={{ '--d': '.2s' }}>
          {state.status === 'done' ? (
            <div className="py-10">
              <p className="text-[11px] tracking-[0.28em] uppercase text-gold">Message sent</p>
              <h3 className="mt-4 font-display text-4xl font-bold">Thank you.</h3>
              <p className="mt-4 font-light leading-relaxed text-white/75">
                We've received your message (ref <span className="text-white">{state.id}</span>) and will get back to you soon.
              </p>
              <button onClick={() => setState({ status: 'idle', errors: [], id: null })} className="btn-micro mt-8 rounded-full border border-white/30 px-6 py-3 text-[13px] hover:border-white">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <input className={field} placeholder="Full name *" value={form.name} onChange={set('name')} autoComplete="name" />
              <input className={field} placeholder="Email *" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
              <input className={field} placeholder="Phone / WhatsApp" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              <select className={`${field} appearance-none`} value={form.topic} onChange={set('topic')} aria-label="Topic">
                {TOPICS.map(t => <option key={t} className="text-ink">{t}</option>)}
              </select>
              <textarea className={`${field} min-h-32 resize-y sm:col-span-2`} placeholder="Your message *" value={form.message} onChange={set('message')} />
              {state.errors.length > 0 && (
                <ul className="space-y-1 text-[13px] text-[#f4a07a] sm:col-span-2" role="alert">
                  {state.errors.map(e => <li key={e}>{e}</li>)}
                </ul>
              )}
              <button
                type="submit"
                disabled={state.status === 'sending'}
                className="btn-micro mt-2 flex items-center justify-center gap-2 rounded-full bg-scarlet py-4 text-[14px] font-medium text-white hover:bg-[#a52d14] disabled:opacity-60 sm:col-span-2"
              >
                {state.status === 'sending' ? 'Sending…' : <>Send message <ArrowRight className="arr h-4 w-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
