import { Children, isValidElement, cloneElement, useEffect, useRef, useState } from 'react'

// Splits a heading into words that each rise out of a mask (see .words in index.css).
// Plain strings are split per word; elements like <em> or <br/> are kept whole.
export function Words({ children }) {
  let wi = 0
  const wrap = node => {
    if (typeof node === 'string') {
      return node.split(/(\s+)/).map((part, k) =>
        /^\s+$/.test(part) || part === ''
          ? part
          : <span key={`w${wi}-${k}`} className="w"><span style={{ '--wi': wi++ }}>{part}</span></span>,
      )
    }
    if (isValidElement(node)) {
      if (node.type === 'br') return node
      if (node.type === 'em' || node.type === 'span') {
        // split the inside of <em> too, keeping its styling on each word
        const inner = Children.map(node.props.children, c =>
          typeof c === 'string'
            ? c.split(/(\s+)/).map((part, k) =>
                /^\s+$/.test(part) || part === ''
                  ? part
                  : <span key={`e${wi}-${k}`} className="w"><span style={{ '--wi': wi++ }}>{part}</span></span>,
              )
            : c,
        )
        return cloneElement(node, {}, inner)
      }
    }
    return node
  }
  return <span className="words">{Children.map(children, wrap)}</span>
}

// Counts a number up from 0 when it scrolls into view. Keeps any suffix, e.g. "48h" or "100%".
export function CountUp({ value, duration = 1600 }) {
  const ref = useRef(null)
  const match = String(value).match(/^(\d+)(.*)$/)
  const [shown, setShown] = useState(match ? `0${match[2]}` : value)

  useEffect(() => {
    if (!match) return
    const end = Number(match[1]), suffix = match[2]
    const el = ref.current
    let raf
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = now => {
        const t = Math.min(1, (now - t0) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setShown(`${Math.round(end * eased)}${suffix}`)
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span ref={ref} className="tabular-nums">{shown}</span>
}

// Thin gold line at the top of the page showing how far you've scrolled.
export function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    let raf
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div ref={ref} className="scroll-progress" aria-hidden="true" />
}
