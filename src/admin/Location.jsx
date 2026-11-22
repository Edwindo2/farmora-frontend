import { useEffect, useState } from 'react'
import { MapPin, Mail, Phone, MessageCircle, Clock, Ship, CheckCircle2, Share2 } from 'lucide-react'
import { api } from './api'
import { input, btn } from './ui'

const FIELDS = [
  ['Office location', MapPin, [
    ['address', 'Street address', 'e.g. 12 Marina Road, Apapa', 2],
    ['city', 'City', 'e.g. Lagos'],
    ['state', 'State / region', 'e.g. Lagos State'],
    ['country', 'Country', 'e.g. Nigeria'],
    ['mapUrl', 'Google Maps link (optional)', 'https://maps.app.goo.gl/…', 2, 'Visitors who click your address open this map.'],
  ]],
  ['Contact', Mail, [
    ['email', 'Email', 'hello@farmora.com'],
    ['phone', 'Phone', '+234 801 234 5678'],
    ['phone2', 'Second phone (optional)', '+234 806 117 9288'],
    ['whatsapp', 'WhatsApp (optional)', '+234 801 234 5678', 1, 'Shown as a WhatsApp chat link.'],
    ['hours', 'Opening hours', 'Mon – Sat · 8am – 6pm WAT'],
  ]],
  ['Social media', Share2, [
    ['facebook', 'Facebook page', 'https://facebook.com/…'],
    ['instagram', 'Instagram', 'https://instagram.com/…'],
    ['youtube', 'YouTube', 'https://youtube.com/@…'],
    ['linkedin', 'LinkedIn', 'https://linkedin.com/company/…'],
    ['tiktok', 'TikTok', 'https://tiktok.com/@…', 2, 'Icons appear in the top bar and footer for the links you fill in. WhatsApp uses the number above.'],
  ]],
  ['Shipping', Ship, [
    ['hub', 'City orders ship from', 'e.g. Lagos', 1, 'Used on the website, e.g. "From Lagos to everywhere" and "FOB Lagos".'],
  ]],
]

export default function Location() {
  const [f, setF] = useState(null)
  const [saved, setSaved] = useState(null)
  const [errors, setErrors] = useState([])
  const [state, setState] = useState('')

  useEffect(() => { api('/settings').then(d => { setF(d); setSaved(d) }).catch(e => setErrors([e.message])) }, [])

  const dirty = f && saved && Object.keys(f).some(k => f[k] !== saved[k])

  async function save(e) {
    e.preventDefault()
    setState('saving'); setErrors([])
    try {
      const d = await api('/settings', { method: 'PUT', body: f })
      setF(d); setSaved(d); setState('saved')
      setTimeout(() => setState(''), 2500)
    } catch (err) {
      setErrors(err.message.split(/(?<=\.)\s+/)); setState('')
    }
  }

  if (!f) return <p className="text-faint">{errors[0] || 'Loading…'}</p>

  const office = [f.address, f.city, f.state !== f.city ? f.state : '', f.country].filter(Boolean).join(', ')

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Website</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Location & contact</h1>
          <p className="mt-2 max-w-[42em] text-[14px] text-muted">Your office address and contact details. They appear in the Contact section, the footer, the delivery section and at the bottom of every email.</p>
        </div>
        <div className="flex items-center gap-3">
          {state === 'saved' && <span className="flex items-center gap-1.5 text-[13px] text-lime"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
          <button className={`${btn} bg-lime text-night hover:brightness-95`} disabled={!dirty || state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
      {errors.length > 0 && <ul className="rounded-lg bg-red-500/10 px-4 py-3 text-[13px] text-red-500" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {FIELDS.map(([title, Icon, fields]) => (
            <section key={title} className="rounded-2xl border border-ink/10 bg-paper p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Icon className="h-4 w-4 text-lime" /> {title}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fields.map(([k, label, ph, span, hint]) => (
                  <label key={k} className={span === 2 ? 'sm:col-span-2' : ''}>
                    <span className="mb-1.5 block text-[12px] text-muted">{label}</span>
                    <input className={input} value={f[k] || ''} placeholder={ph} onChange={e => setF({ ...f, [k]: e.target.value })} />
                    {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* live preview of how it reads on the site */}
        <aside className="h-fit rounded-2xl bg-forest p-6 text-white xl:sticky xl:top-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d8b45a]">Preview · Contact section</p>
          <ul className="mt-5 space-y-4 text-[14px]">
            {[[Mail, 'Email', f.email], [Phone, 'Phone', [f.phone, f.phone2].filter(Boolean).join(' · ')], [MessageCircle, 'WhatsApp', f.whatsapp], [MapPin, 'Office', office], [Clock, 'Hours', f.hours]].filter(r => r[2]).map(([I, l, v]) => (
              <li key={l} className="flex gap-3">
                <I className="mt-0.5 h-4 w-4 shrink-0 text-[#d8b45a]" strokeWidth={1.6} />
                <span><span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">{l}</span>{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-white/15 pt-4 text-[12px] text-white/60">Delivery heading: <span className="font-serif text-[15px] italic text-white">From {f.hub || f.city} to everywhere.</span></p>
        </aside>
      </div>
    </form>
  )
}
