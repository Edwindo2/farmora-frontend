// Small shared pieces for the admin dashboard and the tracking page.

// Badge colours for the dark admin, and a light set for the public tracking page.
export const STATUS_STYLE = {
  received: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
  paid: 'bg-lime/25 text-leaf ring-lime/50 dark:bg-lime/10 dark:text-lime dark:ring-lime/25',
  processing: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25',
  shipped: 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/25',
  delivered: 'bg-lime text-night ring-lime',
  cancelled: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25',
  unpaid: 'bg-ink/5 text-muted ring-ink/10',
  refunded: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25',
  new: 'bg-lime text-night ring-lime',
  read: 'bg-ink/5 text-muted ring-ink/10',
  replied: 'bg-lime/25 text-leaf ring-lime/50 dark:bg-lime/10 dark:text-lime dark:ring-lime/25',
  archived: 'bg-ink/5 text-faint ring-ink/10',
}
export const STATUS_LIGHT = {
  received: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  processing: 'bg-violet-50 text-violet-800 ring-violet-200',
  shipped: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  delivered: 'bg-ink text-white ring-ink',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

export const FLOW = ['received', 'confirmed', 'paid', 'processing', 'shipped', 'delivered']

export function Badge({ value, light = false }) {
  const map = light ? STATUS_LIGHT : STATUS_STYLE
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ${map[value] || STATUS_STYLE.read}`}>
      {value}
    </span>
  )
}

export function fmt(amount, currency) {
  if (amount == null) return '—'
  return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export const date = d => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-ink/10 bg-paper p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-faint">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export const input = 'w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-[14px] text-ink outline-none transition focus:border-lime focus:ring-4 focus:ring-lime/15'
export const btn = 'btn-micro inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium disabled:opacity-50'
