import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, Minus, Plus, Truck, Ship, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react'
import { Shell } from './Account'
import { useCart } from '../cart'
import { ModeToggle, TierPrice } from '../components/Shop'
import { packImage } from '../components/Home'
import { WishButton } from '../wishlist'
import { quoteHref } from '../lib'

// Product page: photo, pack sizes, quantity, a bulk quote button and related products.
export default function Product() {
  const { slug } = useParams()
  const { products, mode, setMode } = useCart()
  const [product, setProduct] = useState(undefined)
  const [sizeId, setSizeId] = useState(null)
  const [qty, setQtyLocal] = useState(5) // minimum order is 5 of any pack size

  useEffect(() => {
    setProduct(undefined)
    fetch(`/api/products/${encodeURIComponent(slug)}`).then(r => (r.ok ? r.json() : null)).then(p => {
      setProduct(p)
      if (p) {
        setSizeId(p.sizes[0]?.id || null)
        document.title = `${p.name} · Farmora`
      }
    }).catch(() => setProduct(null))
    window.scrollTo(0, 0)
    return () => { document.title = 'Farmora — Palm Oil from Nigeria, Delivered Anywhere' }
  }, [slug])

  if (product === undefined) return <Shell><div className="grid place-items-center py-32 text-muted"><Loader2 className="h-6 w-6 animate-spin" /></div></Shell>
  if (product === null) return (
    <Shell>
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-[28px] font-bold text-ink">Product not found</h1>
        <p className="mt-2 text-muted">It may have been removed or renamed.</p>
        <Link to="/shop" className="btn-micro mt-6 inline-flex rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white">Back to products</Link>
      </div>
    </Shell>
  )

  const size = product.sizes.find(s => s.id === sizeId) || product.sizes[0]
  const quote = quoteHref({ type: mode === 'international' ? 'export' : 'wholesale', product: product.name, size: size?.label, qty: `${qty} × ${size?.label || 'pack'}` })

  const related = products.filter(p => p.id !== product.id && p.sizes.length).slice(0, 3)

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-grass">Home</Link><ChevronRight className="h-3.5 w-3.5" />
          <Link to="/shop" className="hover:text-grass">Products</Link><ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-3">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl border border-ink/10 bg-white">
              <img key={size?.id} src={size ? packImage(product, size) : product.image} alt={`${product.name}${size ? `, ${size.label}` : ''}`} className="h-full w-full object-contain p-6" style={{ animation: 'heroIn .4s both' }} />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.sizes.map(s => (
                <button key={s.id} onClick={() => setSizeId(s.id)} aria-label={s.label}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${s.id === size?.id ? 'border-grass' : 'border-ink/10 hover:border-ink/30'}`}>
                  <img src={packImage(product, s)} alt="" className="h-full w-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-grass">{product.tag}</p>
            <h1 className="mt-2 font-display text-[32px] font-extrabold leading-tight text-ink md:text-[40px]">{product.name}</h1>
            <TierPrice size={size} className="mt-4 font-display text-[22px] font-bold text-ruby" />
            <p className="mt-1 text-[13.5px] text-muted">We supply in bulk only, with a minimum order of 5 of any pack size. Choose a pack size and quantity, and we'll reply with prices, availability and delivery within one business day.</p>

            <div className="mt-6"><ModeToggle mode={mode} setMode={setMode} /></div>

            <div className="mt-7">
              <p className="text-[13px] font-semibold text-ink">Pack size: <span className="font-normal text-muted">{size?.label}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s.id} onClick={() => setSizeId(s.id)} disabled={!s.inStock}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left text-[13.5px] transition disabled:cursor-not-allowed disabled:opacity-40 ${s.id === size?.id ? 'border-grass bg-grass/10 text-ink' : 'border-ink/15 text-muted hover:border-ink/40'}`}>
                    <span className="block font-semibold text-ink">{s.label}</span>
                    {!s.inStock && <span className="block text-[12px]">Out of stock</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-ink/15 bg-paper">
                <button onClick={() => setQtyLocal(q => Math.max(5, q - 5))} className="grid h-12 w-12 place-items-center text-muted hover:text-ink" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <input value={qty} onChange={e => setQtyLocal(Math.max(5, Math.min(100000, parseInt(e.target.value, 10) || 5)))} inputMode="numeric" aria-label="Quantity" className="w-16 bg-transparent text-center text-[16px] font-semibold text-ink outline-none" />
                <button onClick={() => setQtyLocal(q => Math.min(100000, q + 5))} className="grid h-12 w-12 place-items-center text-muted hover:text-ink" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
              <Link to={quote} className="btn-micro flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-grass px-6 text-[15px] font-semibold text-white hover:bg-grass-deep sm:flex-none">
                <FileText className="h-5 w-5" /> Request Bulk Quote
              </Link>
              <WishButton productId={product.id} className="h-12 w-12 rounded-full border border-ink/15 text-ink hover:border-ruby hover:text-ruby" />
            </div>

            <ul className="mt-8 grid gap-3 rounded-2xl border border-ink/10 bg-mist p-5 text-[14px] text-ink sm:grid-cols-3">
              <li className="flex items-start gap-2.5"><Truck className="mt-0.5 h-5 w-5 shrink-0 text-grass" />Delivery across Nigeria</li>
              <li className="flex items-start gap-2.5"><Ship className="mt-0.5 h-5 w-5 shrink-0 text-grass" />Export by air or sea</li>
              <li className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-grass" />Bulk &amp; distributor pricing</li>
            </ul>

            <div className="mt-8">
              <h2 className="font-display text-[18px] font-bold text-ink">About this product</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{product.description}</p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-[22px] font-bold text-ink">You may also like</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="lift group flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper p-4 hover:border-grass/40">
                  <img src={packImage(p, p.sizes[0])} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-white object-contain p-1" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-bold text-ink group-hover:text-grass">{p.name}</p>
                    <p className="text-[12.5px] text-muted">{p.tag}</p>
                    <p className="mt-1 text-[13px] font-semibold text-grass">Bulk price on request</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  )
}
