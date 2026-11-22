import { ADMIN } from './path'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from './api'
import { Badge, Card, FLOW, fmt, date, input, btn } from './ui'

const ACTION_LABEL = {
  confirmed: 'Confirm order',
  paid: 'Mark as paid',
  processing: 'Start packing',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
  cancelled: 'Cancel order',
}
const SHIPPING = { air: 'Air freight', fob: 'Sea – FOB Lagos', cif: 'Sea – CIF to port', advise: 'Please advise' }

export default function OrderDetail() {
  const { reference } = useParams()
  const [o, setO] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [fee, setFee] = useState('')
  const [tracking, setTracking] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [prices, setPrices] = useState({})
  const [saved, setSaved] = useState('')

  const load = data => {
    setO(data)
    setFee(data.deliveryFee ?? '')
    setTracking(data.trackingNumber ?? '')
    setAdminNotes(data.adminNotes ?? '')
    setPrices({})
  }
  useEffect(() => { api(`/orders/${reference}`).then(load).catch(e => setError(e.message)) }, [reference])

  async function update(body, msg = 'Saved') {
    setBusy(true); setError(''); setSaved('')
    try {
      load(await api(`/orders/${reference}`, { method: 'PATCH', body }))
      setNote('')
      setSaved(msg)
      setTimeout(() => setSaved(''), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !o) return <p className="text-scarlet">{error}</p>
  if (!o) return <p className="text-faint">Loading…</p>

  const step = FLOW.indexOf(o.status)
  const pendingPrices = Object.keys(prices).length > 0

  return (
    <div className="space-y-6">
      <Link to={`${ADMIN}/orders`} className="link-u text-[13px] text-muted">← All orders</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] text-faint">Placed {date(o.createdAt)}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.01em]">{o.reference}</h1>
        </div>
        <div className="flex gap-2"><Badge value={o.status} /><Badge value={o.paymentStatus} /></div>
      </div>

      {o.status !== 'cancelled' && (
        <ol className="grid grid-cols-6 gap-1 rounded-2xl border border-ink/10 bg-paper p-5">
          {FLOW.map((s, i) => (
            <li key={s}>
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-lime' : 'bg-ink/10'}`} />
              <p className={`mt-2 text-[11px] capitalize ${i <= step ? 'text-ink' : 'text-faint'}`}>{s}</p>
            </li>
          ))}
        </ol>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-[14px] text-red-600 dark:text-red-300" role="alert">{error}</p>}
      {saved && <p className="rounded-lg bg-lime/10 px-4 py-3 text-[14px] text-lime" role="status">{saved}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            <table className="w-full text-[14px]">
              <tbody className="divide-y divide-ink/8">
                {o.items.map(it => (
                  <tr key={it.id}>
                    <td className="py-3">{it.name}<p className="text-[12px] text-faint">{it.size}</p></td>
                    <td className="py-3 text-center">× {it.qty}</td>
                    <td className="py-3 text-right">
                      {it.unitPrice == null || prices[it.id] !== undefined ? (
                        <input
                          className={`${input} ml-auto w-32 text-right`}
                          placeholder={`Unit price (${o.currency})`}
                          inputMode="decimal"
                          value={prices[it.id] ?? ''}
                          onChange={e => setPrices(p => ({ ...p, [it.id]: e.target.value }))}
                        />
                      ) : (
                        <span>{fmt(it.lineTotal, o.currency)}<span className="block text-[11px] text-faint">{fmt(it.unitPrice, o.currency)} each</span></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingPrices && (
              <button className={`${btn} mt-3 bg-lime text-night hover:brightness-95`} disabled={busy} onClick={() => update({ itemPrices: prices }, 'Prices saved')}>Save prices</button>
            )}
            <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{o.quoteNeeded ? <span className="text-scarlet">Needs prices</span> : fmt(o.subtotal, o.currency)}</dd></div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="flex items-center gap-2">
                  <input className={`${input} w-32 text-right`} inputMode="decimal" placeholder="0" value={fee} onChange={e => setFee(e.target.value)} />
                  <button className={`${btn} border border-ink/15 hover:border-ink`} disabled={busy} onClick={() => update({ deliveryFee: fee }, 'Delivery fee saved')}>Save</button>
                </dd>
              </div>
              <div className="flex justify-between text-[16px] font-semibold"><dt>Total</dt><dd>{fmt(o.total, o.currency)}</dd></div>
            </dl>
          </Card>

          <Card title="Update status">
            {o.next.length === 0 ? (
              <p className="text-[14px] text-faint">This order is {o.status}. No further steps.</p>
            ) : (
              <div className="space-y-4">
                <textarea className={`${input} min-h-20`} placeholder="Message for this update (optional). If empty, the standard message is used." value={note} onChange={e => setNote(e.target.value)} />
                <label className="flex items-center gap-2 text-[13px] text-muted">
                  <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} /> Show this update to the customer on the tracking page
                </label>
                <div className="flex flex-wrap gap-2">
                  {o.next.map(s => (
                    <button key={s} disabled={busy}
                      onClick={() => (s !== 'cancelled' || confirm('Cancel this order?')) && update({ status: s, note, notifyCustomer: notify }, `Order ${s}`)}
                      className={`${btn} ${s === 'cancelled' ? 'border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10' : 'bg-lime text-night hover:brightness-95'}`}>
                      {ACTION_LABEL[s]} {s !== 'cancelled' && <span className="arr">→</span>}
                    </button>
                  ))}
                  {note && <button disabled={busy} onClick={() => update({ note, notifyCustomer: notify }, 'Note added')} className={`${btn} border border-ink/15 hover:border-ink`}>Add note only</button>}
                </div>
                {o.status === 'received' && o.total == null && <p className="text-[12px] text-scarlet">Set prices for every item before confirming.</p>}
              </div>
            )}
          </Card>

          <Card title="History">
            <ol className="space-y-4 border-l border-ink/15 pl-5">
              {[...o.events].reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-scarlet' : 'bg-ink/30'}`} />
                  <p className="text-[13px]"><b className="capitalize">{e.status}</b> <span className="text-faint">· {date(e.at)} · {e.by}{!e.public && ' · internal'}</span></p>
                  {e.note && <p className="text-[13px] text-muted">{e.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium">{o.customer.name}</p>
            <p className="text-[13px] capitalize text-faint">{o.customer.buyerType}{o.customer.company && ` · ${o.customer.company}`}</p>
            <div className="mt-3 space-y-1 text-[14px]">
              <a className="link-u block w-fit" href={`mailto:${o.customer.email}`}>{o.customer.email}</a>
              {o.customer.phone && <a className="link-u block w-fit" href={`https://wa.me/${o.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{o.customer.phone} (WhatsApp)</a>}
            </div>
          </Card>

          <Card title={o.deliveryType === 'local' ? 'Local delivery' : 'International shipping'}>
            <dl className="space-y-2 text-[14px]">
              {o.address && <div><dt className="text-[12px] text-faint">Address</dt><dd>{o.address}</dd></div>}
              <div><dt className="text-[12px] text-faint">Destination</dt><dd>{o.destination}</dd></div>
              {o.port && <div><dt className="text-[12px] text-faint">Port / airport</dt><dd>{o.port}</dd></div>}
              {o.shippingMethod && <div><dt className="text-[12px] text-faint">Shipping</dt><dd>{SHIPPING[o.shippingMethod]}</dd></div>}
              {o.paymentMethod && <div><dt className="text-[12px] text-faint">Preferred payment</dt><dd>{o.paymentMethod}</dd></div>}
              {o.neededBy && <div><dt className="text-[12px] text-faint">Needed by</dt><dd>{new Date(o.neededBy).toLocaleDateString()}</dd></div>}
              {o.notes && <div><dt className="text-[12px] text-faint">Customer notes</dt><dd className="whitespace-pre-wrap">{o.notes}</dd></div>}
            </dl>
          </Card>

          <Card title="Fulfilment">
            <div className="space-y-4">
              <label className="block text-[12px] text-faint">Tracking / waybill number
                <div className="mt-1 flex gap-2">
                  <input className={input} value={tracking} onChange={e => setTracking(e.target.value)} />
                  <button className={`${btn} border border-ink/15 hover:border-ink`} disabled={busy} onClick={() => update({ trackingNumber: tracking })}>Save</button>
                </div>
              </label>
              <label className="block text-[12px] text-faint">Payment status
                <select className={`${input} mt-1`} value={o.paymentStatus} disabled={busy} onChange={e => update({ paymentStatus: e.target.value }, 'Payment status saved')}>
                  <option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option>
                </select>
              </label>
              <label className="block text-[12px] text-faint">Internal notes (never shown to the customer)
                <textarea className={`${input} mt-1 min-h-20`} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
              </label>
              <button className={`${btn} border border-ink/15 hover:border-ink`} disabled={busy} onClick={() => update({ adminNotes }, 'Notes saved')}>Save notes</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
