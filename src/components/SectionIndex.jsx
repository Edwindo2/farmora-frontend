import { useEffect, useState } from 'react'
import { SECTIONS } from '../lib'

// The fixed 01–07 index on the right edge, highlighting the section in view.
export default function SectionIndex() {
  const [active, setActive] = useState(SECTIONS[0].id)

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  const dark = active === 'harvest' // over the hero photo, use white
  return (
    <nav className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block" aria-label="Sections">
      <ul className="relative flex flex-col gap-3.5 pr-5">
        <span className={`absolute right-0 top-[-6px] bottom-[-6px] w-px ${dark ? 'bg-white/25' : 'bg-ink/15'}`} />
        {SECTIONS.map((s, i) => {
          const on = s.id === active
          return (
            <li key={s.id} className="relative">
              <a href={`#${s.id}`} className="group flex items-center justify-end gap-3 text-[10px] tracking-[0.2em]">
                <span
                  className={`uppercase transition-all duration-500 ${
                    on ? `${dark ? 'text-white' : 'text-ink'} opacity-100` : `translate-x-2 ${dark ? 'text-white' : 'text-muted'} opacity-0 group-hover:translate-x-0 group-hover:opacity-70`
                  }`}
                >
                  {s.label}
                </span>
                <span className={on ? (dark ? 'text-gold' : 'text-scarlet') : dark ? 'text-white/60' : 'text-muted/60'}>{String(i + 1).padStart(2, '0')}</span>
              </a>
              {on && <span className={`absolute right-[-21px] top-1/2 h-4 w-px -translate-y-1/2 ${dark ? 'bg-gold' : 'bg-scarlet'}`} />}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
