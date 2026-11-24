import { ADMIN } from './path'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Hourglass } from 'lucide-react'
import { api } from './api'
import { date, btn } from './ui'

const TYPE = {
  individual: 'bg-ink/5 text-muted ring-ink/10',
  wholesale: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
  distributor: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25',
  international: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
}

export default function Customers() {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(null)
  const load = () => api('/customers').then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])

  async function decide(c, wholesaleStatus) {
    setBusy(c.id)
    try { await api(`/customers/${c.id}`, { method: 'PATCH', body: { wholesaleStatus } }); await load() } finally { setBusy(null) }
  }

  const pending = (list || []).filter(c => c.wholesaleStatus === 'pending')
  const shown = (list || []).filter(c => filter === 'all' || (filter === 'pending' ? c.wholesaleStatus === 'pending' : c.accountType === filter))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Customers</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Buyers</h1>
        <p className="mt-2 max-w-[42em] text-[14px] text-muted">Approve distributor and wholesale applications here. Approved distributors see the distributor prices and approved wholesale buyers see the wholesale prices you set on the Products page. They are emailed when you decide.</p>
      </div>

      {pending.length > 0 && (
        <section className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Hourglass className="h-4 w-4" /> {pending.length} application{pending.length > 1 ? 's' : ''} waiting</h2>
          <ul className="mt-3 divide-y divide-ink/10">
            {pending.map(c => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.company || c.name} <span className="font-normal text-faint">· {c.name}</span> <span className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium capitalize ring-1 ring-inset ${TYPE[c.accountType] || TYPE.individual}`}>{c.accountType}</span></p>
                  <p className="text-[12.5px] text-muted">{c.email} · {c.phone} · {c.country}</p>
                  {c.accountType === 'distributor' && <p className="text-[12.5px] text-muted">Covers: {c.area || '-'}{c.monthlyVolume ? ` · Volume: ${c.monthlyVolume}` : ''}</p>}
                </div>
                <button disabled={busy === c.id} onClick={() => decide(c, 'approved')} className={`${btn} bg-lime text-night hover:brightness-95`}><Check className="h-4 w-4" /> Approve</button>
                <button disabled={busy === c.id} onClick={() => decide(c, 'rejected')} className={`${btn} border border-ink/15 hover:border-red-500 hover:text-red-500`}><X className="h-4 w-4" /> Decline</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {[['all', 'All'], ['distributor', 'Distributors'], ['wholesale', 'Wholesale'], ['international', 'International'], ['pending', 'Pending approval']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-full px-3.5 py-1.5 text-[12.5px] ${filter === v ? 'bg-lime text-night' : 'border border-ink/15 bg-paper text-muted hover:text-ink'}`}>{l}</button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full min-w-[920px] text-left text-[14px]">
          <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.1em] text-faint">
            <tr><th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Contact</th><th className="px-5 py-3 font-medium">Account</th><th className="px-5 py-3 font-medium">KYC</th><th className="px-5 py-3 font-medium">Country</th><th className="px-5 py-3 font-medium">Orders</th><th className="px-5 py-3 font-medium">Since</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {list === null && <tr><td colSpan="8" className="px-5 py-8 text-center text-faint">Loading…</td></tr>}
            {list && shown.length === 0 && <tr><td colSpan="8" className="px-5 py-8 text-center text-faint">No customers here.</td></tr>}
            {shown.map(c => (
              <tr key={c.id} className="hover:bg-ink/[0.04]">
                <td className="px-5 py-3.5 font-medium">
                  <div className="flex items-center gap-3">
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime/15 text-[11px] font-semibold text-lime">{c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
                    <div>{c.name}{c.company && <p className="text-[12px] font-normal text-faint">{c.company}</p>}</div>
                  </div>
                </td>
                <td className="px-5 py-3.5">{c.email}<p className="text-[12px] text-faint">{c.phone}</p></td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ${TYPE[c.accountType] || TYPE.individual}`}>{c.accountType}</span>
                  {c.wholesaleStatus !== 'none' && <p className="mt-1 text-[11.5px] capitalize text-faint">{c.wholesaleStatus}</p>}
                  {c.accountType === 'distributor' && c.area && <p className="mt-1 text-[11.5px] text-faint">Covers: {c.area}</p>}
                  {!c.registered && <p className="mt-1 text-[11.5px] text-faint">Guest (no account)</p>}
                </td>
                <td className="px-5 py-3.5 text-[12.5px]">{c.kycStatus === 'none' ? <span className="text-faint">Not sent</span> : <Link to={`${ADMIN}/kyc`} className={`capitalize hover:underline ${c.kycStatus === 'approved' ? 'text-lime' : c.kycStatus === 'rejected' ? 'text-red-500' : 'text-amber-600 dark:text-amber-300'}`}>{c.kycStatus === 'approved' ? 'Verified' : c.kycStatus === 'pending' ? 'In review' : 'Rejected'}</Link>}</td>
                <td className="px-5 py-3.5">{c.country}</td>
                <td className="px-5 py-3.5"><Link className="link-u" to={`${ADMIN}/orders?q=${encodeURIComponent(c.email)}`}>{c.orders}</Link></td>
                <td className="px-5 py-3.5 text-faint">{date(c.createdAt)}</td>
                <td className="space-x-3 whitespace-nowrap px-5 py-3.5 text-right">
                  {c.registered && <Link to={`${ADMIN}/notify?to=${c.id}`} className="text-[12.5px] text-muted hover:text-ink">Message</Link>}
                  {c.wholesaleStatus === 'approved'
                    ? <button disabled={busy === c.id} onClick={() => decide(c, 'none')} className="text-[12.5px] text-muted hover:text-red-500">{c.accountType === 'distributor' ? 'Remove approval' : 'Remove wholesale'}</button>
                    : c.wholesaleStatus !== 'pending' && c.registered && <button disabled={busy === c.id} onClick={() => decide(c, 'approved')} className="text-[12.5px] text-lime hover:underline">{c.accountType === 'distributor' ? 'Approve distributor' : 'Make wholesale'}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
