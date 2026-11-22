import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// The signed-in customer, shared by the header, checkout and dashboard.
// me: undefined while loading, null when signed out, otherwise the profile from /api/account/me.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [me, setMe] = useState(undefined)
  const reload = useCallback(() =>
    fetch('/api/account/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null)), [])
  const signOut = useCallback(async () => {
    await fetch('/api/account/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setMe(null)
  }, [])
  useEffect(() => { reload() }, [reload])
  return <AuthContext.Provider value={{ me, setMe, reload, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
