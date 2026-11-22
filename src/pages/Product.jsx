import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ShoppingCart, Zap, Minus, Plus, Check, Truck, Ship, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react'
import { Shell } from './Account'
import { useCart } from '../cart'
import { ModeToggle, WholesaleNote } from '../components/Shop'
import { packImage } from '../components/Home'
import { WishButton } from '../wishlist'
import { money, priceOf, currencyOf } from '../lib'

// Product page: photo, pack sizes, quantity, add to cart / buy now, and related products.
export default function Product() {
  const { price: fmtPrice } = useCart()
  const { slug } = useParams()
  const nav = useNavigate()
  const { products, mode, setMode, add, setQty, cart, openDrawer, converted } = useCart()
  const [product, setProduct] = useState(undefined)
  const [sizeId, setSizeId] = useState(null)
  const [qty, setQtyLocal] = useState(1)
  const [added, setAdded] = useState(false)

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
        <Link to="/shop" className="btn-micro mt-6 inline-flex rounded-full bg-grass px-6 py-3 text-[14px] font-semibold text-white">Back to the shop</Link>
      </div>
    </Shell>
  )

  const size = product.sizes.find(s => s.id === sizeId) || product.sizes[0]
  const price = size ? priceOf(size, mode) : null
  const cur = currencyOf(mode)

  function addToCart(goCheckout) {
    if (!size) return
    const key = `${product.id}:${size.id}`
    const line = cart.find(l => l.key === key)
    if (line) setQty(key, line.qty + qty)
    else { add(product, size); if (qty > 1) setTimeout(() => setQty(key, qty), 0) }
    if (goCheckout) nav('/checkout')
    else { setAdded(true); setTimeout(() => setAdded(false), 1600); openDrawer() }
  }

  const related = products.filter(p => p.id !== product.id && p.sizes.length).slice(0, 3)

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-grass">Home</Link><ChevronRight className="h-3.5 w-3.5" />
          <Link to="/shop" className="hover:text-grass">Shop</Link><ChevronRight className="h-3.5 w-3.5" />
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
            <p className="mt-4 font-display text-[30px] font-bold text-ruby">{fmtPrice(price)}</p>
            <WholesaleNote size={size} mode={mode} />
            {price == null && <p className="text-[13px] text-muted">Add it to your order and we'll send you a price with your confirmation.</p>}
            {converted && price != null && <p className="mt-1 text-[12.5px] text-muted">Approximate. You'll be charged in US dollars ({money(price, 'USD')}).</p>}

            <div className="mt-6"><ModeToggle mode={mode} setMode={setMode} /></div>

            <div className="mt-7">
              <p className="text-[13px] font-semibold text-ink">Pack size: <span className="font-normal text-muted">{size?.label}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s.id} onClick={() => setSizeId(s.id)} disabled={!s.inStock}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left text-[13.5px] transition disabled:cursor-not-allowed disabled:opacity-40 ${s.id === size?.id ? 'border-grass bg-grass/10 text-ink' : 'border-ink/15 text-muted hover:border-ink/40'}`}>
                    <span className="block font-semibold text-ink">{s.label}</span>
                    <span className="block text-[12px]">{s.inStock ? fmtPrice(priceOf(s, mode)) : 'Out of stock'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-ink/15 bg-paper">
                <button onClick={() => setQtyLocal(q => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center text-muted hover:text-ink" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <input value={qty} onChange={e => setQtyLocal(Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 1)))} inputMode="numeric" aria-label="Quantity" className="w-12 bg-transparent text-center text-[16px] font-semibold text-ink outline-none" />
                <button onClick={() => setQtyLocal(q => Math.min(1000, q + 1))} className="grid h-12 w-12 place-items-center text-muted hover:text-ink" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={() => addToCart(false)} disabled={!size?.inStock} className="btn-micro flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-grass px-6 text-[15px] font-semibold text-white hover:bg-grass-deep disabled:opacity-50 sm:flex-none">
                {added ? <><Check className="h-5 w-5" /> Added to cart</> : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>}
              </button>
              <button onClick={() => addToCart(true)} disabled={!size?.inStock} className="btn-micro flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ruby px-6 text-[15px] font-semibold text-white hover:brightness-110 disabled:opacity-50 sm:flex-none">
                <Zap className="h-5 w-5" /> Buy Now
              </button>
              <WishButton productId={product.id} className="h-12 w-12 rounded-full border border-ink/15 text-ink hover:border-ruby hover:text-ruby" />
            </div>

            <ul className="mt-8 grid gap-3 rounded-2xl border border-ink/10 bg-mist p-5 text-[14px] text-ink sm:grid-cols-3">
              <li className="flex items-start gap-2.5"><Truck className="mt-0.5 h-5 w-5 shrink-0 text-grass" />Delivery across Nigeria</li>
              <li className="flex items-start gap-2.5"><Ship className="mt-0.5 h-5 w-5 shrink-0 text-grass" />Export by air or sea</li>
              <li className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-grass" />Pay after we confirm</li>
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
                    <p className="mt-1 text-[14px] font-semibold text-grass">From {fmtPrice(Math.min(...p.sizes.map(s => priceOf(s, mode) ?? Infinity)) === Infinity ? null : Math.min(...p.sizes.map(s => priceOf(s, mode) ?? Infinity)))}</p>
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
