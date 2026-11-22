import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

// Autoplaying story: the hero plays the palm fruit's journey to bottled oil by itself, then loops.
const FRAMES = [
  {
    src: '/journey/1-bunch.jpg',
    step: 'The fruit',
    eyebrow: 'From nature to the world',
    title: <>Red gold,<br />grown <em className="text-[#f08a5d]">slowly.</em></>,
    body: 'In the palm belts of southern Nigeria, every bunch ripens in its own time.',
    pos: '70% center',
  },
  {
    src: '/journey/2-fruit.jpg',
    step: 'The harvest',
    eyebrow: 'Hand picked',
    title: <>Cut at its<br /><em className="text-[#f08a5d]">ripest.</em></>,
    body: 'Growers harvest each bunch when the fruit turns deep red and the flesh is full of oil.',
    pos: '75% center',
  },
  {
    src: '/journey/3-press.jpg',
    step: 'The press',
    eyebrow: 'Within days',
    title: <>Pressed<br /><em className="text-[#f08a5d]">fresh.</em></>,
    body: 'The fruit is pressed soon after picking, so the oil keeps its rich colour and clean taste.',
    pos: '75% center',
  },
  {
    src: '/journey/4-oil.jpg',
    step: 'The oil',
    eyebrow: 'Nothing added',
    title: <>Pure, deep<br /><em className="text-[#f08a5d]">red oil.</em></>,
    body: 'Never dyed, never blended. Every lot is tested before it is packed.',
    pos: '65% center',
  },
  {
    src: '/journey/5-bottle.jpg',
    step: 'Farmora',
    eyebrow: 'Ready for your table',
    title: <>Bottled for<br />the <em className="text-[#f08a5d]">world.</em></>,
    body: 'Delivered to your door in Nigeria, or shipped to your port anywhere in the world.',
    pos: '72% center',
  },
]

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = t => t * t * (3 - 2 * t)

const HOLD = 4200 // ms each frame stays on screen
const FADE = 1400 // ms crossfade between frames
const PERIOD = HOLD + FADE

export default function Hero() {
  const section = useRef(null)
  const imgs = useRef([])
  const caps = useRef([])
  const steps = useRef([])
  const bar = useRef(null)
  const cue = useRef(null)
  const ctas = useRef(null)
  const clock = useRef({ start: 0, pausedAt: null })
  const [paused, setPaused] = useState(false)

  // jump to a frame when its step is clicked
  const goTo = i => {
    const now = performance.now()
    clock.current.start = now - i * PERIOD
    if (clock.current.pausedAt != null) clock.current.pausedAt = now
  }
  const togglePause = () => {
    const c = clock.current, now = performance.now()
    if (c.pausedAt == null) { c.pausedAt = now; setPaused(true) }
    else { c.start += now - c.pausedAt; c.pausedAt = null; setPaused(false) }
  }

  useEffect(() => {
    const n = FRAMES.length
    let raf
    clock.current.start = performance.now()

    // The story plays by itself: hold each frame, then crossfade to the next, looping back to the start.
    const tick = () => {
      const c = clock.current
      const now = c.pausedAt ?? performance.now()
      const t = (now - c.start) % (n * PERIOD)
      const i = Math.floor(t / PERIOD)
      const local = t - i * PERIOD
      const s = i + smooth(clamp((local - HOLD) / FADE)) // 0 → n, where n means "wrapping back to frame 1"
      const wrap = clamp(s - (n - 1)) // 0..1 while the last frame hands back to the first

      imgs.current.forEach((img, k) => {
        if (!img) return
        let o = k === 0 ? 1 : clamp(s - (k - 1))
        if (k > 0) o *= 1 - wrap // fade everything above frame 1 away when looping
        // slow push-in across the time each frame is visible
        const since = k === 0 && s >= n - 1 ? s - n : s - k
        img.style.opacity = o
        img.style.transform = `scale(${1.04 + 0.08 * clamp((since + 1) / 2)})`
      })
      caps.current.forEach((cap, k) => {
        if (!cap) return
        let d = s - k
        if (k === 0 && s > n - 1) d = s - n // first caption returns from below on loop
        cap.style.opacity = clamp(1 - Math.abs(d) * 2.4)
        cap.style.transform = `translateY(${-d * 40}px)`
        cap.style.pointerEvents = Math.abs(d) < 0.3 ? 'auto' : 'none'
      })
      const active = Math.round(s) % n
      steps.current.forEach((st, k) => st && st.classList.toggle('is-on', k <= active))
      if (bar.current) bar.current.style.transform = `scaleX(${clamp(t / (n * PERIOD))})`
      if (ctas.current) ctas.current.style.opacity = clamp(1 - Math.abs(s - (n - 1)) * 2.4)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section id="harvest" ref={section} className="relative bg-deep">
      <div className="relative h-svh min-h-[620px] overflow-hidden">
        {FRAMES.map((f, i) => (
          <img
            key={f.src}
            ref={el => (imgs.current[i] = el)}
            src={f.src}
            alt={i === 0 ? 'The journey of Farmora palm oil, from fresh palm fruit to bottled red palm oil' : ''}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            className={`absolute inset-0 h-full w-full object-cover will-change-transform ${i === 0 ? 'hero-img' : ''}`}
            style={{ objectPosition: f.pos, opacity: i === 0 ? 1 : 0 }}
          />
        ))}

        {/* deep-green wash so the text always reads, plus floating warm light */}
        <div className="absolute inset-0 bg-gradient-to-r from-deep/90 via-deep/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-transparent to-deep/40" />
        <div className="absolute inset-0 bg-deep/45 md:hidden" />
        <div className="embers pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}
        </div>

        <div className="relative flex h-full flex-col justify-center px-5 pt-16 md:px-12">
          <div className="relative h-[360px] max-w-[600px] md:h-[400px]">
            {FRAMES.map((f, i) => (
              <div key={f.step} ref={el => (caps.current[i] = el)} className="absolute inset-x-0 top-0" style={{ opacity: i === 0 ? 1 : 0 }}>
                <p className={`flex items-center gap-4 text-[11px] tracking-[0.28em] uppercase text-gold ${i === 0 ? 'fade-up' : ''}`} style={{ animationDelay: '.3s' }}>
                  <span>0{i + 1}</span>
                  <span className="h-px w-14 bg-gold/70" />
                  <span>{f.eyebrow}</span>
                </p>
                <h1
                  className={`mt-7 font-serif text-[60px] leading-[0.92] tracking-[-0.035em] text-white sm:text-[84px] md:text-[104px] ${i === 0 ? 'fade-up' : ''}`}
                  style={{ animationDelay: '.45s' }}
                  aria-hidden={i !== 0}
                >
                  {f.title}
                </h1>
                <p className={`mt-7 max-w-[25em] text-[16px] font-light leading-relaxed text-white/80 md:text-[17px] ${i === 0 ? 'fade-up' : ''}`} style={{ animationDelay: '.65s' }}>
                  {f.body}
                </p>
                {i === 0 && (
                  <div className="fade-up mt-9 flex flex-wrap gap-3" style={{ animationDelay: '.8s' }}>
                    <Link to="/shop" className="btn-micro rounded-full bg-scarlet px-7 py-3.5 text-[13px] font-medium text-white hover:bg-[#a52d14]">Shop palm oil</Link>
                    <a href="#delivery" className="btn-micro rounded-full border border-white/40 px-7 py-3.5 text-[13px] text-white hover:border-white hover:bg-white/10">Where we deliver</a>
                  </div>
                )}
                {i === FRAMES.length - 1 && (
                  <div ref={ctas} className="mt-9 flex flex-wrap gap-3">
                    <Link to="/shop" className="btn-micro rounded-full bg-scarlet px-7 py-3.5 text-[13px] font-medium text-white hover:bg-[#a52d14]">Shop Farmora oil</Link>
                    <Link to="/shop#order" className="btn-micro rounded-full border border-white/40 px-7 py-3.5 text-[13px] text-white hover:border-white hover:bg-white/10">Place an order</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* journey progress: fruit → harvest → press → oil → Farmora */}
        <div className="absolute inset-x-5 bottom-7 md:inset-x-12 md:bottom-9">
          <div className="relative h-px bg-white/20">
            <div ref={bar} className="absolute inset-0 origin-left bg-gold" style={{ transform: 'scaleX(0)' }} />
          </div>
          <ol className="mt-4 grid grid-cols-5 text-[9.5px] tracking-[0.18em] uppercase md:text-[10.5px]">
            {FRAMES.map((f, i) => (
              <li
                key={f.step}
                ref={el => (steps.current[i] = el)}
                className={`journey-step text-white/40 transition-colors duration-500 ${i === 0 ? 'is-on' : ''} ${
                  i === 0 ? 'text-left' : i === FRAMES.length - 1 ? 'text-right' : 'text-center'
                }`}
              >
                <button onClick={() => goTo(i)} className="uppercase tracking-[inherit] transition-colors hover:text-white" aria-label={`Show step ${i + 1}: ${f.step}`}>
                  <span className="hidden sm:inline">0{i + 1} · </span>{f.step}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <button
          ref={cue}
          onClick={togglePause}
          className="btn-micro absolute bottom-24 right-5 grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white/80 backdrop-blur hover:border-white hover:text-white md:right-12"
          aria-label={paused ? 'Play the story' : 'Pause the story'}
        >
          {paused ? <Play className="h-4 w-4" fill="currentColor" /> : <Pause className="h-4 w-4" fill="currentColor" />}
        </button>
      </div>
    </section>
  )
}
