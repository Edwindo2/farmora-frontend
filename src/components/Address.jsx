import { useState } from 'react'
import { MapPin, Phone, Star, Pencil, Trash2 } from 'lucide-react'

export const NG_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara']

// Saved delivery addresses: the form and the card, used at checkout and in the dashboard.

export const EMPTY_ADDRESS = { label: 'Home', deliveryType: 'local', fullName: '', phone: '', country: '', state: '', city: '', address: '', port: '', isDefault: false }

const box = 'w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-[14.5px] text-ink outline-none transition placeholder:text-faint focus:border-grass focus:ring-4 focus:ring-grass/10'

export function addressLines(a) {
  return a.deliveryType === 'local'
    ? [a.address, [a.city, a.state].filter(Boolean).join(', '), 'Nigeria']
    : [[a.city, a.state].filter(Boolean).join(', '), a.country, a.port && `Port / airport: ${a.port}`]
}

export function AddressForm({ value, onChange, lockType = false }) {
  const set = k => e => onChange({ ...value, [k]: e.target.value })
  const local = value.deliveryType === 'local'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!lockType && (
        <div className="flex gap-2 sm:col-span-2" role="radiogroup" aria-label="Address type">
          {[['local', 'In Nigeria'], ['international', 'Outside Nigeria']].map(([v, l]) => (
            <button type="button" key={v} role="radio" aria-checked={value.deliveryType === v} onClick={() => onChange({ ...value, deliveryType: v })}
              className={`flex-1 rounded-full border py-2 text-[13.5px] font-medium ${value.deliveryType === v ? 'border-grass bg-grass/10 text-grass' : 'border-ink/15 text-muted hover:border-ink/40'}`}>{l}</button>
          ))}
        </div>
      )}
      <input className={box} placeholder="Recipient full name *" value={value.fullName} onChange={set('fullName')} autoComplete="name" />
      <input className={box} placeholder="Phone / WhatsApp *" type="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" />
      {local ? (
        <>
          <select className={box} value={value.state || ''} onChange={set('state')} aria-label="State">
            <option value="">State *</option>
            {NG_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input className={box} placeholder="City / town *" value={value.city} onChange={set('city')} autoComplete="address-level2" />
          <input className={`${box} sm:col-span-2`} placeholder="Street address and landmark *" value={value.address || ''} onChange={set('address')} autoComplete="street-address" />
        </>
      ) : (
        <>
          <input className={box} placeholder="Country *" value={value.country} onChange={set('country')} autoComplete="country-name" />
          <input className={box} placeholder="City *" value={value.city} onChange={set('city')} autoComplete="address-level2" />
          <input className={box} placeholder="State / region" value={value.state || ''} onChange={set('state')} />
          <input className={box} placeholder="Destination port or airport *" value={value.port || ''} onChange={set('port')} />
          <input className={`${box} sm:col-span-2`} placeholder="Delivery address (optional)" value={value.address || ''} onChange={set('address')} />
        </>
      )}
      <input className={box} placeholder="Label, e.g. Home, Shop, Warehouse" value={value.label} onChange={set('label')} />
      <label className="flex items-center gap-2 text-[13.5px] text-ink"><input type="checkbox" checked={value.isDefault} onChange={e => onChange({ ...value, isDefault: e.target.checked })} /> Make this my default address</label>
    </div>
  )
}

export function AddressCard({ a, selected, onSelect, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const Tag = onSelect ? 'button' : 'div'
  return (
    <Tag type={onSelect ? 'button' : undefined} onClick={onSelect} aria-pressed={onSelect ? selected : undefined}
      className={`relative block w-full rounded-2xl border-2 bg-paper p-4 text-left transition ${selected ? 'border-grass shadow-md' : 'border-ink/10 hover:border-ink/30'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
          {onSelect && <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? 'border-grass' : 'border-ink/25'}`}>{selected && <span className="h-2.5 w-2.5 rounded-full bg-grass" />}</span>}
          {a.label}
          {a.isDefault && <span className="flex items-center gap-1 rounded-full bg-sun/25 px-2 py-0.5 text-[10.5px] font-semibold text-ink"><Star className="h-3 w-3" /> Default</span>}
        </p>
        {(onEdit || onDelete) && (
          <span className="flex gap-1" onClick={e => e.stopPropagation()}>
            {onEdit && <span role="button" tabIndex={0} onClick={onEdit} onKeyDown={e => e.key === 'Enter' && onEdit()} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-ink/5 hover:text-ink" aria-label="Edit address"><Pencil className="h-4 w-4" /></span>}
            {onDelete && <span role="button" tabIndex={0} onClick={() => { if (confirm) onDelete(); else { setConfirm(true); setTimeout(() => setConfirm(false), 3000) } }} className={`grid h-8 place-items-center rounded-lg px-2 text-[12px] ${confirm ? 'bg-ruby text-white' : 'w-8 text-faint hover:bg-ink/5 hover:text-ruby'}`} aria-label="Delete address">{confirm ? 'Delete?' : <Trash2 className="h-4 w-4" />}</span>}
          </span>
        )}
      </div>
      <p className="mt-2 text-[14px] font-medium text-ink">{a.fullName}</p>
      <p className="mt-1 flex gap-2 text-[13.5px] text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{addressLines(a).filter(Boolean).map((l, i) => <span key={i} className="block">{l}</span>)}</span></p>
      <p className="mt-1 flex items-center gap-2 text-[13.5px] text-muted"><Phone className="h-4 w-4" />{a.phone}</p>
    </Tag>
  )
}
