import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Contact/location details and the FAQ, both edited in the admin and loaded once for the whole site.
const DEFAULTS = {
  contact: { email: 'hello@farmora.com', phone: '', whatsapp: '', address: '', city: 'Lagos', state: '', country: 'Nigeria', hours: '', mapUrl: '', hub: 'Lagos' },
  faq: [],
  reviews: [],
  news: [],
  fx: {},
}
const SiteContext = createContext({ ...DEFAULTS, loaded: false, reload: () => {} })

export function SiteProvider({ children }) {
  const [data, setData] = useState({ ...DEFAULTS, loaded: false })
  const reload = useCallback(() => {
    fetch('/api/site')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setData({ contact: { ...DEFAULTS.contact, ...d.contact }, faq: d.faq || [], reviews: d.reviews || [], news: d.news || [], fx: d.fx || {}, loaded: true }))
      .catch(() => setData(s => ({ ...s, loaded: true })))
  }, [])
  useEffect(() => { reload() }, [reload])
  return <SiteContext.Provider value={{ ...data, reload }}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)

// "Lagos, Nigeria"
export const placeOf = c => [c.city, c.country].filter(Boolean).join(', ')
export const telHref = n => `tel:${String(n).replace(/[^\d+]/g, '')}`
export const waHref = n => `https://wa.me/${String(n).replace(/\D/g, '')}`
