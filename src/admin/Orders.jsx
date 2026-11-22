import { ADMIN } from './path'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from './api'
import { Badge, FLOW, fmt, date, input } from './ui'

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const [q, setQ] = useState(params.get('q') || '')
  const [rows, setRows] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams()
      if (status) qs.set('status', status)
      if (q) qs.set('q', q)
      api(`/orders?${qs}`).then(setRows).catch(() => setRows([]))
    }, 200)
    return () => clearTimeout(t)
  }, [status, q])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-lime">Orders</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">All orders</h1>
        </div>
        <input className={`${input} max-w-xs`} placeholder="Search ref, name, email, city…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['', ...FLOW, 'cancelled'].map(s => (
          <button key={s || 'all'} onClick={() => setParams(s ? { status: s } : {})}
            className={`btn-micro rounded-full px-3.5 py-1.5 text-[12.5px] capitalize ${status === s ? 'bg-lime text-night' : 'border border-ink/15 bg-paper text-muted hover:text-ink'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.1em] text-faint">
            <tr><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Destination</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Payment</th><th className="px-5 py-3 font-medium">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {rows === null && <tr><td colSpan="6" className="px-5 py-8 text-center text-faint">Loading…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-faint">No orders found.</td></tr>}
            {rows?.map(o => (
              <tr key={o.reference} className="transition-colors hover:bg-ink/[0.04]">
                <td className="px-5 py-3.5"><Link to={`${ADMIN}/orders/${o.reference}`} className="font-medium text-ink hover:underline">{o.reference}</Link><p className="text-[12px] text-faint">{date(o.createdAt)}</p></td>
                <td className="px-5 py-3.5">{o.customer}<p className="text-[12px] text-faint">{o.email}</p></td>
                <td className="px-5 py-3.5">{o.destination}<p className="text-[12px] capitalize text-faint">{o.deliveryType}</p></td>
                <td className="px-5 py-3.5">{o.quoteNeeded ? <span className="text-scarlet">Needs quote</span> : fmt(o.total, o.currency)}</td>
                <td className="px-5 py-3.5"><Badge value={o.paymentStatus} /></td>
                <td className="px-5 py-3.5"><Badge value={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
