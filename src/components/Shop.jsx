import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SectionHead } from './Story'
import { TONES, priceOf, quoteHref, orderHref } from '../lib'
import { useCart } from '../cart'
import { WishButton } from '../wishlist'

const tone = id => TONES[id] || 'from-[#e8641c] via-[#a8320a] to-[#4a1503]'

// Buying in Nigeria (bulk quote) or from abroad (export quotation).
export function ModeToggle({ mode, setMode }) {
  return (
    <div className="inline-flex rounded-full border border-ink/15 p-1 text-[12px]" role="radiogroup" aria-label="Where are you buying from?">
      {[
        ['local', 'Buying in Nigeria'],
        ['international', 'Buying from abroad'],
      ].map(([v, label]) => (
        <button
          key={v}
          role="radio"
          aria-checked={mode === v}
          onClick={() => setMode(v)}
          className={`rounded-full px-4 py-2 transition ${mode === v ? 'bg-grass text-white' : 'text-muted hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Price line for a pack size. Prices are hidden, except for approved distributors and wholesale
// accounts, who see their own price (the API only marks a size with `tier` for them).
export function TierPrice({ size, className = '' }) {
  const { mode, price } = useCart()
  const v = size?.tier ? priceOf(size, mode) : null
  if (v == null) return <p className={className}>Bulk price on request</p>
  return <p className={className}>Your {size.tier} price: <b className="whitespace-nowrap">{price(v)}</b></p>
}

// "Wholesale price" label with the normal price struck through, for approved wholesale accounts.
export function WholesaleNote({ size, mode }) {
  const { price: fmtPrice } = useCart()
  if (!size?.wholesale) return null
  const retail = mode === 'local' ? size.retailNgn : size.retailUsd
  return (
    <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
      <span className="rounded-full bg-sun/25 px-2 py-0.5 font-semibold text-ink">Wholesale price</span>
      {retail != null && <span className="text-faint line-through">{fmtPrice(retail, { plain: true })}</span>}
    </span>
  )
}

function ProductCard({ product, mode, index = 0 }) {
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id)
  const size = product.sizes.find(s => s.id === sizeId)

  return (
    <article style={{ '--d': `${index * 0.12}s` }} className="reveal lift group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper hover:border-ink/25">
      <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`} className={`sheen relative block aspect-[3/2] overflow-hidden bg-gradient-to-br ${tone(product.id)}`}>
        {product.image && <img
          src={product.image}
          alt={`Farmora ${product.name}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />}
        <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1.5 text-[10px] font-medium tracking-[0.2em] uppercase text-ink backdrop-blur">
          {product.tag}
        </span>
        <WishButton productId={product.id} sizeId={size?.id} className="absolute right-3 top-3 h-10 w-10 rounded-full bg-paper/90 text-ink shadow backdrop-blur hover:text-ruby" />
      </Link>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-[24px] font-bold leading-tight"><Link to={`/product/${product.id}`} className="hover:text-grass">{product.name}</Link></h3>
        <p className="mt-3 text-[14.5px] font-light leading-relaxed text-muted">{product.description}</p>

        <div className="mt-7 flex flex-wrap gap-2">
          {product.sizes.map(s => (
            <button
              key={s.id}
              onClick={() => setSizeId(s.id)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] transition ${
                s.id === sizeId ? 'border-scarlet bg-scarlet/10 text-ink' : 'border-ink/15 text-muted hover:border-ink/40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-faint">Price</p>
            <TierPrice size={size} className="mt-1 text-[14px] font-semibold text-grass" />
          </div>
          <Link
            to={size ? orderHref([{ product: product.id, size: size.id }]) : quoteHref({ type: mode === 'international' ? 'export' : 'wholesale', product: product.name })}
            className="btn-micro whitespace-nowrap rounded-full bg-grass px-5 py-3 text-[13px] font-medium text-white hover:bg-grass-deep"
          >
            Order now
          </Link>
        </div>
      </div>
    </article>
  )
}

// Full catalogue on the /shop page.
export default function Shop() {
  const { products, loadError: error, mode, setMode } = useCart()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') || '').trim().toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const shown = products.filter(p => p.sizes.length && words.every(w => `${p.name} ${p.tag} ${p.description} ${p.sizes.map(s => s.label).join(' ')}`.toLowerCase().includes(w)))
  return (
    <section id="oils" className="px-5 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead n="01" label="The Oils" title={<>Our oils, <em>one source.</em></>}>
          Supplied in bulk to wholesalers, distributors, food businesses and factories. Choose where you are buying
          from, pick a pack size and request a quote.
        </SectionHead>
        <div className="reveal mb-10">
          <ModeToggle mode={mode} setMode={setMode} />
        </div>
        {error && <p className="text-muted">We couldn't load products right now. Please make sure the API is running and refresh.</p>}
        {q && (
          <p className="mb-6 flex flex-wrap items-center gap-3 text-[14px] text-muted">
            {shown.length ? `${shown.length} result${shown.length === 1 ? '' : 's'} for` : 'No products match'} <b className="text-ink">"{params.get('q')}"</b>
            <button onClick={() => setParams({})} className="link-u text-grass">Clear search</button>
          </p>
        )}
        <div className="grid gap-5 md:grid-cols-3">
          {shown.map((p, i) => (
            <ProductCard key={p.id} index={i} product={p} mode={mode} />
          ))}
        </div>
      </div>
    </section>
  )
}
