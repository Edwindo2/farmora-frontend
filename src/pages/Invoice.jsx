import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { accountApi, useMe, Shell, SignInPage } from './Account'
import { useSite } from '../site'
import { fmt, date } from '../admin/ui'

// Printable invoice for one order. "Print / Save as PDF" uses the browser's print dialog.
export default function Invoice() {
  const { reference } = useParams()
  const [me, , reload] = useMe()
  const { contact: c } = useSite()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { if (me) accountApi(`/orders/${reference}`).then(setOrder).catch(e => setError(e.message)) }, [me, reference])
  useEffect(() => { document.title = `Invoice ${reference} · Farmora`; return () => { document.title = 'Farmora — Palm Oil from Nigeria, Delivered Anywhere' } }, [reference])

  if (me === null) return <Shell><SignInPage onDone={reload} /></Shell>
  if (error) return <Shell><p className="py-24 text-center text-ruby">{error}</p></Shell>
  if (!order || !me) return <Shell><div className="grid place-items-center py-32 text-muted"><Loader2 className="h-6 w-6 animate-spin" /></div></Shell>

  const paid = order.paymentStatus === 'paid'
  const title = order.status === 'cancelled' ? 'Cancelled order' : paid ? 'Receipt' : 'Pro-forma invoice'
  const money = v => (v == null ? '—' : fmt(v, order.currency))
  const seller = [c.address, c.city, c.state, c.country].filter(Boolean).join(', ')

  return (
    <div className="min-h-svh bg-mist py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-5 flex max-w-3xl items-center justify-between px-5 print:hidden">
        <Link to={`/account/orders/${reference}`} className="flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to order</Link>
        <button onClick={() => window.print()} className="btn-micro flex items-center gap-2 rounded-full bg-grass px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-grass-deep"><Printer className="h-4 w-4" /> Print / Save as PDF</button>
      </div>

      <article className="mx-auto max-w-3xl bg-white px-8 py-10 text-[#1b2a1d] shadow-xl print:max-w-none print:px-0 print:py-0 print:shadow-none md:px-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-[#1f8a34] pb-6">
          <div className="flex items-center gap-3">
            <img src="/emblem.png" alt="" className="h-14 w-14" />
            <div>
              <p className="font-display text-[22px] font-extrabold leading-none text-[#17451c]">FARMORA</p>
              <p className="font-display text-[14px] font-bold text-[#d7261e]">Palm Oil</p>
              <p className="text-[11px] text-[#5b6b5d]">Farmora AgriTrade Limited</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="font-display text-[24px] font-extrabold uppercase tracking-wide text-[#17451c]">{title}</h1>
            <p className="mt-1 text-[13px]">No. <b>{order.reference}</b></p>
            <p className="text-[13px]">Date: {date(order.createdAt)}</p>
            {paid && <p className="mt-1 inline-block rounded-full bg-[#1f8a34] px-3 py-0.5 text-[11px] font-bold uppercase text-white">Paid</p>}
          </div>
        </header>

        <section className="grid gap-6 py-6 text-[13px] sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b867a]">From</p>
            <p className="mt-1 font-semibold">Farmora AgriTrade Limited</p>
            {seller && <p>{seller}</p>}
            {c.phone && <p>{[c.phone, c.phone2].filter(Boolean).join(' · ')}</p>}
            {c.email && <p>{c.email}</p>}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b867a]">Bill to</p>
            <p className="mt-1 font-semibold">{me.company || me.name}</p>
            {me.company && <p>{me.name}</p>}
            <p>{me.email}</p>
            {me.phone && <p>{me.phone}</p>}
            <p className="mt-2 text-[#5b6b5d]">Deliver to: {[order.address, order.port, order.destination].filter(Boolean).join(', ')}</p>
          </div>
        </section>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f1f6ec] text-left text-[11px] uppercase tracking-[0.08em] text-[#5b6b5d]">
              <th className="px-3 py-2.5 font-semibold">Item</th><th className="px-3 py-2.5 text-right font-semibold">Qty</th><th className="px-3 py-2.5 text-right font-semibold">Unit price</th><th className="px-3 py-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} className="border-b border-[#e6ebe1]">
                <td className="px-3 py-3"><b>{it.name}</b><br /><span className="text-[#7b867a]">{it.size}</span></td>
                <td className="px-3 py-3 text-right">{it.qty}</td>
                <td className="px-3 py-3 text-right">{it.unitPrice == null ? 'Quote' : money(it.unitPrice)}</td>
                <td className="px-3 py-3 text-right">{it.lineTotal == null ? 'Quote' : money(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs text-[13.5px]">
          <div className="flex justify-between py-1"><span className="text-[#5b6b5d]">Subtotal</span><span>{money(order.subtotal)}</span></div>
          <div className="flex justify-between py-1"><span className="text-[#5b6b5d]">Delivery</span><span>{order.deliveryFee == null ? 'To be confirmed' : money(order.deliveryFee)}</span></div>
          <div className="mt-1 flex justify-between border-t-2 border-[#17451c] py-2 text-[16px] font-bold"><span>Total ({order.currency})</span><span>{order.deliveryFee == null ? 'To be confirmed' : money(order.total)}</span></div>
        </div>

        <footer className="mt-8 border-t border-[#e6ebe1] pt-5 text-[12px] leading-relaxed text-[#5b6b5d]">
          <p>Payment method: <b className="text-[#1b2a1d]">{order.paymentMethod || 'To be agreed'}</b> · Payment status: <b className="capitalize text-[#1b2a1d]">{order.paymentStatus}</b></p>
          {!paid && order.status !== 'cancelled' && <p className="mt-1">This is a pro-forma invoice. The final total is confirmed once delivery is priced. Please don't pay until we send payment details.</p>}
          <p className="mt-3 font-script italic text-[#17451c]">From Nature to the World. Thank you for choosing Farmora.</p>
        </footer>
      </article>
    </div>
  )
}
