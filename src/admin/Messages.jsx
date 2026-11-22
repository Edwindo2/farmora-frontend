import { useEffect, useState } from 'react'
import { api } from './api'
import { Badge, date, btn } from './ui'

export default function Messages() {
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(null)
  const load = () => api('/messages').then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])

  async function setStatus(m, status) {
    await api(`/messages/${m.id}`, { method: 'PATCH', body: { status } })
    load()
  }
  async function expand(m) {
    setOpen(open === m.id ? null : m.id)
    if (m.status === 'new') setStatus(m, 'read')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.28em] uppercase text-lime">Messages</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em]">Contact inbox</h1>
      </div>
      <div className="divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        {list === null && <p className="p-6 text-faint">Loading…</p>}
        {list?.length === 0 && <p className="p-6 text-faint">No messages.</p>}
        {list?.map(m => (
          <div key={m.id}>
            <button onClick={() => expand(m)} className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-ink/[0.04]">
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] ${m.status === 'new' ? 'font-semibold' : ''}`}>{m.name} <span className="font-normal text-faint">· {m.topic}</span></p>
                <p className="truncate text-[13px] text-muted">{m.message}</p>
              </div>
              <span className="hidden text-[12px] text-faint sm:block">{date(m.createdAt)}</span>
              <Badge value={m.status} />
            </button>
            {open === m.id && (
              <div className="space-y-4 bg-ink/[0.03] px-5 pb-5 pt-1">
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{m.message}</p>
                <p className="text-[13px] text-muted">{m.email}{m.phone && ` · ${m.phone}`} · ref {m.reference}</p>
                <div className="flex flex-wrap gap-2">
                  <a className={`${btn} bg-lime text-night hover:brightness-95`} href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.topic + ' (' + m.reference + ')')}`} onClick={() => setStatus(m, 'replied')}>Reply by email</a>
                  {m.status !== 'replied' && <button className={`${btn} border border-ink/15 hover:border-ink`} onClick={() => setStatus(m, 'replied')}>Mark replied</button>}
                  <button className={`${btn} border border-ink/15 hover:border-ink`} onClick={() => setStatus(m, 'archived')}>Archive</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
