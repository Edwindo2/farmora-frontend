import { useEffect, useState } from 'react'
import { Landmark, DollarSign, CreditCard, CheckCircle2, Info } from 'lucide-react'
import { api } from './api'
import { input, btn } from './ui'

// Bank transfer details shown to customers on a confirmed order, next to "Pay with Flutterwave".
const SECTIONS = [
  ['Naira account (Nigerian customers)', Landmark, [
    ['bankName', 'Bank name', 'e.g. Zenith Bank'],
    ['accountName', 'Account name', 'e.g. Farmora AgriTrade Limited'],
    ['accountNumber', 'Account number (10 digits)', '0123456789'],
  ]],
  ['Dollar account (international customers, optional)', DollarSign, [
    ['usdBankName', 'Bank name', 'e.g. Zenith Bank (domiciliary)'],
    ['usdAccountName', 'Account name', 'e.g. Farmora AgriTrade Limited'],
    ['usdAccountNumber', 'Account number', ''],
    ['usdSwift', 'SWIFT / BIC code', 'e.g. ZEIBNGLA'],
  ]],
]

export default function Payments() {
  const [f, setF] = useState(null)
  const [saved, setSaved] = useState(null)
  const [errors, setErrors] = useState([])
  const [state, setState] = useState('')
  useEffect(() => { api('/bank').then(d => { setF(d); setSaved(d) }).catch(e => setErrors([e.message])) }, [])
  const dirty = f && saved && Object.keys(f).some(k => f[k] !== saved[k])

  async function save(e) {
    e.preventDefault()
    setState('saving'); setErrors([])
    try {
      const d = await api('/bank', { method: 'PUT', body: f })
      setF(d); setSaved(d); setState('saved')
      setTimeout(() => setState(''), 2500)
    } catch (err) { setErrors(err.message.split(/(?<=\.)\s+/)); setState('') }
  }

  if (!f) return <p className="text-faint">{errors[0] || 'Loading…'}</p>

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-lime">Settings</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Payments</h1>
          <p className="mt-2 max-w-[44em] text-[14px] text-muted">Customers pay a confirmed order by Flutterwave or bank transfer. The bank details below are shown only to the customer, on an order that is ready to pay. When they tap "I've made the transfer", you get a notification and an email. Check your account, then mark the order as paid.</p>
        </div>
        <div className="flex items-center gap-3">
          {state === 'saved' && <span className="flex items-center gap-1.5 text-[13px] text-lime"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
          <button className={`${btn} bg-lime text-night hover:brightness-95`} disabled={!dirty || state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
      {errors.length > 0 && <ul className="rounded-lg bg-red-500/10 px-4 py-3 text-[13px] text-red-500" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {SECTIONS.map(([title, Icon, fields]) => (
            <section key={title} className="rounded-2xl border border-ink/10 bg-paper p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Icon className="h-4 w-4 text-lime" /> {title}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fields.map(([k, label, ph]) => (
                  <label key={k}>
                    <span className="mb-1.5 block text-[12px] text-muted">{label}</span>
                    <input className={input} value={f[k] || ''} placeholder={ph} inputMode={k === 'accountNumber' ? 'numeric' : undefined} onChange={e => setF({ ...f, [k]: e.target.value })} />
                  </label>
                ))}
              </div>
            </section>
          ))}
          <section className="rounded-2xl border border-ink/10 bg-paper p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Info className="h-4 w-4 text-lime" /> Note for customers (optional)</h2>
            <textarea className={`${input} mt-4 min-h-20`} maxLength={400} placeholder="e.g. Use your order number as the payment description. Transfers are confirmed within 2 working hours." value={f.note || ''} onChange={e => setF({ ...f, note: e.target.value })} />
          </section>
          <section className="flex gap-3 rounded-2xl border border-ink/10 bg-paper p-6 text-[13.5px] text-muted">
            <CreditCard className="h-5 w-5 shrink-0 text-lime" />
            <p><b className="text-ink">Flutterwave (card, transfer, USSD):</b> switches on when the Flutterwave keys are added on Render (FLW_SECRET_KEY and FLW_SECRET_HASH). Until then customers see bank transfer only.</p>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-ink/10 bg-paper p-6 xl:sticky xl:top-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-faint">Preview · what the customer sees</p>
          <div className="mt-4 rounded-xl bg-ink/[0.04] p-4 text-[13.5px]">
            <p className="font-semibold">Pay by bank transfer</p>
            {f.accountNumber ? (
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between gap-3"><dt className="text-muted">Bank</dt><dd className="text-right font-medium">{f.bankName}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Account name</dt><dd className="text-right font-medium">{f.accountName}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Account number</dt><dd className="font-mono text-[15px] font-semibold tracking-wider">{f.accountNumber}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Description</dt><dd className="font-mono">FM-XXXXXX</dd></div>
              </dl>
            ) : <p className="mt-2 text-faint">Add the Naira account to show bank transfer to customers.</p>}
            {f.note && <p className="mt-3 border-t border-ink/10 pt-3 text-[12.5px] text-muted">{f.note}</p>}
          </div>
        </aside>
      </div>
    </form>
  )
}
