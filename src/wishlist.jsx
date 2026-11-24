import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from './auth'

// The signed-in customer's wishlist, saved per pack size. Each entry is { productId, sizeId } (sizeId null = an
// older whole-product save). Shared by the heart buttons and the dashboard.
const WishContext = createContext(null)
const keyOf = (productId, sizeId) => `${productId}:${sizeId || ''}`

export function WishlistProvider({ children }) {
  const { me } = useAuth()
  const [items, setItems] = useState([])
  useEffect(() => {
    if (!me) { setItems([]); return }
    fetch('/api/account/wishlist', { credentials: 'include' }).then(r => (r.ok ? r.json() : [])).then(list => setItems(list.map(i => ({ productId: i.productId, sizeId: i.sizeId || null })))).catch(() => {})
  }, [me])
  const has = useCallback((productId, sizeId) => items.some(i => keyOf(i.productId, i.sizeId) === keyOf(productId, sizeId)), [items])
  const toggle = useCallback(async (productId, sizeId = null) => {
    const key = keyOf(productId, sizeId)
    const on = items.some(i => keyOf(i.productId, i.sizeId) === key)
    const entry = { productId, sizeId: sizeId || null }
    const without = list => list.filter(i => keyOf(i.productId, i.sizeId) !== key)
    setItems(list => (on ? without(list) : [entry, ...list])) // optimistic
    const url = on ? `/api/account/wishlist/${encodeURIComponent(productId)}${sizeId ? `?size=${encodeURIComponent(sizeId)}` : ''}` : '/api/account/wishlist'
    const res = await fetch(url, {
      method: on ? 'DELETE' : 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: on ? undefined : JSON.stringify(entry),
    }).catch(() => null)
    if (!res?.ok) setItems(list => (on ? [entry, ...list] : without(list))) // undo on failure
  }, [items])
  return <WishContext.Provider value={{ items, has, toggle }}>{children}</WishContext.Provider>
}

export const useWishlist = () => useContext(WishContext)

// Heart button for one pack size. Signed-out visitors are sent to sign in first.
export function WishButton({ productId, sizeId = null, className = '', label = false }) {
  const { me } = useAuth()
  const { has, toggle } = useWishlist()
  const nav = useNavigate()
  const { pathname, search } = useLocation()
  const on = has(productId, sizeId)
  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); e.stopPropagation(); if (!me) nav(`/login?next=${encodeURIComponent(pathname + search)}`); else toggle(productId, sizeId) }}
      aria-pressed={on}
      aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'}
      title={on ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`inline-flex items-center justify-center gap-2 transition ${className}`}
    >
      <Heart className={`h-5 w-5 transition ${on ? 'scale-110 fill-ruby text-ruby' : ''}`} strokeWidth={1.8} />
      {label && <span>{on ? 'Saved' : 'Save to wishlist'}</span>}
    </button>
  )
}
