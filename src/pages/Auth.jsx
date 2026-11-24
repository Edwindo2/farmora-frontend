import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shell, SignInPage } from './Account'
import { useAuth } from '../auth'

// /login and /register. After signing in, customers go back to where they came from (?next=/checkout).
function AuthPage({ initial }) {
  const { me } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')?.startsWith('/') ? params.get('next') : '/account'
  useEffect(() => { if (me) nav(next, { replace: true }) }, [me, next, nav])
  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    document.title = `${initial === 'register' ? 'Create an account' : 'Sign in'} · Farmora`
    return () => { document.title = 'Farmora — Palm Oil from Nigeria, Delivered Anywhere' }
  }, [initial])
  return <Shell><SignInPage initial={initial} onDone={() => nav(next, { replace: true })} /></Shell>
}

export const LoginPage = () => <AuthPage initial="login" />
export const RegisterPage = () => <AuthPage initial="register" />
