import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, X, Loader2, Package } from 'lucide-react'
import { api } from './api'
import { input, btn } from './ui'

const lime = `${btn} bg-lime text-night hover:brightness-95`
const ghost = `${btn} border border-ink/15 text-ink hover:border-ink/40`

async function uploadImage(file) {
  const res = await fetch('/api/admin/uploads', { method: 'POST', credentials: 'include', headers: { 'Content-Type': file.type }, body: file })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Upload failed.')
  return data.url
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-paper p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Create or edit an oil: name, label, description, photo and visibility.
function ProductForm({ product, onDone, onClose }) {
  const [f, setF] = useState({ name: product?.name || '', tag: product?.tag || '', description: product?.description || '', image: product?.image || '', active: product?.active ?? true })
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function pick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErrors([])
    try { setF(v => ({ ...v, image: '' })); const url = await uploadImage(file); setF(v => ({ ...v, image: url })) }
    catch (err) { setErrors([err.message]) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true); setErrors([])
    try {
      const saved = product
        ? await api(`/products/${product.id}`, { method: 'PATCH', body: f })
        : await api('/products', { method: 'POST', body: f })
      onDone(saved, !product)
    } catch (err) {
      setErrors(err.message.split(/(?<=\.)\s+/))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={product ? `Edit ${product.name}` : 'Add a new oil'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[12px] text-muted">Photo</span>
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative grid aspect-[3/2] w-full place-items-center overflow-hidden rounded-xl border border-dashed border-ink/20 bg-mist hover:border-lime/60">
            {f.image ? <img src={f.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
            <span className={`relative flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] ${f.image ? 'bg-black/60 text-white opacity-0 group-hover:opacity-100' : 'text-muted'}`}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><ImagePlus className="h-4 w-4" /> {f.image ? 'Change photo' : 'Upload a photo (JPG, PNG or WebP)'}</>}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
          {f.image && <button type="button" onClick={() => setF({ ...f, image: '' })} className="mt-1.5 text-[12px] text-muted hover:text-ink">Remove photo</button>}
        </div>
        <label className="block"><span className="mb-1.5 block text-[12px] text-muted">Name</span>
          <input className={input} value={f.name} onChange={set('name')} placeholder="e.g. Refined Palm Olein" required /></label>
        <label className="block"><span className="mb-1.5 block text-[12px] text-muted">Short label</span>
          <input className={input} value={f.tag} onChange={set('tag')} placeholder="e.g. Refined · Cooking" required /></label>
        <label className="block"><span className="mb-1.5 block text-[12px] text-muted">Description</span>
          <textarea className={`${input} min-h-24 resize-y`} value={f.description} onChange={set('description')} placeholder="What it is and who it's for." required /></label>
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Show in the shop</label>
        {errors.length > 0 && <ul className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-500" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghost} onClick={onClose}>Cancel</button>
          <button className={lime} disabled={busy || uploading}>{busy ? 'Saving…' : product ? 'Save changes' : 'Add oil'}</button>
        </div>
        {!product && <p className="text-[12px] text-faint">Next, add pack sizes and prices. The oil only appears in the shop once it has at least one pack size.</p>}
      </form>
    </Modal>
  )
}

function DeleteDialog({ product, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function del() {
    setBusy(true)
    try { await api(`/products/${product.id}`, { method: 'DELETE' }); onDeleted() }
    catch (e) { setError(e.message); setBusy(false) }
  }
  return (
    <Modal title={`Delete ${product.name}?`} onClose={onClose}>
      <p className="text-[14px] leading-relaxed text-muted">This removes the oil and all {product.variants.length} pack sizes from the catalogue. It can't be undone.</p>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">Past orders keep their own copy of names and prices, so order history isn't affected. To stop selling it for now, use <b className="text-ink">Hide</b> instead.</p>
      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button className={ghost} onClick={onClose}>Cancel</button>
        <button className={`${btn} bg-red-600 text-white hover:bg-red-700`} onClick={del} disabled={busy}>{busy ? 'Deleting…' : 'Delete oil'}</button>
      </div>
    </Modal>
  )
}

function VariantRow({ v, onSaved }) {
  const initial = { label: v.label, ngn: v.ngn ?? '', usd: v.usd ?? '', wholesaleNgn: v.wholesaleNgn ?? '', wholesaleUsd: v.wholesaleUsd ?? '', stock: v.stock ?? '', active: v.active }
  const [f, setF] = useState(initial)
  const [state, setState] = useState('')
  const [confirm, setConfirm] = useState(false)
  const dirty = Object.keys(initial).some(k => String(f[k]) !== String(initial[k]))

  async function save() {
    setState('saving')
    try { await api(`/variants/${v.id}`, { method: 'PATCH', body: f }); setState('saved'); onSaved() }
    catch (e) { setState(e.message) }
  }
  async function del() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
    try { await api(`/variants/${v.id}`, { method: 'DELETE' }); onSaved() } catch (e) { setState(e.message) }
  }

  return (
    <tr className="align-middle">
      <td className="py-2.5 pr-3"><input className={`${input} w-36`} value={f.label} onChange={e => setF({ ...f, label: e.target.value })} aria-label="Pack size" /><p className="mt-1 text-[10px] text-faint">{v.sku}</p></td>
      <td className="py-2.5 pr-3"><input className={`${input} w-28`} inputMode="decimal" placeholder="Quote" value={f.ngn} onChange={e => setF({ ...f, ngn: e.target.value })} aria-label="Price in naira" /></td>
      <td className="py-2.5 pr-3"><input className={`${input} w-24`} inputMode="decimal" placeholder="Quote" value={f.usd} onChange={e => setF({ ...f, usd: e.target.value })} aria-label="Price in dollars" /></td>
      <td className="py-2.5 pr-3"><input className={`${input} w-28`} inputMode="decimal" placeholder="Same" value={f.wholesaleNgn} onChange={e => setF({ ...f, wholesaleNgn: e.target.value })} aria-label="Wholesale price in naira" /></td>
      <td className="py-2.5 pr-3"><input className={`${input} w-24`} inputMode="decimal" placeholder="Same" value={f.wholesaleUsd} onChange={e => setF({ ...f, wholesaleUsd: e.target.value })} aria-label="Wholesale price in dollars" /></td>
      <td className="py-2.5 pr-3"><input className={`${input} w-24`} inputMode="numeric" placeholder="Not tracked" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} aria-label="Stock" /></td>
      <td className="py-2.5 pr-3"><label className="flex items-center gap-2 whitespace-nowrap text-[13px]"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> On sale</label></td>
      <td className="py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {dirty ? <button className={lime} onClick={save} disabled={state === 'saving'}>Save</button>
            : state && state !== 'saving' && state !== 'saved' ? <span className="text-[12px] text-red-500">{state}</span> : null}
          <button onClick={del} className={`${btn} ${confirm ? 'bg-red-600 text-white' : 'text-faint hover:text-red-500'}`} aria-label={`Delete ${v.label}`} title="Delete pack size">
            {confirm ? 'Delete?' : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  )
}

function NewVariant({ productId, onSaved }) {
  const empty = { label: '', ngn: '', usd: '', wholesaleNgn: '', wholesaleUsd: '', stock: '' }
  const [f, setF] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function add(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try { await api(`/products/${productId}/variants`, { method: 'POST', body: { ...f, active: true } }); setF(empty); onSaved() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <form onSubmit={add} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-ink/15 p-3">
      <input className={`${input} w-36`} placeholder="New pack, e.g. 10 litres" value={f.label} onChange={e => setF({ ...f, label: e.target.value })} aria-label="New pack size" />
      <input className={`${input} w-28`} inputMode="decimal" placeholder="₦ price" value={f.ngn} onChange={e => setF({ ...f, ngn: e.target.value })} aria-label="New pack price in naira" />
      <input className={`${input} w-24`} inputMode="decimal" placeholder="$ price" value={f.usd} onChange={e => setF({ ...f, usd: e.target.value })} aria-label="New pack price in dollars" />
      <input className={`${input} w-28`} inputMode="decimal" placeholder="Wholesale ₦" value={f.wholesaleNgn} onChange={e => setF({ ...f, wholesaleNgn: e.target.value })} aria-label="New pack wholesale price in naira" />
      <input className={`${input} w-28`} inputMode="decimal" placeholder="Wholesale $" value={f.wholesaleUsd} onChange={e => setF({ ...f, wholesaleUsd: e.target.value })} aria-label="New pack wholesale price in dollars" />
      <input className={`${input} w-24`} inputMode="numeric" placeholder="Stock" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} aria-label="New pack stock" />
      <button className={`${ghost} ml-auto`} disabled={busy || !f.label.trim()}><Plus className="h-4 w-4" /> Add pack size</button>
      {error && <p className="w-full text-[12px] text-red-500">{error}</p>}
    </form>
  )
}

function CurrencyRates() {
  const [data, setData] = useState(null)
  const [rates, setRates] = useState({})
  const [msg, setMsg] = useState('')
  useEffect(() => { api('/fx').then(d => { setData(d); setRates(Object.fromEntries(d.codes.map(c => [c, d.rates[c] ?? '']))) }).catch(() => {}) }, [])
  async function save(e) {
    e.preventDefault(); setMsg('')
    try { const d = await api('/fx', { method: 'PUT', body: { rates } }); setData(d); setMsg('Saved') ; setTimeout(() => setMsg(''), 2000) } catch (err) { setMsg(err.message) }
  }
  if (!data) return null
  return (
    <form onSubmit={save} className="rounded-2xl border border-ink/10 bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold">Display currencies</h2>
          <p className="text-[12.5px] text-muted">Buyers abroad can view prices in these currencies. Enter how much 1 US dollar is worth; leave empty to hide a currency. Orders are still charged in USD.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-[12.5px] text-lime">{msg}</span>}
          <button className={lime}>Save rates</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {data.codes.map(c => (
          <label key={c} className="block"><span className="mb-1 block text-[11.5px] text-muted">1 USD = ? {c}</span>
            <input className={input} inputMode="decimal" value={rates[c] ?? ''} placeholder="Off" onChange={e => setRates({ ...rates, [c]: e.target.value })} /></label>
        ))}
      </div>
      {data.updatedAt && <p className="mt-3 text-[11.5px] text-faint">Last updated {new Date(data.updatedAt).toLocaleString()}. Check rates regularly.</p>}
    </form>
  )
}

export default function Products() {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [deleting, setDeleting] = useState(null)
  const load = () => api('/products').then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])

  async function toggle(p) {
    await api(`/products/${p.id}`, { method: 'PATCH', body: { active: !p.active } })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Products</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Oils & prices</h1>
          <p className="mt-2 max-w-[42em] text-[14px] text-muted">Add, edit, hide or delete oils and their pack sizes. Prices are in whole naira and dollars; leave a price empty to show "Quote on request", and leave stock empty if you don't track it. Wholesale prices are shown only to approved wholesale accounts; leave them empty to use the normal price.</p>
        </div>
        <button className={lime} onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add oil</button>
      </div>

      <CurrencyRates />
      {list === null && <p className="text-faint">Loading…</p>}
      {list?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/15 p-12 text-center text-muted">
          <Package className="mx-auto h-7 w-7 text-faint" strokeWidth={1.5} />
          <p className="mt-3">No oils yet. Add your first one.</p>
        </div>
      )}
      {list?.map(p => (
        <section key={p.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
          <div className="flex flex-wrap items-center gap-4 border-b border-ink/10 p-5">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-mist">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <h2 className="flex flex-wrap items-center gap-2 text-[18px] font-semibold">
                {p.name}
                {!p.active && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500">Hidden</span>}
                {p.active && p.variants.filter(v => v.active).length === 0 && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-300">No pack sizes on sale</span>}
              </h2>
              <p className="text-[12px] text-faint">{p.tag}</p>
              <p className="mt-1 line-clamp-1 max-w-[52em] text-[13px] text-muted">{p.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className={ghost}><Pencil className="h-4 w-4" /> Edit</button>
              <button onClick={() => toggle(p)} className={ghost} title={p.active ? 'Hide from the shop' : 'Show in the shop'}>
                {p.active ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> Show</>}
              </button>
              <button onClick={() => setDeleting(p)} className={`${btn} border border-red-500/30 text-red-500 hover:bg-red-500/10`} aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="overflow-x-auto p-5 pt-2">
            {p.variants.length > 0 && (
              <table className="w-full min-w-[960px] text-left text-[14px]">
                <thead className="text-[11px] uppercase tracking-[0.1em] text-faint">
                  <tr><th className="py-2 font-medium">Pack</th><th className="py-2 font-medium">Price ₦</th><th className="py-2 font-medium">Price $</th><th className="py-2 font-medium">Wholesale ₦</th><th className="py-2 font-medium">Wholesale $</th><th className="py-2 font-medium">Stock</th><th className="py-2 font-medium">Status</th><th /></tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {p.variants.map(v => <VariantRow key={[v.id, v.label, v.ngn, v.usd, v.wholesaleNgn, v.wholesaleUsd, v.stock, v.active].join('|')} v={v} onSaved={load} />)}
                </tbody>
              </table>
            )}
            <NewVariant productId={p.id} onSaved={load} />
          </div>
        </section>
      ))}

      {editing && <ProductForm product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load() }} />}
      {deleting && <DeleteDialog product={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); load() }} />}
    </div>
  )
}
