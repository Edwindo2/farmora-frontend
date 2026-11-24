// Customer dashboard extras: profile photo, KYC verification, messages from Farmora and the order location card.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, Trash2, Loader2, ShieldCheck, ShieldAlert, Hourglass, Upload, FileCheck2, Megaphone, MapPin, Navigation, CheckCircle2,
} from 'lucide-react'

async function api(path, { method = 'GET', body, file } = {}) {
  const res = await fetch(`/api/account${path}`, {
    method,
    credentials: 'include',
    headers: file ? { 'Content-Type': file.type } : body ? { 'Content-Type': 'application/json' } : undefined,
    body: file || (body ? JSON.stringify(body) : undefined),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || (data.errors || []).join(' ') || (res.status === 413 ? 'That file is too large.' : 'Something went wrong.'))
  return data
}

const initials = name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

export function Avatar({ me, size = 44, className = '' }) {
  return me?.avatarUrl
    ? <img src={me.avatarUrl} alt="" className={`shrink-0 rounded-full object-cover ring-2 ring-paper ${className}`} style={{ width: size, height: size }} />
    : <span className={`grid shrink-0 place-items-center rounded-full bg-grass font-display font-bold text-white ${className}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(me?.name)}</span>
}

export function KycBadge({ status, className = '' }) {
  const s = {
    approved: ['Verified', 'bg-grass/15 text-grass', ShieldCheck],
    pending: ['KYC in review', 'bg-sun/20 text-ink', Hourglass],
    rejected: ['KYC needs attention', 'bg-ruby/15 text-ruby', ShieldAlert],
    none: ['Not verified', 'bg-ink/[0.07] text-muted', ShieldAlert],
  }[status || 'none']
  const Icon = s[2]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${s[1]} ${className}`}><Icon className="h-3.5 w-3.5" />{s[0]}</span>
}

/* ---------- profile photo ---------- */

export function PhotoCard({ me, reload }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return setMsg({ ok: false, text: 'Choose a photo under 2 MB.' })
    setBusy(true); setMsg(null)
    try { await api('/avatar', { method: 'POST', file }); setMsg({ ok: true, text: 'Photo updated.' }); reload() }
    catch (err) { setMsg({ ok: false, text: err.message }) }
    setBusy(false)
  }
  async function remove() {
    setBusy(true); setMsg(null)
    try { await api('/avatar', { method: 'DELETE' }); reload() } catch (err) { setMsg({ ok: false, text: err.message }) }
    setBusy(false)
  }
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-ink/10 bg-paper p-6 lg:col-span-2">
      <div className="relative">
        <Avatar me={me} size={84} />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-ink text-paper shadow hover:bg-grass disabled:opacity-60" aria-label="Change profile photo">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[18px] font-bold text-ink">Profile photo</h2>
        <p className="mt-0.5 text-[13px] text-muted">JPG, PNG or WebP, up to 2 MB. Shown on your dashboard.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-micro flex items-center gap-2 rounded-full bg-grass px-4 py-2 text-[13px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60"><Upload className="h-4 w-4" />{me.avatarUrl ? 'Change photo' : 'Upload photo'}</button>
          {me.avatarUrl && <button type="button" onClick={remove} disabled={busy} className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[13px] text-muted hover:border-ruby hover:text-ruby"><Trash2 className="h-4 w-4" />Remove</button>}
        </div>
        {msg && <p className={`mt-2 text-[13px] ${msg.ok ? 'text-grass' : 'text-ruby'}`} role="status">{msg.text}</p>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
    </div>
  )
}

/* ---------- KYC ---------- */

function FilePick({ label, hint, value, onChange, required }) {
  const input = useRef(null)
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-ink">{label}{required && <span className="text-ruby"> *</span>}</p>
      <button type="button" onClick={() => input.current?.click()} className={`flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-left transition ${value ? 'border-grass bg-grass/[0.06]' : 'border-ink/20 hover:border-grass'}`}>
        {value ? <FileCheck2 className="h-5 w-5 shrink-0 text-grass" /> : <Upload className="h-5 w-5 shrink-0 text-muted" />}
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] text-ink">{value ? value.name : 'Choose a file'}</span>
          <span className="block text-[12px] text-faint">{value ? `${(value.size / 1024 / 1024).toFixed(1)} MB` : hint}</span>
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => { onChange(e.target.files?.[0] || null); e.target.value = '' }} />
    </div>
  )
}

export function KycPanel({ reload }) {
  const [kyc, setKyc] = useState(null)
  const [f, setF] = useState({ idType: '', idNumber: '', doc: null, extra: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { api('/kyc').then(setKyc).catch(e => setError(e.message)) }, [])

  async function submit(e) {
    e.preventDefault(); setError('')
    if (!f.idType) return setError('Choose the type of ID.')
    if (f.idNumber.trim().length < 4) return setError('Enter the ID number.')
    if (!f.doc) return setError('Upload a photo or scan of the ID.')
    for (const file of [f.doc, f.extra].filter(Boolean)) if (file.size > 5 * 1024 * 1024) return setError(`${file.name} is larger than 5 MB.`)
    setBusy(true)
    try {
      const doc = await api('/kyc/files', { method: 'POST', file: f.doc })
      const extra = f.extra ? await api('/kyc/files', { method: 'POST', file: f.extra }) : null
      setKyc(await api('/kyc', { method: 'POST', body: { idType: f.idType, idNumber: f.idNumber, documentId: doc.id, extraId: extra?.id } }))
      reload?.()
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  if (!kyc) return error ? <p className="text-ruby">{error}</p> : <div className="grid place-items-center py-20 text-muted"><Loader2 className="h-6 w-6 animate-spin" /></div>
  const when = d => d && new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold text-ink">Identity verification (KYC)</h2>
          <p className="mt-1 max-w-[46em] text-[14px] text-muted">To protect bulk orders and payments, we verify every trade account once. Your documents are only seen by the Farmora team.</p>
        </div>
        <KycBadge status={kyc.status} />
      </div>

      {kyc.status === 'approved' && (
        <div className="flex gap-4 rounded-2xl border border-grass/30 bg-grass/[0.07] p-6">
          <ShieldCheck className="h-8 w-8 shrink-0 text-grass" />
          <div>
            <p className="font-semibold text-ink">Your account is verified.</p>
            <p className="mt-1 text-[13.5px] text-muted">{kyc.idType} ending {String(kyc.idNumber || '').slice(-4)} · approved {when(kyc.reviewedAt)}.</p>
          </div>
        </div>
      )}
      {kyc.status === 'pending' && (
        <div className="flex gap-4 rounded-2xl border border-sun/40 bg-sun/10 p-6">
          <Hourglass className="h-8 w-8 shrink-0 text-ink" />
          <div>
            <p className="font-semibold text-ink">We're checking your documents.</p>
            <p className="mt-1 text-[13.5px] text-muted">{kyc.idType} sent on {when(kyc.submittedAt)}. This usually takes one business day. We'll notify you here and by email.</p>
          </div>
        </div>
      )}
      {kyc.status === 'rejected' && (
        <div className="flex gap-4 rounded-2xl border border-ruby/30 bg-ruby/[0.06] p-6">
          <ShieldAlert className="h-8 w-8 shrink-0 text-ruby" />
          <div>
            <p className="font-semibold text-ink">We couldn't verify your documents.</p>
            {kyc.note && <p className="mt-1 text-[13.5px] text-ink">Reason: {kyc.note}</p>}
            <p className="mt-1 text-[13.5px] text-muted">Please upload them again below.</p>
          </div>
        </div>
      )}

      {(kyc.status === 'none' || kyc.status === 'rejected') && (
        <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-ink/10 bg-paper p-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Type of ID <span className="text-ruby">*</span></span>
            <select value={f.idType} onChange={e => setF({ ...f, idType: e.target.value })} className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[14px] text-ink outline-none focus:border-grass">
              <option value="">Choose…</option>
              {kyc.idTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">ID number <span className="text-ruby">*</span></span>
            <input value={f.idNumber} onChange={e => setF({ ...f, idNumber: e.target.value })} placeholder="e.g. NIN, passport or RC number" className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-grass" />
          </label>
          <FilePick label="Photo or scan of the ID" hint="JPG, PNG or PDF, up to 5 MB" value={f.doc} onChange={doc => setF({ ...f, doc })} required />
          <FilePick label="Proof of address or CAC certificate (optional)" hint="Utility bill, bank statement or CAC document" value={f.extra} onChange={extra => setF({ ...f, extra })} />
          {error && <p className="text-[13.5px] text-ruby md:col-span-2" role="alert">{error}</p>}
          <div className="md:col-span-2">
            <button disabled={busy} className="btn-micro flex items-center gap-2 rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white hover:bg-grass-deep disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><ShieldCheck className="h-4 w-4" /> Submit for verification</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

/* ---------- messages from Farmora ---------- */

export function useNotices(me, tick) {
  const [notices, setNotices] = useState([])
  useEffect(() => { if (me) api('/notices').then(setNotices).catch(() => setNotices([])) }, [me, tick])
  const markRead = async () => {
    if (!notices.some(n => !n.read)) return
    setNotices(list => list.map(n => ({ ...n, read: true })))
    api('/notices/read', { method: 'POST', body: {} }).catch(() => {})
  }
  return [notices, markRead]
}

export function Messages({ notices, markRead }) {
  useEffect(() => { const t = setTimeout(markRead, 1500); return () => clearTimeout(t) }, [markRead])
  return (
    <div>
      <h2 className="mb-1 font-display text-[19px] font-bold text-ink">Messages</h2>
      <p className="mb-6 text-[14px] text-muted">Announcements and messages from the Farmora team.</p>
      {!notices.length ? (
        <p className="rounded-2xl border border-dashed border-ink/20 bg-paper p-10 text-center text-[14px] text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {notices.map(n => (
            <li key={n.id} className={`rounded-2xl border p-5 ${n.read ? 'border-ink/10 bg-paper' : 'border-grass/40 bg-grass/[0.05]'}`}>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grass/15 text-grass"><Megaphone className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{n.title}{!n.read && <span className="ml-2 rounded-full bg-grass px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-white">New</span>}</p>
                    <span className="text-[12px] text-faint">{new Date(n.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-muted">{n.body}</p>
                  {n.link && <Link to={n.link} className="mt-2 inline-block text-[13px] font-medium text-grass hover:underline">Open</Link>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- where is my order ---------- */

const stamp = d => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export function CurrentLocation({ order }) {
  if (order.status === 'delivered') {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-grass/10 p-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-grass" />
        <p className="text-[14px] text-ink"><b>Delivered</b>{order.destination ? ` to ${order.destination}` : ''}.</p>
      </div>
    )
  }
  if (!order.currentLocation) return null
  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl border border-grass/30 bg-grass/[0.07] p-4">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-grass text-white">
        <span className="absolute inset-0 animate-ping rounded-full bg-grass/40" />
        <Navigation className="relative h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-grass">Your order is now at</p>
        <p className="font-display text-[19px] font-bold text-ink">{order.currentLocation}</p>
        <p className="text-[12px] text-faint">Updated {order.locationUpdatedAt ? stamp(order.locationUpdatedAt) : ''}{order.destination ? ` · heading to ${order.destination}` : ''}</p>
      </div>
    </div>
  )
}

export const EventLocation = ({ location }) => location
  ? <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-ink"><MapPin className="h-3.5 w-3.5 text-grass" />{location}</p>
  : null
