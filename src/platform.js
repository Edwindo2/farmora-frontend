// Runs the same React site as a website or inside a mobile app shell (e.g. Capacitor).
//
// Website (default): API calls go to /api on the same domain and sign-in uses a secure cookie.
// App mode: set VITE_API_URL (e.g. https://farmora.com) when building the app. Then:
//   - /api/... and /uploads/... requests go to that server, using the stable /api/v1 address
//   - customer sign-in uses a token (sent as "Authorization: Bearer"), because app shells can't rely on cookies
// Nothing else in the code needs to know which one it is: it keeps calling fetch('/api/...').

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const isApp = Boolean(API)
const TOKEN_KEY = 'farmora-token'

export function assetUrl(path) {
  return isApp && path && path.startsWith('/uploads/') ? API + path : path
}

function getToken() { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage blocked */ } }

export function installPlatform() {
  if (!isApp || window.__farmoraPlatform) return
  window.__farmoraPlatform = true
  const original = window.fetch.bind(window)
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url
    if (!url.startsWith('/api/') && !url.startsWith('/uploads/')) return original(input, init)
    // customer API -> /api/v1 on the remote server (the admin stays a website only)
    const target = API + (url.startsWith('/api/') && !url.startsWith('/api/admin') ? url.replace(/^\/api\//, '/api/v1/') : url)
    const headers = new Headers(init.headers || {})
    headers.set('X-Farmora-Client', 'app')
    const token = getToken()
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
    const res = await original(target, { ...init, headers, credentials: 'omit' })
    // keep the token from sign-in responses; forget it on sign-out or when it's no longer valid
    if (/\/account\/(login|register|verify)$/.test(url) && res.ok) {
      res.clone().json().then(d => d?.token && setToken(d.token)).catch(() => {})
    }
    if (/\/account\/logout$/.test(url)) setToken(null)
    if (res.status === 401 && url.startsWith('/api/account/') && token) setToken(null)
    return res
  }
}
