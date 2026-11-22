import { Words, CountUp } from './Motion'
import { useSite } from '../site'

function Eyebrow({ n, children, dark }) {
  return (
    <p className={`eyebrow ${dark ? 'text-gold' : ''}`}>
      <span>{n}</span>
      <span className={`draw h-px w-14 ${dark ? 'bg-gold/70' : 'bg-scarlet/60'}`} style={{ '--d': '.15s' }} />
      <span>{children}</span>
    </p>
  )
}

// Full-bleed background photo for a section, with an overlay for text contrast.
function Backdrop({ src, overlay, position = 'center', className = '' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <img src={src} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} style={{ objectPosition: position }} />
      <div className={`absolute inset-0 ${overlay}`} />
    </div>
  )
}

export { Backdrop }

export function SectionHead({ n, label, title, children, dark = false }) {
  return (
    <div className="reveal mb-14 grid gap-8 md:mb-20 md:grid-cols-[1.2fr_1fr] md:items-end">
      <div>
        <Eyebrow n={n} dark={dark}>{label}</Eyebrow>
        <h2 className={`mt-5 font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[50px] [&_em]:not-italic [&_em]:text-ruby ${dark ? 'text-white' : 'text-ink'}`}><Words>{title}</Words></h2>
      </div>
      {children && <p style={{ transitionDelay: '.25s' }} className={`max-w-[28em] text-[16px] font-light leading-relaxed ${dark ? 'text-white/75' : 'text-muted'}`}>{children}</p>}
    </div>
  )
}

export function Origin() {
  return (
    <section id="origin" className="relative px-5 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2 md:gap-20">
        <div data-reveal="clip" className="reveal sheen relative aspect-[4/5] overflow-hidden rounded-sm">
          <img src="/hero.png" alt="" className="absolute inset-0 h-full w-full scale-[1.6] object-cover object-[88%_55%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep/75 to-transparent" />
          <p className="absolute bottom-6 left-6 text-[10px] tracking-[0.28em] text-white/85">DELTA · EDO · IMO · AKWA IBOM · CROSS RIVER</p>
        </div>
        <div className="reveal" style={{ '--d': '.2s' }}>
          <Eyebrow n="02">The Origin</Eyebrow>
          <h2 className="mt-6 font-serif text-[46px] leading-[0.95] tracking-[-0.03em] md:text-[72px]">
            <Words>Where the palm <em>began.</em></Words>
          </h2>
          <div className="mt-8 space-y-5 text-[16px] font-light leading-relaxed text-muted">
            <p>
              The oil palm is native to West Africa, and Nigeria has grown it for generations. Today it is still one of the
              largest palm oil producers in the world.
            </p>
            <p>
              We work directly with family growers and small mills across five states in the south. They harvest when the
              fruit is ripe and press it within days, which gives the oil its deep colour and clean taste.
            </p>
          </div>
          <dl className="mt-12 grid grid-cols-3 border-t border-ink/10 pt-8">
            {[
              ['5', 'States we source from'],
              ['48h', 'From harvest to press'],
              ['100%', 'Traceable lots'],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="font-serif text-4xl md:text-5xl"><CountUp value={v} /></dt>
                <dd className="mt-2 pr-4 text-[12px] leading-snug text-faint">{k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function Delivery() {
  const { contact } = useSite()
  const hub = contact.hub || contact.city || 'Lagos'
  const cards = [
    {
      kicker: 'Within Nigeria',
      title: 'Local delivery',
      body: 'Order bottles, jerrycans or drums and pay in naira. We deliver to homes, shops and restaurants in every state.',
      points: ['Pay in NGN', `${hub} in 1–3 days`, 'Other states in 3–7 days'],
    },
    {
      kicker: 'Rest of the world',
      title: 'International shipping',
      body: `Small parcels by air freight, or containers by sea from ${hub}. We prepare the export papers for you.`,
      points: ['Pay in USD', `FOB ${hub} or CIF to your port`, 'Air parcels or sea freight'],
    },
  ]
  return (
    <section id="delivery" className="relative overflow-hidden bg-deep px-5 py-28 md:px-12 md:py-40">
      <Backdrop src="/bg/export.jpg" position="70% center" overlay="bg-gradient-to-r from-deep/95 via-deep/80 to-deep/55" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHead dark n="04" label="Local & Global" title={<>From {hub} to <em>everywhere.</em></>}>
          Whether you are cooking for your family in Abuja or stocking a shop in London, Houston or Dubai, you buy the
          same oil from the same farms.
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2">
          {cards.map((c, i) => (
            <article key={c.title} style={{ '--d': `${i * 0.15}s` }} className="reveal sheen lift group overflow-hidden border border-white/10 bg-paper/95 p-8 backdrop-blur transition-colors duration-500 hover:border-scarlet/40 md:p-12">
              <p className="text-[11px] tracking-[0.24em] uppercase text-scarlet">{c.kicker}</p>
              <h3 className="mt-5 font-serif text-4xl md:text-5xl">{c.title}</h3>
              <p className="mt-5 max-w-[30em] font-light leading-relaxed text-muted">{c.body}</p>
              <ul className="mt-10 border-t border-ink/10">
                {c.points.map(p => (
                  <li key={p} className="flex items-center gap-4 border-b border-ink/10 py-4 text-[14px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-scarlet" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Quality() {
  const specs = [
    ['Free fatty acid (FFA)', 'Tested on every lot'],
    ['Moisture & impurities', 'Tested on every lot'],
    ['Colour & carotene', 'Checked for red palm oil'],
    ['Independent inspection', 'Available on request (e.g. SGS)'],
  ]
  return (
    <section id="quality" className="relative overflow-hidden bg-deep px-5 py-28 text-white md:px-12 md:py-40">
      <Backdrop src="/bg/oil-pour.jpg" position="75% center" overlay="bg-gradient-to-r from-deep/95 via-deep/75 to-deep/30" />
      <div className="relative mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:gap-20">
        <div className="reveal">
          <Eyebrow n="05" dark>Quality</Eyebrow>
          <h2 className="mt-6 font-serif text-[46px] leading-[0.95] tracking-[-0.03em] md:text-[72px]">
            <Words>Nothing added. <em>Nothing hidden.</em></Words>
          </h2>
          <p className="mt-8 max-w-[28em] font-light leading-relaxed text-white/75">
            Our oil is never dyed or mixed with other oils. We test each lot before it is packed, and you can ask for the
            lab results with any order.
          </p>
        </div>
        <ul className="self-end border-t border-white/20 bg-deep/40 backdrop-blur-sm">
          {specs.map(([k, v], i) => (
            <li key={k} data-reveal="right" style={{ '--d': `${i * 0.12}s` }} className="reveal flex flex-wrap items-baseline justify-between gap-2 border-b border-white/15 px-1 py-6">
              <span className="font-serif text-2xl">{k}</span>
              <span className="text-[13px] text-white/60">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Process() {
  const steps = [
    ['Choose your oil', 'Pick a product and pack size, then say whether you are buying in Nigeria or abroad.'],
    ['Place your order', 'Send your order with your delivery details. Bulk orders get a custom quote.'],
    ['Confirm & pay', 'We confirm stock, delivery cost and timing, then send secure payment details.'],
    ['Delivered', 'Your oil is packed and sent to your door, or loaded and shipped to your port.'],
  ]
  return (
    <section id="process" className="relative overflow-hidden bg-mist px-5 py-28 md:px-12 md:py-40">
      <Backdrop src="/bg/fronds.jpg" className="dark:opacity-20" overlay="bg-mist/40" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHead n="06" label="How It Works" title={<>Four steps to <em>your table.</em></>} />
        <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
          {steps.map(([t, b], i) => (
            <li key={t} className="reveal relative pt-6" style={{ '--d': `${i * 0.14}s` }}>
              <span className="draw absolute inset-x-0 top-0 h-px bg-ink/30" />
              <span className="font-serif text-lg italic text-scarlet">0{i + 1}</span>
              <h3 className="mt-8 font-serif text-3xl">{t}</h3>
              <p className="mt-3 text-[15px] font-light leading-relaxed text-muted">{b}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Range() {
  return (
    <section aria-label="The Farmora range" className="px-5 pb-28 md:px-12 md:pb-40">
      <div data-reveal="clip" className="reveal sheen relative mx-auto max-w-6xl overflow-hidden rounded-sm bg-mist">
        <img
          src="/products/range.jpg"
          alt="The Farmora range: red palm oil in 25 litre, 5 litre, 1 litre and 500 ml packs, and palm kernel oil"
          loading="lazy"
          className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
        />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-paper/85 via-paper/40 to-transparent px-6 pb-20 pt-7 md:px-10 md:pt-10">
          <p className="text-[11px] tracking-[0.28em] uppercase text-scarlet">The Farmora range</p>
          <h3 className="mt-3 max-w-[18em] font-serif text-3xl leading-tight text-ink md:text-5xl">
            Packed for kitchens, shops <em>and factories.</em>
          </h3>
        </div>
      </div>
    </section>
  )
}
