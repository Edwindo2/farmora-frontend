import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowRight, Leaf, ShieldCheck, Globe2, Handshake, Headset, CheckCircle2, ChevronLeft, ChevronRight, Star, Check, ShoppingCart } from 'lucide-react'
import { useCart } from '../cart'
import { WishButton } from '../wishlist'
import { useSite } from '../site'
import { quoteHref, orderHref } from '../lib'
import { TierPrice } from './Shop'

// Home page sections, laid out like the Farmora guide design.

const QUOTE = quoteHref({ type: 'export' })
const BULK = quoteHref()
const DISTRIBUTOR = '/register?type=distributor' // sign-up with the Distributor section open

/* ---------- hero ---------- */
export function HomeHero() {
  return (
    <section id="home" className="relative overflow-hidden bg-mist">
      <img src="/home/hero.jpg" alt="Farmora palm oil bottles and jerrycans with fresh palm fruit in a palm plantation" className="absolute inset-0 h-full w-full object-cover object-[68%_bottom] md:object-[70%_center]" fetchPriority="high" />
      {/* soft light haze behind the text */}
      {/* phones: text on top, bottles below. larger screens: text on the left */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper from-35% via-paper/80 via-55% to-transparent to-75% md:bg-gradient-to-r md:from-paper md:from-0% md:via-paper/70 md:via-40% md:to-transparent md:to-70%" />
      <div className="relative mx-auto grid min-h-[560px] max-w-7xl items-start px-5 pb-[300px] pt-10 sm:pb-[340px] md:min-h-[600px] md:items-center md:py-14 lg:px-8">
        <div className="max-w-[560px]">
          <h1 className="reveal font-display text-[38px] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[50px] lg:text-[60px]">
            <span className="block text-ink">Reliable Palm Oil Supply.</span>
            <span className="block text-ruby">Built for Wholesale.</span>
          </h1>
          <p className="reveal mt-5 max-w-[30em] text-[16px] leading-relaxed text-ink/80 sm:text-[17px]" style={{ '--d': '.12s' }}>
            Farmora AgriTrade supplies quality Nigerian palm oil to wholesalers, distributors, retailers, food businesses and bulk buyers, in Nigeria and abroad.
          </p>
          <p className="reveal mt-4 text-[15px] font-semibold text-ink sm:text-[16px]" style={{ '--d': '.18s' }}>Bulk Supply <span className="mx-1.5 text-ruby">•</span> Reliable Sourcing <span className="mx-1.5 text-ruby">•</span> Nationwide &amp; Export Delivery</p>
          <div className="reveal mt-8 flex flex-wrap gap-3" style={{ '--d': '.26s' }}>
            <Link to={BULK} className="btn-micro inline-flex items-center gap-2.5 rounded-full bg-grass px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-grass/25 hover:bg-grass-deep">
              <FileText className="h-[18px] w-[18px]" /> Request Bulk Quote <ArrowRight className="arr h-4 w-4" />
            </Link>
            <Link to={DISTRIBUTOR} className="btn-micro inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper/80 px-6 py-3 text-[15px] font-semibold text-ink backdrop-blur hover:bg-ink hover:text-paper">
              Become a Distributor <ArrowRight className="arr h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 100% pure badge */}
      <div className="pointer-events-none absolute right-5 top-6 hidden md:block lg:right-10">
        <div className="reveal grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-[#f9d65c] via-[#e2a812] to-[#b37f06] p-1.5 shadow-xl lg:h-36 lg:w-36" data-reveal="scale">
          <div className="grid h-full w-full place-items-center rounded-full border-2 border-dashed border-white/60 bg-[#0f4d1c] text-center text-white">
            <span className="font-display leading-none">
              <span className="block text-[30px] font-extrabold lg:text-[34px]">100%</span>
              <span className="block text-[20px] font-extrabold tracking-wide lg:text-[22px]">PURE</span>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.12em]">&amp; NATURAL</span>
            </span>
          </div>
        </div>
      </div>

      {/* benefit list on a green curve */}
      <div className="absolute bottom-0 right-0 hidden lg:block">
        <div className="relative rounded-tl-[140px] bg-gradient-to-br from-[#2a9a3f] to-[#145a24] py-8 pl-24 pr-10 text-white shadow-2xl">
          <ul className="space-y-2.5">
            {['Bulk & Container Loads', 'Consistent Quality', 'Competitive Bulk Prices', 'Local & Export Supply'].map((t, i) => (
              <li key={t} className="reveal flex items-center gap-3 text-[15px] font-medium" style={{ '--d': `${0.3 + i * 0.08}s` }}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-sun text-[#145a24]"><Check className="h-4 w-4" strokeWidth={3} /></span>{t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- feature strip ---------- */
const FEATURES = [
  [Leaf, '100% Natural', '& Pure'],
  [ShieldCheck, 'Quality', 'Assured'],
  [Globe2, 'Global Supply', '& Delivery'],
  [Handshake, 'Trusted', 'Partner'],
  [Headset, 'Dedicated', 'Customer Support'],
]
export function FeatureStrip() {
  return (
    <section className="border-y border-ink/5 bg-cream">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-5 py-6 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-ink/15 lg:px-8">
        {FEATURES.map(([Icon, a, b], i) => (
          <li key={a} className="reveal flex items-center justify-center gap-3 px-3" style={{ '--d': `${i * 0.06}s` }}>
            <Icon className="h-9 w-9 shrink-0 text-grass" strokeWidth={1.6} />
            <span className="text-[14.5px] font-medium leading-tight text-ink">{a}<br />{b}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- products + why choose ---------- */
// Picture for a pack size, from its label: bottles, jerrycans or the product's own photo for drums/bulk.
// The API sends the right photo for each pack size (size.image); the rest is a fallback for older data.
export function packImage(product, size) {
  if (size?.image) return size.image
  // the bottle/jerrycan photos show red palm oil; other oils use their own photo from the admin
  if (product.id !== 'red-palm-oil' && product.image) return product.image
  const m = String(size.label).match(/([\d.]+)\s*(l|litre|liter)/i)
  const litres = m ? Number(m[1]) : null
  if (litres != null && litres <= 2) return '/home/pack-bottle.jpg'
  if (litres != null && litres <= 10) return '/home/pack-jerrycan.jpg'
  if (litres != null && litres <= 30) return '/home/pack-25l.jpg'
  return product.image || '/home/pack-25l.jpg'
}

function PackCard({ product, size, index }) {
  const { mode } = useCart()
  return (
    <article className="reveal lift group relative flex flex-col items-center rounded-2xl border border-ink/10 bg-paper p-4 text-center shadow-sm hover:shadow-lg" style={{ '--d': `${index * 0.08}s` }}>
      <WishButton productId={product.id} sizeId={size.id} className="absolute right-2.5 top-2.5 z-10 h-9 w-9 rounded-full bg-paper/90 text-ink shadow-sm hover:text-ruby" />
      <Link to={`/product/${product.id}`} className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-white" aria-label={`View ${product.name}, ${size.label}`}>
        <img src={packImage(product, size)} alt={`Farmora ${product.name}, ${size.label}`} loading="lazy" className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
      </Link>
      <h3 className="mt-3 font-display text-[17px] font-bold text-ink">{size.label.replace(/\blitres?\b/i, m => m[0].toUpperCase() + m.slice(1))}</h3>
      <p className="text-[12.5px] text-muted">{product.name}</p>
      <TierPrice size={size} className="mb-3 mt-1 text-[12.5px] font-medium text-grass" />
      <Link
        to={orderHref([{ product: product.id, size: size.id }])}
        className="btn-micro mt-auto inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-grass px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-grass-deep sm:px-5"
      >
        <ShoppingCart className="h-4 w-4" /> Order now
      </Link>
    </article>
  )
}

export function ProductsSection() {
  const { products, loadError } = useCart()
  const packs = products.flatMap(p => p.sizes.map(s => ({ product: p, size: s }))).slice(0, 4)
  return (
    <section id="products" className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1fr_350px]">
        <div>
          <h2 className="reveal mb-8 flex items-center gap-5 font-script text-[32px] font-semibold italic text-ink md:text-[40px]">
            <span className="h-px flex-1 bg-ink/40" /> Our Products <span className="h-px flex-1 bg-ink/40" />
          </h2>
          {loadError && <p className="text-muted">We couldn't load products right now. Please refresh in a moment.</p>}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {packs.map(({ product, size }, i) => <PackCard key={`${product.id}:${size.id}`} product={product} size={size} index={i} />)}
          </div>
          <div className="mt-6 text-center">
            <Link to="/shop" className="link-u inline-flex items-center gap-1.5 text-[14px] font-semibold text-grass">See all products and pack sizes <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <WhyChoose />
      </div>
    </section>
  )
}

function WhyChoose() {
  const points = ['Premium Quality Palm Oil', 'Competitive Bulk Prices', 'Reliable Supply Chain', 'Local & International Delivery', 'Trusted Brand – Farmora™']
  return (
    <aside id="why" className="reveal relative overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-[#f3f9ec] via-paper to-[#e5f2d8] p-7 dark:from-[#16241a] dark:via-paper dark:to-[#1b2f1f]" data-reveal="right">
      <img src="/journey/1-bunch.jpg" alt="" aria-hidden="true" className="absolute -bottom-6 -right-10 h-56 w-56 rounded-full object-cover opacity-90 [mask-image:radial-gradient(circle,black_55%,transparent_72%)]" />
      <div className="relative">
        <h2 className="font-display text-[24px] font-bold text-ink">Why Choose Farmora?</h2>
        <ul className="mt-5 space-y-3">
          {points.map(p => (
            <li key={p} className="flex items-center gap-3 text-[15px] text-ink"><CheckCircle2 className="h-5 w-5 shrink-0 fill-grass text-white dark:text-paper" />{p}</li>
          ))}
        </ul>
        <a href="#about" className="btn-micro mt-7 inline-flex items-center gap-2 rounded-full bg-ruby px-6 py-3 text-[14px] font-semibold text-white hover:brightness-110">Learn More <ArrowRight className="arr h-4 w-4" /></a>
      </div>
    </aside>
  )
}

/* ---------- local / international banners ---------- */
function Tick({ children }) {
  return <li className="flex items-center gap-2.5 text-[15px]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sun text-[#145a24]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{children}</li>
}

export function BuyerBanners() {
  const { setMode } = useCart()
  return (
    <section id="buyers" className="px-5 pb-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
        <article className="reveal relative min-h-[300px] overflow-hidden rounded-2xl bg-[#145a24] text-white shadow-lg" data-reveal="left">
          <img src="/home/local-buyer.jpg" alt="Smiling customer holding a bottle of Farmora palm oil in a shop" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#145a24] from-35% via-[#145a24]/75 via-55% to-transparent to-80%" />
          <div className="relative max-w-[310px] p-7 md:p-8">
            <h2 className="font-display text-[28px] font-bold leading-tight">For Local Buyers</h2>
            <p className="mt-2 text-[16px] text-white/90">Bulk palm oil for wholesalers, distributors, retailers and food businesses.</p>
            <ul className="mt-5 space-y-2"><Tick>Wholesale &amp; Bulk Prices</Tick><Tick>Fast Nationwide Delivery</Tick><Tick>Distributor Partnerships</Tick></ul>
            <Link to={BULK} onClick={() => setMode('local')} className="btn-micro mt-6 inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3 text-[14px] font-bold text-[#123d1a] hover:brightness-105">Request Bulk Quote <ArrowRight className="arr h-4 w-4" /></Link>
          </div>
        </article>
        <article className="reveal relative min-h-[300px] overflow-hidden rounded-2xl bg-[#0b4a94] text-white shadow-lg" data-reveal="right">
          <img src="/home/export-ship.jpg" alt="Container ship leaving port" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b4a94] from-35% via-[#0b4a94]/70 via-55% to-transparent to-80%" />
          <div className="relative max-w-[310px] p-7 md:p-8">
            <h2 className="font-display text-[28px] font-bold leading-tight">For International Buyers</h2>
            <p className="mt-2 text-[16px] text-white/90">Source premium palm oil from Nigeria.</p>
            <ul className="mt-5 space-y-2"><Tick>Request Export Quotation</Tick><Tick>Bulk Orders</Tick><Tick>Worldwide Shipping</Tick></ul>
            <Link to={QUOTE} onClick={() => setMode('international')} className="btn-micro mt-6 inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3 text-[14px] font-bold text-[#0b2f5e] hover:brightness-105">Request Export Quotation <ArrowRight className="arr h-4 w-4" /></Link>
          </div>
        </article>
      </div>
    </section>
  )
}

/* ---------- about, reviews, updates ---------- */
function Card({ title, children, className = '' }) {
  return (
    <div className={`reveal rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 font-display text-[19px] font-bold text-ink">{title}</h2>}
      {children}
    </div>
  )
}

function About() {
  const [more, setMore] = useState(false)
  return (
    <Card className="flex flex-col gap-5 sm:flex-row">
      <img src="/journey/1-bunch.jpg" alt="Fresh palm fruit bunch" loading="lazy" className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-auto sm:w-40" />
      <div>
        <h2 className="font-display text-[19px] font-bold text-ink">About Farmora</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Farmora AgriTrade Limited is a wholesale palm oil supplier, delivering pure, high-quality palm oil in bulk to businesses and markets across Nigeria and worldwide.
        </p>
        {more && (
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Our oil comes from the palm belt of southern Nigeria. Fresh fruit bunches are harvested at peak ripeness and pressed soon after, so the oil keeps its deep colour and clean taste. Every batch is checked before packing, then delivered across Nigeria or prepared for export with the right documents.
          </p>
        )}
        <button onClick={() => setMore(m => !m)} className="btn-micro mt-4 inline-flex items-center gap-2 rounded-full bg-grass px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-grass-deep">
          {more ? 'Read Less' : 'Read More'} <ArrowRight className={`h-4 w-4 transition-transform ${more ? '-rotate-90' : ''}`} />
        </button>
      </div>
    </Card>
  )
}

function Reviews({ reviews }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reviews.length < 2) return
    const t = setInterval(() => setI(n => (n + 1) % reviews.length), 7000)
    return () => clearInterval(t)
  }, [reviews.length])
  const r = reviews[i % reviews.length]
  const initials = r.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <Card title="What Our Customers Say">
      <div className="flex items-center gap-3">
        {reviews.length > 1 && <button onClick={() => setI(n => (n - 1 + reviews.length) % reviews.length)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/20 text-ink hover:border-grass hover:text-grass" aria-label="Previous review"><ChevronLeft className="h-4 w-4" /></button>}
        <figure key={r.id} className="flex flex-1 items-start gap-4" style={{ animation: 'heroIn .5s both' }}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-grass/15 font-display text-[18px] font-bold text-grass">{initials}</span>
          <div>
            <blockquote className="text-[14px] leading-relaxed text-ink">“{r.quote}”</blockquote>
            <div className="mt-2 flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? 'fill-sun text-sun' : 'text-ink/20'}`} />)}</div>
            <figcaption className="mt-1 text-[13px] font-medium text-ink">– {r.name}{r.place ? `, ${r.place}` : ''}</figcaption>
          </div>
        </figure>
        {reviews.length > 1 && <button onClick={() => setI(n => (n + 1) % reviews.length)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/20 text-ink hover:border-grass hover:text-grass" aria-label="Next review"><ChevronRight className="h-4 w-4" /></button>}
      </div>
    </Card>
  )
}

function Updates({ news }) {
  const n = news[0]
  const Wrap = n.link ? (n.link.startsWith('/') ? Link : 'a') : 'div'
  const wrapProps = n.link ? (n.link.startsWith('/') ? { to: n.link } : { href: n.link, target: '_blank', rel: 'noreferrer' }) : {}
  return (
    <Card title="Latest Updates">
      <Wrap {...wrapProps} className="group flex gap-4">
        {n.image && <img src={n.image} alt="" loading="lazy" className="h-28 w-28 shrink-0 rounded-xl object-cover" />}
        <div>
          <h3 className="font-display text-[15px] font-bold leading-snug text-ink group-hover:text-grass">{n.title}</h3>
          <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{n.summary}</p>
          {n.link && <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-ink group-hover:text-grass">Read More <ArrowRight className="h-3.5 w-3.5" /></span>}
        </div>
      </Wrap>
    </Card>
  )
}

export function InfoRow() {
  const { reviews = [], news = [] } = useSite()
  const cols = 1 + (reviews.length ? 1 : 0) + (news.length ? 1 : 0)
  return (
    <section id="about" className="px-5 pb-16 lg:px-8">
      <div className={`mx-auto grid max-w-7xl gap-5 ${cols === 3 ? 'lg:grid-cols-3' : cols === 2 ? 'lg:grid-cols-2' : ''}`}>
        <About />
        {reviews.length > 0 && <Reviews reviews={reviews} />}
        {news.length > 0 && <Updates news={news} />}
      </div>
    </section>
  )
}
