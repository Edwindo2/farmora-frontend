import { ADMIN } from './path'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { api } from './api'
import { ThemeButton } from './AdminLayout'

// Shared dark, two-panel frame for sign in / forgot / reset.
function AuthShell({ children }) {
  return (
    <div className="admin grid min-h-svh bg-shell text-ink lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/journey/5-bottle.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-night via-night/60 to-transparent" />
        <div className="absolute inset-x-10 bottom-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-lime" /> Farmora admin
          </span>
          <h2 className="mt-5 max-w-[14em] text-[34px] font-semibold leading-tight tracking-tight">Orders, products and customers in one place.</h2>
          <p className="mt-3 max-w-[30em] text-[14px] text-muted">Confirm orders, set delivery fees, update prices and reply to buyers, from Lagos to anywhere.</p>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
        <Link to="/" className="flex w-fit items-center gap-3">
          <img src="/emblem.png" alt="" className="h-10 w-10 rounded-full bg-white p-0.5" />
          <span>
            <span className="block font-brand text-[15px] font-semibold tracking-[0.16em]">FARMORA</span>
            <span className="block text-[9px] tracking-[0.3em] text-lime">ADMIN</span>
          </span>
        </Link>
        <ThemeButton className="text-muted" />
        </div>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-center text-[12px] text-faint">© {new Date().getFullYear()} Farmora Agritrade Limited</p>
      </div>
    </div>
  )
}

function Field({ icon: Icon, right, ...props }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper px-4 py-3 transition focus-within:border-lime/60 focus-within:ring-4 focus-within:ring-lime/10">
      <Icon className="h-[18px] w-[18px] shrink-0 text-faint" strokeWidth={1.7} />
      <input {...props} className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint" />
      {right}
    </label>
  )
}

const primary = 'btn-micro flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 text-[14px] font-medium text-night hover:brightness-95 disabled:opacity-60'
const Error = ({ children }) => children ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-300" role="alert">{children}</p> : null

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [params] = useSearchParams()

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api('/login', { method: 'POST', body: { email, password } })
      nav(`${ADMIN}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[30px] font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-[14px] text-muted">Sign in to manage Farmora orders.</p>
      {params.get('reset') === '1' && (
        <p className="mt-6 flex items-center gap-2 rounded-lg bg-lime/10 px-3 py-2 text-[13px] text-lime"><CheckCircle2 className="h-4 w-4" /> Password updated. Sign in with your new password.</p>
      )}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
        <Field
          icon={Lock}
          type={show ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          right={
            <button type="button" onClick={() => setShow(s => !s)} className="text-faint hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          }
        />
        <div className="flex justify-end">
          <Link to={`${ADMIN}/forgot-password`} className="text-[13px] text-lime hover:underline">Forgot password?</Link>
        </div>
        <Error>{error}</Error>
        <button className={primary} disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight className="arr h-4 w-4" /></>}</button>
      </form>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api('/forgot-password', { method: 'POST', body: { email } })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <Link to={`${ADMIN}/login`} className="mb-8 flex w-fit items-center gap-2 text-[13px] text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
      {sent ? (
        <>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-lime"><Mail className="h-5 w-5" /></span>
          <h1 className="mt-5 text-[30px] font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">If <b className="text-ink">{email}</b> belongs to an admin account, we've sent a link to reset the password. It expires in 30 minutes.</p>
          <button onClick={() => setSent(false)} className="mt-8 text-[13px] text-lime hover:underline">Use a different email</button>
        </>
      ) : (
        <>
          <h1 className="text-[30px] font-semibold tracking-tight">Forgot password?</h1>
          <p className="mt-2 text-[14px] text-muted">Enter your admin email and we'll send you a reset link.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
            <Error>{error}</Error>
            <button className={primary} disabled={busy}>{busy ? 'Sending…' : <>Send reset link <ArrowRight className="arr h-4 w-4" /></>}</button>
          </form>
        </>
      )}
    </AuthShell>
  )
}

export function ResetPassword() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const strength = [password.length >= 8, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length

  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError("The passwords don't match.")
    setBusy(true); setError('')
    try {
      await api('/reset-password', { method: 'POST', body: { token, password } })
      nav(`${ADMIN}/login?reset=1`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[30px] font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-[14px] text-muted">Use at least 8 characters. A mix of letters, numbers and symbols is strongest.</p>
      {!token ? (
        <div className="mt-8 space-y-4">
          <Error>This reset link is missing its token. Please request a new one.</Error>
          <Link to={`${ADMIN}/forgot-password`} className={primary}>Request a new link</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field icon={Lock} type={show ? 'text' : 'password'} placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"
            right={<button type="button" onClick={() => setShow(s => !s)} className="text-faint hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}</button>} />
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map(i => <span key={i} className={`h-1 rounded-full transition-colors ${i < strength ? (strength >= 3 ? 'bg-lime' : 'bg-amber-300') : 'bg-ink/10'}`} />)}
          </div>
          <Field icon={Lock} type={show ? 'text' : 'password'} placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
          <Error>{error}</Error>
          <button className={primary} disabled={busy}>{busy ? 'Saving…' : <>Update password <ArrowRight className="arr h-4 w-4" /></>}</button>
        </form>
      )}
    </AuthShell>
  )
}
