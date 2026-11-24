import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Users, User, Trash2, Mail, CheckCheck } from 'lucide-react'
import { api } from './api'
import { Card, date, btn, input } from './ui'

// Send a message to every customer, a group, or one customer. It shows in their dashboard notifications
// and Messages tab, and can also go out by email.
export default function Broadcasts() {
  const [params] = useSearchParams()
  const [data, setData] = useState(null)
  const [mode, setMode] = useState(params.get('to') ? 'one' : 'group')
  const [f, setF] = useState({ audience: 'all', customerId: params.get('to') || '', title: '', body: '', email: true })
  const [search, setSearch] = useState('')
  const [state, setState] = useState({ busy: false, error: '', ok: '' })
  const load = () => api('/broadcasts').then(setData).catch(e => setState(s => ({ ...s, error: e.message })))
  useEffect(() => { load() }, [])

  const customers = data?.customers || []
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter(c => !q || [c.name, c.email, c.company].some(v => v?.toLowerCase().includes(q))).slice(0, 50)
  }, [customers, search])
  const picked = customers.find(c => c.id === f.customerId)
  const group = data?.audiences.find(a => a.id === f.audience)
  const count = mode === 'one' ? (picked ? 1 : 0) : group?.count || 0

  async function send(e) {
    e.preventDefault()
    if (!count) return setState({ busy: false, error: mode === 'one' ? 'Choose a customer.' : 'No customers in that group yet.', ok: '' })
    if (!confirm(`Send "${f.title}" to ${mode === 'one' ? picked.name : `${count} customer${count > 1 ? 's' : ''}`}${f.email ? ' (also by email)' : ''}?`)) return
    setState({ busy: true, error: '', ok: '' })
    try {
      const res = await api('/broadcasts', { method: 'POST', body: { ...f, audience: mode === 'one' ? 'customer' : f.audience } })
      setState({ busy: false, error: '', ok: `Sent to ${res.recipients} customer${res.recipients > 1 ? 's' : ''}.` })
      setF(x => ({ ...x, title: '', body: '' }))
      load()
    } catch (err) { setState({ busy: false, error: err.message, ok: '' }) }
  }

  async function remove(b) {
    if (!confirm(`Delete "${b.title}"? It disappears from customers' dashboards (emails already sent can't be recalled).`)) return
    await api(`/broadcasts/${b.id}`, { method: 'DELETE' })
    load()
  }

  const tab = on => `flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium ${on ? 'bg-lime text-night' : 'border border-ink/15 text-muted hover:text-ink'}`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Customers</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Send a message</h1>
        <p className="mt-2 max-w-[44em] text-[14px] text-muted">Messages appear in the customer's dashboard (bell and Messages tab). Tick "also email" to send a copy to their inbox.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="New message">
          <form onSubmit={send} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMode('group')} className={tab(mode === 'group')}><Users className="h-4 w-4" /> Everyone / a group</button>
              <button type="button" onClick={() => setMode('one')} className={tab(mode === 'one')}><User className="h-4 w-4" /> One customer</button>
            </div>

            {mode === 'group' ? (
              <label className="block text-[12px] text-faint">Send to
                <select className={`${input} mt-1`} value={f.audience} onChange={e => setF({ ...f, audience: e.target.value })}>
                  {(data?.audiences || []).map(a => <option key={a.id} value={a.id}>{a.label} ({a.count})</option>)}
                </select>
              </label>
            ) : (
              <div className="space-y-2">
                {picked ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-lime/50 bg-lime/10 px-3 py-2 text-[14px]">
                    <span className="min-w-0 truncate"><b>{picked.name}</b> <span className="text-faint">{picked.company ? `· ${picked.company} ` : ''}· {picked.email}</span></span>
                    <button type="button" onClick={() => setF({ ...f, customerId: '' })} className="text-[12.5px] text-muted hover:text-ink">Change</button>
                  </div>
                ) : (
                  <>
                    <input className={input} placeholder="Search by name, email or business" value={search} onChange={e => setSearch(e.target.value)} />
                    <ul className="max-h-56 divide-y divide-ink/10 overflow-y-auto rounded-lg border border-ink/10">
                      {matches.length === 0 && <li className="px-3 py-3 text-[13px] text-faint">No registered customers match.</li>}
                      {matches.map(c => (
                        <li key={c.id}><button type="button" onClick={() => setF({ ...f, customerId: c.id })} className="block w-full px-3 py-2 text-left text-[13.5px] hover:bg-ink/[0.04]">{c.name} <span className="text-faint">{c.company ? `· ${c.company} ` : ''}· {c.email}</span></button></li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <input className={input} placeholder="Title, e.g. New price list for December" maxLength={120} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required />
            <textarea className={`${input} min-h-36`} placeholder="Your message" maxLength={4000} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} required />
            <label className="flex items-center gap-2 text-[13px] text-muted"><input type="checkbox" checked={f.email} onChange={e => setF({ ...f, email: e.target.checked })} /> Also send by email</label>
            {state.error && <p className="text-[13px] text-red-600 dark:text-red-300" role="alert">{state.error}</p>}
            {state.ok && <p className="text-[13px] text-lime" role="status">{state.ok}</p>}
            <button disabled={state.busy || !f.title.trim() || !f.body.trim()} className={`${btn} bg-lime text-night hover:brightness-95`}>
              <Send className="h-4 w-4" /> {state.busy ? 'Sending…' : `Send${count ? ` to ${count}` : ''}`}
            </button>
          </form>
        </Card>

        <Card title="Sent messages">
          {!data && <p className="text-faint">Loading…</p>}
          {data && data.sent.length === 0 && <p className="text-[14px] text-faint">Nothing sent yet.</p>}
          <ul className="divide-y divide-ink/10">
            {(data?.sent || []).map(b => (
              <li key={b.id} className="py-4 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{b.title}</p>
                    <p className="text-[12px] text-faint">To {b.audienceLabel} · {date(b.at)}</p>
                  </div>
                  <button onClick={() => remove(b)} className="shrink-0 text-faint hover:text-red-500" aria-label="Delete message"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[13px] text-muted">{b.body}</p>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-faint">
                  <span className="flex items-center gap-1"><CheckCheck className="h-3.5 w-3.5" /> Read by {b.read} of {b.recipients}</span>
                  {b.emailed && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Emailed</span>}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
