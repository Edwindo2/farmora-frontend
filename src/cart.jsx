import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './auth'
import { useSite } from './site'
import { money, currencyOf, localProduct } from './lib'

// Products, buying mode, display currency and the cart, shared by every page.
// The cart, mode and currency are saved in the browser so they survive moving between pages or a refresh.
// Approved wholesale customers get wholesale prices: products are re-fetched when that changes.
const CartContext = createContext(null)
const KEY = 'farmora-cart'
const CUR_KEY = 'farmora-currency'

function readSaved() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}

const SYMBOLS = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AED: 'AED ', AUD: 'A$', CNY: '¥', INR: '₹', ZAR: 'R ', GHS: 'GH₵', KES: 'KSh ' }

export function CartProvider({ children }) {
  const saved = useMemo(readSaved, [])
  const { me } = useAuth()
  const { fx = {} } = useSite()
  const [products, setProducts] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [mode, setMode] = useState(saved?.mode || 'international') // 'local' (Nigeria, NGN) or 'international' (USD)
  const [cart, setCart] = useState([])
  const [ready, setReady] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [displayCurrency, setDisplayCurrencyState] = useState(() => { try { return localStorage.getItem(CUR_KEY) || 'USD' } catch { return 'USD' } })
  const first = useRef(true)

  // approved distributors and wholesale accounts see their own prices; products are re-fetched when this changes
  const tier = me?.wholesaleStatus === 'approved' && ['wholesale', 'distributor'].includes(me?.accountType) ? me.accountType : null
  const wholesale = Boolean(tier)
  const priceKey = me === undefined ? null : tier || 'retail'

  // International accounts start in USD mode
  useEffect(() => { if (me?.accountType === 'international' && !saved?.mode) setMode('international') }, [me, saved])

  useEffect(() => {
    if (!priceKey) return // wait until we know who is signed in
    fetch('/api/products', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(raw => {
        const list = raw.map(localProduct)
        setProducts(list)
        const build = items => (items || []).flatMap(i => {
          const product = list.find(p => p.id === i.productId)
          const size = product?.sizes.find(s => s.id === i.sizeId)
          return size && i.qty > 0 ? [{ key: `${product.id}:${size.id}`, product, size, qty: i.qty }] : []
        })
        if (first.current) {
          first.current = false
          let lines = build(saved?.items)
          // "Reorder" from the dashboard replaces the cart with that order's items
          try {
            const handoff = JSON.parse(sessionStorage.getItem('farmora-reorder') || 'null')
            sessionStorage.removeItem('farmora-reorder')
            if (handoff) {
              if (handoff.mode) setMode(handoff.mode)
              lines = build(handoff.items)
            }
          } catch { /* storage blocked */ }
          setCart(lines)
        } else {
          // prices changed (signed in/out as wholesale): keep the same items, with fresh prices
          setCart(c => build(c.map(l => ({ productId: l.product.id, sizeId: l.size.id, qty: l.qty }))))
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setReady(true))
  }, [priceKey, saved])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ mode, items: cart.map(l => ({ productId: l.product.id, sizeId: l.size.id, qty: l.qty })) }))
    } catch { /* private mode */ }
  }, [cart, mode, ready])

  const setDisplayCurrency = useCallback(c => {
    setDisplayCurrencyState(c)
    try { localStorage.setItem(CUR_KEY, c) } catch { /* private mode */ }
  }, [])

  // Currencies offered: USD plus every currency the admin has a rate for.
  const currencies = useMemo(() => ['USD', ...Object.keys(fx)], [fx])
  const shownCurrency = mode === 'international' && currencies.includes(displayCurrency) ? displayCurrency : null

  /**
   * Formats a price for display. NGN in Nigeria; USD abroad, or the buyer's chosen display currency
   * (converted with the admin's rate, marked "≈"). Orders are always charged in NGN or USD.
   */
  const price = useCallback((amount, opts = {}) => {
    if (amount == null) return money(null, currencyOf(mode))
    if (mode !== 'international' || !shownCurrency || shownCurrency === 'USD' || !fx[shownCurrency]) return money(amount, currencyOf(mode))
    const v = amount * fx[shownCurrency]
    const text = `${SYMBOLS[shownCurrency] || `${shownCurrency} `}${v.toLocaleString(undefined, { maximumFractionDigits: v < 100 ? 2 : 0 })}`
    return opts.plain ? text : `≈ ${text}`
  }, [mode, shownCurrency, fx])

  const add = useCallback((product, size, qty = 1) => {
    const key = `${product.id}:${size.id}`
    setCart(c => {
      const hit = c.find(l => l.key === key)
      return hit ? c.map(l => (l.key === key ? { ...l, qty: l.qty + qty } : l)) : [...c, { key, product, size, qty }]
    })
  }, [])
  const setQty = useCallback((key, qty) => setCart(c => (qty < 1 ? c.filter(l => l.key !== key) : c.map(l => (l.key === key ? { ...l, qty } : l)))), [])
  const remove = useCallback(key => setCart(c => c.filter(l => l.key !== key)), [])
  const clear = useCallback(() => setCart([]), [])
  const openDrawer = useCallback(() => setDrawer(true), [])
  const closeDrawer = useCallback(() => setDrawer(false), [])

  const value = {
    products, loadError, ready, mode, setMode, cart, add, setQty, remove, clear,
    count: cart.reduce((s, l) => s + l.qty, 0),
    drawer, openDrawer, closeDrawer,
    wholesale, tier, price, currencies, displayCurrency: shownCurrency || 'USD', setDisplayCurrency,
    converted: Boolean(shownCurrency && shownCurrency !== 'USD'),
  }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
