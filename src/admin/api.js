import { ADMIN } from './path'
// Fetch helper for the admin API. Sends the session cookie and turns errors into thrown messages.
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api/admin${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && !['/login', '/forgot-password', '/reset-password'].includes(path)) {
    window.location.href = `${ADMIN}/login`
    throw new Error('Please sign in.')
  }
  if (!res.ok) throw new Error(data.error || (data.errors || []).join(' ') || 'Something went wrong.')
  return data
}
