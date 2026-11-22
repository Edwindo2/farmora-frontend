import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, X, CircleHelp } from 'lucide-react'
import { api } from './api'
import { input, btn } from './ui'

const lime = `${btn} bg-lime text-night hover:brightness-95`
const ghost = `${btn} border border-ink/15 text-ink hover:border-ink/40`
const icon = 'grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-ink/[0.06] hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent'

function Editor({ item, categories, onClose, onSaved }) {
  const [f, setF] = useState({ category: item?.category || categories[0] || '', question: item?.question || '', answer: item?.answer || '', active: item?.active ?? true })
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save(e) {
    e.preventDefault()
    setBusy(true); setErrors([])
    try {
      if (item) await api(`/faq/${item.id}`, { method: 'PATCH', body: f })
      else await api('/faq', { method: 'POST', body: f })
      onSaved()
    } catch (err) {
      setErrors(err.message.split(/(?<=\.)\s+/))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={item ? 'Edit question' : 'New question'}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={save} className="relative max-h-[92svh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-ink/10 bg-paper p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{item ? 'Edit question' : 'New question'}</h2>
          <button type="button" onClick={onClose} className={icon} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <label className="block"><span className="mb-1.5 block text-[12px] text-muted">Category</span>
          <input className={input} list="faq-categories" value={f.category} onChange={e => setF({ ...f, category: e.target.value })} placeholder="e.g. Delivery & shipping" required />
          <datalist id="faq-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
          <span className="mt-1 block text-[11px] text-faint">Pick an existing category or type a new one.</span>
        </label>
        <label className="block"><span className="mb-1.5 block text-[12px] text-muted">Question</span>
          <input className={input} value={f.question} onChange={e => setF({ ...f, question: e.target.value })} placeholder="e.g. Do you deliver on weekends?" required /></label>
        <label className="block"><span className="mb-1.5 block text-[12px] text-muted">Answer</span>
          <textarea className={`${input} min-h-36 resize-y`} value={f.answer} onChange={e => setF({ ...f, answer: e.target.value })} required /></label>
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Show on the website</label>
        {errors.length > 0 && <ul className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-500" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghost} onClick={onClose}>Cancel</button>
          <button className={lime} disabled={busy}>{busy ? 'Saving…' : item ? 'Save changes' : 'Add question'}</button>
        </div>
      </form>
    </div>
  )
}

export default function FaqAdmin() {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [confirm, setConfirm] = useState(null)
  const [error, setError] = useState('')
  const load = () => api('/faq').then(setList).catch(e => { setError(e.message); setList([]) })
  useEffect(() => { load() }, [])

  // grouped by category, keeping the saved order
  const groups = useMemo(() => {
    const out = []
    for (const it of list || []) {
      let g = out.find(x => x.name === it.category)
      if (!g) out.push((g = { name: it.category, items: [] }))
      g.items.push(it)
    }
    return out
  }, [list])

  async function saveOrder(next) {
    setList(next.flatMap(g => g.items))
    try { await api('/faq/reorder', { method: 'POST', body: { ids: next.flatMap(g => g.items.map(i => i.id)) } }) }
    catch (e) { setError(e.message); load() }
  }
  function moveItem(gi, ii, dir) {
    const next = groups.map(g => ({ ...g, items: [...g.items] }))
    const items = next[gi].items
    ;[items[ii], items[ii + dir]] = [items[ii + dir], items[ii]]
    saveOrder(next)
  }
  function moveGroup(gi, dir) {
    const next = [...groups]
    ;[next[gi], next[gi + dir]] = [next[gi + dir], next[gi]]
    saveOrder(next)
  }
  async function toggle(it) {
    await api(`/faq/${it.id}`, { method: 'PATCH', body: { active: !it.active } }).catch(e => setError(e.message))
    load()
  }
  async function del(it) {
    if (confirm !== it.id) { setConfirm(it.id); setTimeout(() => setConfirm(c => (c === it.id ? null : c)), 3000); return }
    await api(`/faq/${it.id}`, { method: 'DELETE' }).catch(e => setError(e.message))
    setConfirm(null); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Website</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">FAQ</h1>
          <p className="mt-2 max-w-[42em] text-[14px] text-muted">Questions and answers shown in the FAQ section of the website. Use the arrows to change the order, and hide a question to take it off the site without deleting it.</p>
        </div>
        <div className="flex gap-2">
          <a href="/#faq" target="_blank" rel="noreferrer" className={ghost}>View on site</a>
          <button className={lime} onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add question</button>
        </div>
      </div>
      {error && <p className="text-[13px] text-red-500">{error}</p>}
      {list === null && <p className="text-faint">Loading…</p>}
      {list?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/15 p-12 text-center text-muted">
          <CircleHelp className="mx-auto h-7 w-7 text-faint" strokeWidth={1.5} />
          <p className="mt-3">No questions yet. The FAQ section is hidden on the website until you add one.</p>
        </div>
      )}

      {groups.map((g, gi) => (
        <section key={g.name} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
          <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-3.5">
            <h2 className="flex-1 text-[15px] font-semibold">{g.name} <span className="ml-1 text-[12px] font-normal text-faint">{g.items.length}</span></h2>
            <button className={icon} disabled={gi === 0} onClick={() => moveGroup(gi, -1)} aria-label={`Move ${g.name} up`} title="Move category up"><ChevronUp className="h-4 w-4" /></button>
            <button className={icon} disabled={gi === groups.length - 1} onClick={() => moveGroup(gi, 1)} aria-label={`Move ${g.name} down`} title="Move category down"><ChevronDown className="h-4 w-4" /></button>
          </div>
          <ul className="divide-y divide-ink/10">
            {g.items.map((it, ii) => (
              <li key={it.id} className={`flex gap-4 px-5 py-4 ${it.active ? '' : 'opacity-55'}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium">
                    {it.question}
                    {!it.active && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-medium text-muted">Hidden</span>}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{it.answer}</p>
                </div>
                <div className="flex shrink-0 items-start gap-0.5">
                  <button className={icon} disabled={ii === 0} onClick={() => moveItem(gi, ii, -1)} aria-label="Move up" title="Move up"><ChevronUp className="h-4 w-4" /></button>
                  <button className={icon} disabled={ii === g.items.length - 1} onClick={() => moveItem(gi, ii, 1)} aria-label="Move down" title="Move down"><ChevronDown className="h-4 w-4" /></button>
                  <button className={icon} onClick={() => toggle(it)} aria-label={it.active ? 'Hide' : 'Show'} title={it.active ? 'Hide from website' : 'Show on website'}>{it.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  <button className={icon} onClick={() => setEditing(it)} aria-label="Edit" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className={confirm === it.id ? `${btn} bg-red-600 px-2.5 text-white` : `${icon} hover:text-red-500`} onClick={() => del(it)} aria-label="Delete" title="Delete">
                    {confirm === it.id ? 'Delete?' : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {editing && <Editor item={editing === 'new' ? null : editing} categories={groups.map(g => g.name)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}
