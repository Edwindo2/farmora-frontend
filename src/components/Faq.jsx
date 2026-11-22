import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSite } from '../site'

function Item({ q, a, open, onToggle, index }) {
  return (
    <div className="reveal border-b border-ink/12" style={{ '--d': `${index * 0.05}s` }}>
      <button onClick={onToggle} aria-expanded={open} className="group flex w-full items-center justify-between gap-6 py-6 text-left">
        <span className="font-display text-[16.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-grass md:text-[18px]">{q}</span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
            open ? 'rotate-45 border-scarlet bg-scarlet text-white' : 'border-ink/20 text-scarlet group-hover:border-scarlet'
          }`}
          aria-hidden="true"
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
      {/* smooth open/close using a grid row that animates from 0fr to 1fr */}
      <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className={`max-w-[46em] pb-7 pr-12 font-light leading-relaxed text-muted transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}>{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function Faq() {
  const { faq: FAQ } = useSite()
  const [picked, setGroup] = useState(null)
  const [open, setOpen] = useState(0)
  const group = FAQ.some(g => g.group === picked) ? picked : FAQ[0]?.group
  const items = FAQ.find(g => g.group === group)?.items || []
  if (!FAQ.length) return null

  return (
    <section id="faq" className="bg-mist px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="reveal mb-12 text-center">
          <h2 className="flex items-center justify-center gap-5 font-script text-[32px] font-semibold italic text-ink md:text-[40px]">
            <span className="hidden h-px w-24 bg-ink/40 sm:block" /> Frequently Asked Questions <span className="hidden h-px w-24 bg-ink/40 sm:block" />
          </h2>
          <p className="mx-auto mt-3 max-w-[36em] text-[15px] text-muted">Everything you need to know about buying Farmora palm oil. Can't find your answer? <a href="#contact" className="link-u font-medium text-grass">Contact us</a>.</p>
        </div>

        <div className="grid gap-10 md:grid-cols-[220px_1fr] md:gap-16">
          <div className="reveal flex flex-wrap gap-2 md:flex-col md:items-start" role="tablist" aria-label="FAQ topics">
            {FAQ.map(g => (
              <button
                key={g.group}
                role="tab"
                aria-selected={g.group === group}
                onClick={() => { setGroup(g.group); setOpen(0) }}
                className={`btn-micro rounded-full px-4 py-2 text-[13px] ${
                  g.group === group ? 'bg-grass text-white' : 'border border-ink/15 text-muted hover:border-ink/40 hover:text-ink'
                }`}
              >
                {g.group}
              </button>
            ))}
          </div>

          <div key={group} className="border-t border-ink/12">
            {items.map((it, i) => (
              <Item key={it.q} index={i} {...it} open={open === i} onToggle={() => setOpen(o => (o === i ? -1 : i))} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
