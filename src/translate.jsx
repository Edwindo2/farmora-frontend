import { useEffect, useRef, useState } from 'react'
import { Languages, Check, ChevronDown, Search } from 'lucide-react'

// Website translation using the Google Translate website widget, behind Farmora's own language picker.
// Google's script only loads once a visitor picks a language other than English, and the choice is kept
// in Google's "googtrans" cookie so every page (home, shop, tracking, My orders, admin) stays translated.

export const LANGUAGES = [
  ['en', 'English', 'English'],
  ['fr', 'French', 'Français'],
  ['es', 'Spanish', 'Español'],
  ['pt', 'Portuguese', 'Português'],
  ['de', 'German', 'Deutsch'],
  ['it', 'Italian', 'Italiano'],
  ['nl', 'Dutch', 'Nederlands'],
  ['ar', 'Arabic', 'العربية'],
  ['zh-CN', 'Chinese', '中文'],
  ['hi', 'Hindi', 'हिन्दी'],
  ['tr', 'Turkish', 'Türkçe'],
  ['ru', 'Russian', 'Русский'],
  ['sw', 'Swahili', 'Kiswahili'],
  ['yo', 'Yoruba', 'Yorùbá'],
  ['ig', 'Igbo', 'Igbo'],
  ['ha', 'Hausa', 'Hausa'],
]
const CODES = LANGUAGES.map(l => l[0])

export function currentLanguage() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/)
  const code = m ? decodeURIComponent(m[1]) : 'en'
  return CODES.includes(code) ? code : 'en'
}

function writeCookie(value, maxAge) {
  const host = location.hostname
  const base = `googtrans=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = base
  // Google also reads a cookie on the parent domain (e.g. .farmora.com); clear/set both on real domains
  if (host.includes('.') && !/^[\d.]+$/.test(host)) document.cookie = `${base}; domain=.${host.split('.').slice(-2).join('.')}`
}

// React and Google Translate both edit the page. When Google swaps a text node React later tries to
// remove or move, the browser throws and the page goes blank. These guards skip such moves safely.
function guardDom() {
  if (window.__farmoraDomGuard || typeof Node !== 'function') return
  window.__farmoraDomGuard = true
  const remove = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child
    return remove.call(this, child)
  }
  const insert = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) return node
    return insert.call(this, node, ref)
  }
}

let loading = null
function loadGoogle() {
  if (loading) return loading
  guardDom()
  loading = new Promise(resolve => {
    let holder = document.getElementById('google_translate_element')
    if (!holder) {
      holder = document.createElement('div')
      holder.id = 'google_translate_element'
      holder.setAttribute('aria-hidden', 'true')
      document.body.appendChild(holder)
    }
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', includedLanguages: CODES.join(','), autoDisplay: false },
        'google_translate_element',
      )
      resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    s.async = true
    s.onerror = () => { loading = null; resolve() }
    document.head.appendChild(s)
  })
  return loading
}

// Call once at startup: re-applies a previously chosen language on every page load.
export function initTranslation() {
  const lang = currentLanguage()
  if (lang === 'en') return
  // Start Google once the page has rendered and settled, then apply the language the same way the
  // picker does. (Starting earlier, while React is still drawing the page, leaves it in English.)
  // Google's own restore-from-cookie marks the page translated without translating it, so the cookie
  // is hidden from Google while it starts and saved again once the language is applied.
  const start = () => setTimeout(() => {
    writeCookie('', 0)
    loadGoogle()
      .then(() => applyCombo(lang, false))
      .finally(() => writeCookie(`/en/${lang}`, 60 * 60 * 24 * 365))
  }, 400)
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}

// Drives Google's hidden language menu. Returns false if it never became ready.
async function applyCombo(code, reloadOnFail = true) {
  for (let i = 0; i < 40; i++) {
    const combo = document.querySelector('select.goog-te-combo')
    if (combo && combo.options.length > 1) {
      // always send the change: after a page load Google marks the page translated without doing it
      combo.value = code
      combo.dispatchEvent(new Event('change'))
      return true
    }
    await new Promise(r => setTimeout(r, 150))
  }
  if (reloadOnFail) location.reload()
  return false
}

export async function setLanguage(code) {
  if (code === currentLanguage()) return
  if (code === 'en') {
    writeCookie('', 0)
    location.reload() // the only reliable way to fully restore the original text
    return
  }
  writeCookie(`/en/${code}`, 60 * 60 * 24 * 365)
  await loadGoogle()
  // switch in place through Google's hidden menu; falls back to a reload if it isn't ready
  await applyCombo(code)
}

const label = code => LANGUAGES.find(l => l[0] === code) || LANGUAGES[0]

function LanguageList({ value, onPick, compact = false }) {
  const [q, setQ] = useState('')
  const list = LANGUAGES.filter(([, en, native]) => !q || `${en} ${native}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 rounded-lg border border-ink/10 bg-mist/60 px-3 py-2">
        <Search className="h-4 w-4 text-faint" strokeWidth={1.7} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search languages" aria-label="Search languages" className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
      </label>
      <ul className={`grid gap-0.5 overflow-y-auto ${compact ? 'max-h-72 grid-cols-2' : 'max-h-[min(60vh,360px)] grid-cols-2'}`} role="listbox" aria-label="Languages">
        {list.map(([code, en, native]) => (
          <li key={code}>
            <button
              role="option"
              aria-selected={code === value}
              onClick={() => onPick(code)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${code === value ? 'bg-ink/[0.07]' : 'hover:bg-ink/[0.05]'}`}
            >
              <span className="min-w-0">
                <span translate="no" className="notranslate block truncate text-[13.5px] text-ink">{native}</span>
                <span translate="no" className="notranslate block truncate text-[11px] text-faint">{en}</span>
              </span>
              {code === value && <Check className="h-4 w-4 shrink-0 text-scarlet" />}
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="col-span-2 px-3 py-4 text-[13px] text-faint">No match.</li>}
      </ul>
      <p className="mt-3 border-t border-ink/10 px-1 pt-2.5 text-[10.5px] leading-snug text-faint">Translated automatically by Google. Prices, order details and terms in English apply.</p>
    </div>
  )
}

/**
 * Language picker.
 * - variant "button" (default): round icon button with a dropdown. `light` = white, for the photo hero.
 * - variant "pill": small text button for page headers.
 * - variant "inline": the full list, for the mobile menu.
 */
export function LanguagePicker({ variant = 'button', light = false, className = '', align = 'right' }) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState('en')
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  useEffect(() => { setLang(currentLanguage()) }, [])
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = e => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  async function pick(code) {
    setOpen(false)
    if (code === lang) return
    setBusy(true); setLang(code)
    await setLanguage(code)
    setBusy(false)
  }

  const [code, en, native] = label(lang)
  const short = code.split('-')[0].toUpperCase()

  if (variant === 'inline') {
    return (
      <div className={className}>
        <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left font-serif text-2xl text-ink">
          <span>Language <span translate="no" className="notranslate ml-1 font-sans text-[13px] text-muted">{native}</span></span>
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.7} />
        </button>
        {open && <div className="pb-4"><LanguageList value={lang} onPick={pick} compact /></div>}
      </div>
    )
  }

  const trigger = variant === 'pill'
    ? `flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] ${light ? 'border-white/40 text-white hover:border-white' : 'border-ink/15 text-muted hover:border-ink/40 hover:text-ink'}`
    : `btn-micro flex h-10 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium tracking-wide md:h-11 ${light ? 'border-white/40 text-white hover:border-white' : 'border-ink/20 text-ink hover:border-ink'}`

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={`Language: ${en}`} title="Change language" className={trigger}>
        <Languages className={`h-[17px] w-[17px] ${busy ? 'animate-pulse' : ''}`} strokeWidth={1.7} />
        <span translate="no" className="notranslate">{short}</span>
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>
      <div
        className={`absolute top-full z-50 mt-2 w-[min(88vw,340px)] origin-top rounded-2xl border border-ink/10 bg-paper p-3 text-ink shadow-[0_18px_50px_-12px_rgba(0,0,0,.35)] transition duration-200 ${align === 'left' ? 'left-0' : 'right-0'} ${open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'}`}
      >
        <p className="mb-2 px-1 text-[10.5px] uppercase tracking-[0.22em] text-faint">Choose language</p>
        <LanguageList value={lang} onPick={pick} />
      </div>
    </div>
  )
}
