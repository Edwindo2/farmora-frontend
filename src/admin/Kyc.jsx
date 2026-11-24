import { useEffect, useState } from 'react'
import { Check, X, FileText, ExternalLink, ShieldCheck, Hourglass, ShieldAlert, RotateCcw } from 'lucide-react'
import { api } from './api'
import { date, btn, input } from './ui'

// KYC review. Documents stay here after a decision, so they can be opened again at any time.
const STATUS = {
  pending: ['In review', 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25', Hourglass],
  approved: ['Verified', 'bg-lime/25 text-leaf ring-lime/50 dark:bg-lime/10 dark:text-lime dark:ring-lime/25', ShieldCheck],
  rejected: ['Rejected', 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25', ShieldAlert],
}

function Doc({ url, label }) {
  const [isPdf, setIsPdf] = useState(false)
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.03] hover:border-lime">
      {isPdf ? (
        <div className="grid h-40 place-items-center text-muted"><FileText className="h-10 w-10" /><span className="text-[12px]">PDF document</span></div>
      ) : (
        <img src={url} alt={label} onError={() => setIsPdf(true)} className="h-40 w-full object-contain" />
      )}
      <p className="flex items-center justify-between gap-2 border-t border-ink/10 px-3 py-2 text-[12px] text-muted group-hover:text-ink">{label} <ExternalLink className="h-3.5 w-3.5" /></p>
    </a>
  )
}

export default function Kyc() {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [busy, setBusy] = useState(null)
  const [reason, setReason] = useState({})
  const [error, setError] = useState('')
  const load = () => api('/kyc').then(setList).catch(e => { setError(e.message); setList([]) })
  useEffect(() => { load() }, [])

  async function decide(c, status) {
    if (status === 'rejected' && !reason[c.id]?.trim()) return setError(`Write a reason for ${c.name} before rejecting, so they know what to fix.`)
    setBusy(c.id); setError('')
    try { await api(`/kyc/${c.id}`, { method: 'PATCH', body: { status, note: reason[c.id] } }); await load() }
    catch (e) { setError(e.message) }
    setBusy(null)
  }

  const counts = { pending: 0, approved: 0, rejected: 0 }
  ;(list || []).forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1 })
  const shown = (list || []).filter(c => filter === 'all' || c.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Customers</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">KYC verification</h1>
        <p className="mt-2 max-w-[44em] text-[14px] text-muted">Check each customer's ID and approve or reject it. They get an email and a dashboard notification. Documents stay available here after you decide.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[['pending', 'Waiting'], ['approved', 'Verified'], ['rejected', 'Rejected'], ['all', 'All']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-full px-3.5 py-1.5 text-[12.5px] ${filter === v ? 'bg-lime text-night' : 'border border-ink/15 bg-paper text-muted hover:text-ink'}`}>
            {l}{v !== 'all' && ` (${counts[v] || 0})`}
          </button>
        ))}
      </div>
      {error && <p className="rounded-lg bg-red-500/10 px-4 py-2 text-[13px] text-red-600 dark:text-red-300" role="alert">{error}</p>}

      {list === null && <p className="text-faint">Loading…</p>}
      {list && shown.length === 0 && <p className="rounded-2xl border border-dashed border-ink/15 bg-paper p-10 text-center text-[14px] text-faint">{filter === 'pending' ? 'No documents waiting for review.' : 'Nothing here.'}</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        {shown.map(c => {
          const [label, style, Icon] = STATUS[c.status] || STATUS.pending
          return (
            <section key={c.id} className="rounded-2xl border border-ink/10 bg-paper p-5">
              <div className="flex items-start gap-3">
                {c.avatarUrl
                  ? <img src={c.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime/20 font-semibold text-lime">{c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}{c.company && <span className="font-normal text-faint"> · {c.company}</span>}</p>
                  <p className="truncate text-[12.5px] text-muted">{c.email}{c.phone && ` · ${c.phone}`}</p>
                  <p className="text-[12px] capitalize text-faint">{c.accountType}{c.country && ` · ${c.country}`}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${style}`}><Icon className="h-3.5 w-3.5" />{label}</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <div><dt className="text-[11px] uppercase tracking-[0.1em] text-faint">ID type</dt><dd>{c.idType}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-[0.1em] text-faint">ID number</dt><dd className="font-mono">{c.idNumber}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-[0.1em] text-faint">Submitted</dt><dd>{c.submittedAt ? date(c.submittedAt) : '—'}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-[0.1em] text-faint">Reviewed</dt><dd>{c.reviewedAt ? date(c.reviewedAt) : '—'}</dd></div>
              </dl>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Doc url={c.document} label="ID document" />
                <Doc url={c.extra} label="Proof of address / CAC" />
              </div>

              {c.status === 'rejected' && c.note && <p className="mt-3 text-[13px] text-muted">Reason given: {c.note}</p>}

              <div className="mt-4 space-y-2 border-t border-ink/10 pt-4">
                {c.status !== 'approved' && (
                  <input className={input} placeholder="Reason if rejecting (sent to the customer)" value={reason[c.id] || ''} onChange={e => setReason({ ...reason, [c.id]: e.target.value })} />
                )}
                <div className="flex flex-wrap gap-2">
                  {c.status !== 'approved' && <button disabled={busy === c.id} onClick={() => decide(c, 'approved')} className={`${btn} bg-lime text-night hover:brightness-95`}><Check className="h-4 w-4" /> Approve</button>}
                  {c.status !== 'rejected' && c.status !== 'approved' && <button disabled={busy === c.id} onClick={() => decide(c, 'rejected')} className={`${btn} border border-ink/15 hover:border-red-500 hover:text-red-500`}><X className="h-4 w-4" /> Reject</button>}
                  {c.status === 'approved' && <button disabled={busy === c.id} onClick={() => confirm(`Move ${c.name} back to review?`) && decide(c, 'pending')} className={`${btn} border border-ink/15 hover:border-ink`}><RotateCcw className="h-4 w-4" /> Move back to review</button>}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
