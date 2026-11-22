import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Star, ImagePlus, Loader2, MessageSquareQuote, Newspaper, Mail, Download } from 'lucide-react'
import { api } from './api'
import { input, btn } from './ui'

// Home page content: customer reviews, "Latest updates" news and newsletter subscribers.

const lime = `${btn} bg-lime text-night hover:brightness-95`
const ghost = `${btn} border border-ink/15 text-ink hover:border-ink/40`
const icon = 'grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-ink/[0.06] hover:text-ink'
const date = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function Modal({ title, onClose, onSubmit, busy, errors, children }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative max-h-[92svh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-ink/10 bg-paper p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className={icon} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        {children}
        {errors.length > 0 && <ul className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-500" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghost} onClick={onClose}>Cancel</button>
          <button className={lime} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}

const Field = ({ label, hint, children }) => (
  <label className="block"><span className="mb-1.5 block text-[12px] text-muted">{label}</span>{children}{hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}</label>
)

function useEditor(path, empty, load) {
  const [item, setItem] = useState(null) // null | {...}
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const open = it => { setErrors([]); setItem(it ? { ...it } : { ...empty }) }
  async function save(e) {
    e.preventDefault()
    setBusy(true); setErrors([])
    try {
      if (item.id) await api(`/${path}/${item.id}`, { method: 'PATCH', body: item })
      else await api(`/${path}`, { method: 'POST', body: item })
      setItem(null); load()
    } catch (err) { setErrors(err.message.split(/(?<=\.)\s+/)) }
    finally { setBusy(false) }
  }
  return { item, setItem, open, save, errors, busy, close: () => setItem(null) }
}

function useList(path) {
  const [list, setList] = useState(null)
  const load = () => api(`/${path}`).then(setList).catch(() => setList([]))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return [list, load]
}

function RowActions({ item, path, load }) {
  const [confirm, setConfirm] = useState(false)
  async function toggle() { await api(`/${path}/${item.id}`, { method: 'PATCH', body: { active: !item.active } }); load() }
  async function del() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
    await api(`/${path}/${item.id}`, { method: 'DELETE' }); load()
  }
  return (
    <>
      <button className={icon} onClick={toggle} title={item.active ? 'Hide from website' : 'Show on website'} aria-label={item.active ? 'Hide' : 'Show'}>{item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      <button className={confirm ? `${btn} bg-red-600 px-2.5 text-white` : `${icon} hover:text-red-500`} onClick={del} aria-label="Delete">{confirm ? 'Delete?' : <Trash2 className="h-4 w-4" />}</button>
    </>
  )
}

function Section({ icon: Icon, title, text, action, children }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 px-5 py-4">
        <Icon className="h-5 w-5 text-lime" />
        <div className="flex-1"><h2 className="text-[16px] font-semibold">{title}</h2><p className="text-[12.5px] text-muted">{text}</p></div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Reviews() {
  const [list, load] = useList('reviews')
  const ed = useEditor('reviews', { name: '', place: '', quote: '', rating: 5, active: true }, load)
  return (
    <Section icon={MessageSquareQuote} title="Customer reviews" text="Shown in “What our customers say” on the home page. Only add real reviews, with the customer's permission." action={<button className={lime} onClick={() => ed.open()}><Plus className="h-4 w-4" /> Add review</button>}>
      {list?.length === 0 && <p className="px-5 py-8 text-center text-[13.5px] text-muted">No reviews yet. The reviews card is hidden on the website until you add one.</p>}
      <ul className="divide-y divide-ink/10">
        {list?.map(r => (
          <li key={r.id} className={`flex gap-4 px-5 py-4 ${r.active ? '' : 'opacity-55'}`}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium">{r.name}{r.place && <span className="text-faint">· {r.place}</span>}
                <span className="flex">{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink/20'}`} />)}</span>
                {!r.active && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] text-muted">Hidden</span>}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">“{r.quote}”</p>
            </div>
            <div className="flex shrink-0 items-start gap-0.5">
              <button className={icon} onClick={() => ed.open(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <RowActions item={r} path="reviews" load={load} />
            </div>
          </li>
        ))}
      </ul>
      {ed.item && (
        <Modal title={ed.item.id ? 'Edit review' : 'Add review'} onClose={ed.close} onSubmit={ed.save} busy={ed.busy} errors={ed.errors}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name"><input className={input} value={ed.item.name} onChange={e => ed.setItem({ ...ed.item, name: e.target.value })} placeholder="e.g. Mrs. Adeola" required /></Field>
            <Field label="Place (optional)"><input className={input} value={ed.item.place || ''} onChange={e => ed.setItem({ ...ed.item, place: e.target.value })} placeholder="e.g. Lagos" /></Field>
          </div>
          <Field label="Review"><textarea className={`${input} min-h-28 resize-y`} value={ed.item.quote} onChange={e => ed.setItem({ ...ed.item, quote: e.target.value })} required /></Field>
          <Field label="Rating">
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => (
              <button type="button" key={n} onClick={() => ed.setItem({ ...ed.item, rating: n })} aria-label={`${n} star${n > 1 ? 's' : ''}`}><Star className={`h-6 w-6 ${n <= ed.item.rating ? 'fill-amber-400 text-amber-400' : 'text-ink/25'}`} /></button>
            ))}</div>
          </Field>
        </Modal>
      )}
    </Section>
  )
}

function ImageField({ value, onChange }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function pick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/uploads', { method: 'POST', credentials: 'include', headers: { 'Content-Type': file.type }, body: file })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      onChange(data.url)
    } catch (err) { setError(err.message) }
    finally { setBusy(false); e.target.value = '' }
  }
  return (
    <div>
      <button type="button" onClick={() => ref.current?.click()} className="relative grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-xl border border-dashed border-ink/20 bg-mist hover:border-lime/60">
        {value && <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <span className={`relative flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] ${value ? 'bg-black/60 text-white' : 'text-muted'}`}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><ImagePlus className="h-4 w-4" /> {value ? 'Change image' : 'Upload an image (optional)'}</>}
        </span>
      </button>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
      {value && <button type="button" onClick={() => onChange('')} className="mt-1 text-[12px] text-muted hover:text-ink">Remove image</button>}
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  )
}

function News() {
  const [list, load] = useList('news')
  const ed = useEditor('news', { title: '', summary: '', image: '', link: '', active: true }, load)
  return (
    <Section icon={Newspaper} title="Latest updates" text="News for the home page. The newest visible one is shown." action={<button className={lime} onClick={() => ed.open()}><Plus className="h-4 w-4" /> Add update</button>}>
      {list?.length === 0 && <p className="px-5 py-8 text-center text-[13.5px] text-muted">No updates yet. The updates card is hidden on the website until you add one.</p>}
      <ul className="divide-y divide-ink/10">
        {list?.map(n => (
          <li key={n.id} className={`flex gap-4 px-5 py-4 ${n.active ? '' : 'opacity-55'}`}>
            {n.image ? <img src={n.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" /> : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-mist text-faint"><Newspaper className="h-5 w-5" /></span>}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium">{n.title}{!n.active && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] text-muted">Hidden</span>}</p>
              <p className="mt-1 line-clamp-2 text-[13px] text-muted">{n.summary}</p>
              <p className="mt-1 text-[11px] text-faint">{date(n.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-start gap-0.5">
              <button className={icon} onClick={() => ed.open(n)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <RowActions item={n} path="news" load={load} />
            </div>
          </li>
        ))}
      </ul>
      {ed.item && (
        <Modal title={ed.item.id ? 'Edit update' : 'Add update'} onClose={ed.close} onSubmit={ed.save} busy={ed.busy} errors={ed.errors}>
          <ImageField value={ed.item.image || ''} onChange={v => ed.setItem({ ...ed.item, image: v })} />
          <Field label="Title"><input className={input} value={ed.item.title} onChange={e => ed.setItem({ ...ed.item, title: e.target.value })} required /></Field>
          <Field label="Summary"><textarea className={`${input} min-h-24 resize-y`} value={ed.item.summary} onChange={e => ed.setItem({ ...ed.item, summary: e.target.value })} required /></Field>
          <Field label="Link (optional)" hint="Where “Read more” goes, e.g. https://… or /shop"><input className={input} value={ed.item.link || ''} onChange={e => ed.setItem({ ...ed.item, link: e.target.value })} /></Field>
        </Modal>
      )}
    </Section>
  )
}

function Subscribers() {
  const [list, load] = useList('newsletter')
  const [confirm, setConfirm] = useState(null)
  async function del(s) {
    if (confirm !== s.id) { setConfirm(s.id); setTimeout(() => setConfirm(c => (c === s.id ? null : c)), 3000); return }
    await api(`/newsletter/${s.id}`, { method: 'DELETE' }); setConfirm(null); load()
  }
  function exportCsv() {
    const csv = 'email,subscribed\n' + list.map(s => `${s.email},${new Date(s.createdAt).toISOString().slice(0, 10)}`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'farmora-newsletter.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <Section icon={Mail} title={`Newsletter subscribers${list ? ` (${list.length})` : ''}`} text="Emails from the footer sign-up form." action={list?.length > 0 && <button className={ghost} onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</button>}>
      {list?.length === 0 && <p className="px-5 py-8 text-center text-[13.5px] text-muted">No subscribers yet.</p>}
      <ul className="max-h-[420px] divide-y divide-ink/10 overflow-y-auto">
        {list?.map(s => (
          <li key={s.id} className="flex items-center gap-4 px-5 py-3 text-[14px]">
            <a href={`mailto:${s.email}`} className="min-w-0 flex-1 truncate hover:underline">{s.email}</a>
            <span className="text-[12px] text-faint">{date(s.createdAt)}</span>
            <button className={confirm === s.id ? `${btn} bg-red-600 px-2.5 text-white` : `${icon} hover:text-red-500`} onClick={() => del(s)} aria-label={`Remove ${s.email}`}>{confirm === s.id ? 'Remove?' : <Trash2 className="h-4 w-4" />}</button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export default function Content() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Website</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Reviews & updates</h1>
        <p className="mt-2 max-w-[42em] text-[14px] text-muted">Customer reviews and news for the home page, and the people who signed up for your newsletter.</p>
      </div>
      <Reviews />
      <News />
      <Subscribers />
    </div>
  )
}
