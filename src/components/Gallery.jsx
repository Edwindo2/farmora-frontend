import { useEffect, useRef, useState } from 'react'

// Six-card gallery: cards fly in from their own sides as you scroll and land in a 3×2 grid
// (2×3 on narrow screens). Placeholder images for now: swap `src` and `title` when the final set is chosen.
export const GALLERY = [
  { src: '/journey/1-bunch.jpg', title: 'Fresh fruit bunch' },
  { src: '/journey/2-fruit.jpg', title: 'Ripe palm fruit' },
  { src: '/journey/3-press.jpg', title: 'Pressed fresh' },
  { src: '/journey/4-oil.jpg', title: 'Pure red oil' },
  { src: '/journey/5-bottle.jpg', title: 'Farmora red palm oil' },
  { src: '/products/range.jpg', title: 'The Farmora range' },
]

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const out = t => 1 - (1 - t) ** 3
const ease = t => t * t * (3 - 2 * t)

export default function Gallery() {
  const section = useRef(null)
  const cards = useRef([])
  const rule = useRef(null)
  const head = useRef(null)
  const [hover, setHover] = useState(null)
  const pill = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    let p = 0, raf
    const tick = () => {
      const el = section.current
      if (el) {
        const r = el.getBoundingClientRect()
        // start as soon as the section enters the screen, so the cards are already flying in while it scrolls up
        const target = clamp((window.innerHeight - r.top) / r.height)
        p += (target - p) * 0.09
        if (Math.abs(target - p) < 0.0005) p = target

        const narrow = window.innerWidth / window.innerHeight < 0.9
        const cols = narrow ? 2 : 3, rows = narrow ? 3 : 2
        cards.current.forEach((c, i) => {
          if (!c) return
          const col = i % cols, row = Math.floor(i / cols)
          // each card starts a little after the previous one and takes ~45% of the scroll to land
          const st = 0.04 + i * 0.055
          const q = out(clamp((p - st) / 0.38))
          const side = col - (cols - 1) / 2 // -1, 0, 1
          const dy = row < rows / 2 ? -1 : 1 // top row from above, bottom from below
          const ox = side * 1.2 * 62 * (1 - q) // vw
          const oy = dy * (side === 0 ? 95 : 34) * (1 - q) // vh
          const tilt = (1 - q) * 12.6 * (side || 0.5) * dy // degrees
          c.style.transform = `translate3d(${ox}vw, ${oy}vh, 0) rotate(${tilt}deg) scale(${0.9 + 0.1 * q})`
          c.style.opacity = clamp(q * 1.6)
        })
        if (rule.current) rule.current.style.transform = `scaleX(${ease(clamp((p - 0.62) / 0.18))})`
        if (head.current) head.current.style.opacity = clamp((p - 0.05) / 0.2)
        done.current = p > 0.68
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  const move = e => {
    if (pill.current) pill.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 16}px)`
  }

  return (
    <section ref={section} aria-label="Gallery" className="relative h-[220vh] bg-paper">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden" onPointerMove={move}>
        <div ref={head} className="mb-8 px-5 text-center md:mb-10" style={{ opacity: 0 }}>
          <p className="text-[11px] tracking-[0.28em] uppercase text-scarlet">Gallery</p>
          <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] md:text-5xl">From the <em>farm.</em></h2>
        </div>

        <div className="relative w-[88vw] sm:w-[74vw] sm:max-w-[1180px]">
          <div className="grid grid-cols-2 gap-x-[1.7%] gap-y-[2.8%] sm:grid-cols-3">
            {GALLERY.map((g, i) => (
              <figure
                key={g.src + i}
                ref={el => (cards.current[i] = el)}
                onPointerEnter={() => done.current && setHover(g.title)}
                onPointerLeave={() => setHover(null)}
                className="group relative aspect-[2.1/1.32] overflow-hidden rounded-[4px] bg-mist shadow-[0_20px_40px_-24px_rgba(12,36,16,.45)] will-change-transform"
                style={{ opacity: 0 }}
              >
                <img src={g.src} alt={g.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <span className="absolute inset-0 rounded-[4px] ring-1 ring-inset ring-white/10" />
              </figure>
            ))}
          </div>
          {/* hairline between the rows (desktop layout) */}
          <div ref={rule} className="absolute left-[-3vw] right-[-3vw] top-1/2 hidden h-px origin-left bg-ink/15 sm:block" style={{ transform: 'scaleX(0)' }} />
        </div>

        <div
          ref={pill}
          className={`pointer-events-none fixed left-0 top-0 z-50 whitespace-nowrap rounded-full bg-grass px-3 py-1.5 text-[11.5px] font-semibold tracking-[0.04em] text-white transition-opacity duration-150 ${
            hover ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {hover}
        </div>
      </div>
    </section>
  )
}
