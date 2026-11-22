import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from './auth'

// The signed-in customer's wishlist (product ids), shared by heart buttons and the dashboard.
const WishContext = createContext(null)

export function WishlistProvider({ children }) {
  const { me } = useAuth()
  const [ids, setIds] = useState([])
  useEffect(() => {
    if (!me) { setIds([]); return }
    fetch('/api/account/wishlist', { credentials: 'include' }).then(r => (r.ok ? r.json() : [])).then(list => setIds(list.map(i => i.productId))).catch(() => {})
  }, [me])
  const toggle = useCallback(async id => {
    const on = ids.includes(id)
    setIds(list => (on ? list.filter(x => x !== id) : [id, ...list])) // optimistic
    const res = await fetch(on ? `/api/account/wishlist/${encodeURIComponent(id)}` : '/api/account/wishlist', {
      method: on ? 'DELETE' : 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: on ? undefined : JSON.stringify({ productId: id }),
    }).catch(() => null)
    if (!res?.ok) setIds(list => (on ? [id, ...list] : list.filter(x => x !== id))) // undo on failure
  }, [ids])
  return <WishContext.Provider value={{ ids, has: id => ids.includes(id), toggle }}>{children}</WishContext.Provider>
}

export const useWishlist = () => useContext(WishContext)

// Heart button. Signed-out visitors are sent to sign in first.
export function WishButton({ productId, className = '', label = false }) {
  const { me } = useAuth()
  const { has, toggle } = useWishlist()
  const nav = useNavigate()
  const { pathname, search } = useLocation()
  const on = has(productId)
  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); e.stopPropagation(); if (!me) nav(`/login?next=${encodeURIComponent(pathname + search)}`); else toggle(productId) }}
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
