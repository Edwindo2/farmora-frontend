import { useEffect, useState } from 'react'

export const SECTIONS = [
  { id: 'harvest', label: 'The Harvest' },
  { id: 'origin', label: 'The Origin' },
  { id: 'oils', label: 'The Oils' },
  { id: 'delivery', label: 'Local & Global' },
  { id: 'quality', label: 'Quality' },
  { id: 'process', label: 'How It Works' },
  { id: 'faq', label: 'FAQ' },
]

// Swatch gradient for each product card.
export const TONES = {
  'red-palm-oil': 'from-[#e8641c] via-[#a8320a] to-[#4a1503]',
  'crude-palm-oil': 'from-[#f08a2a] via-[#c2500e] to-[#5e2405]',
  'palm-kernel-oil': 'from-[#f6e2a0] via-[#d9a944] to-[#73520f]',
}

export function money(amount, currency) {
  if (amount == null) return 'Quote on request'
  return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const priceOf = (size, mode) => (mode === 'local' ? size.ngn : size.usd)
export const currencyOf = mode => (mode === 'local' ? 'NGN' : 'USD')

// Reveal elements with the .reveal class as they scroll into view.
// A MutationObserver also picks up elements React adds later (products, success states...).
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    )
    const seen = new WeakSet() // per effect run, so React's dev double-run still observes everything
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      if (seen.has(el)) return
      seen.add(el)
      io.observe(el)
    })
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [])
}

// Light / dark theme for the main site. Remembers the choice; defaults to the device setting.
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('farmora-theme', theme) } catch { /* private mode */ }
  }, [theme])
  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))]
}
