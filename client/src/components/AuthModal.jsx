import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:3000'

export default function AuthModal({ onClose, defaultTab = 'login' }) {
  const { login } = useAuth()
  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      login(data.customer, data.token)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      login(data.customer, data.token)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t) => { setTab(t); setError(null) }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .auth-input { width: 100%; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); color: #e8e8f0; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .auth-input:focus { border-color: #e94560; }
        .auth-input::placeholder { color: #5a5a7a; }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #16162a 0%, #12121f 100%)',
          border: '1px solid rgba(233,69,96,0.2)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '420px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.75rem 2rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ background: '#e94560', color: 'white', width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>C</span>
              <span style={{ fontWeight: '700', color: '#e8e8f0' }}>CineVillage</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e8e8f0' }}>
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: '#6a6a8a', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {tab === 'login' ? 'Sign in to access your tickets' : 'Join to manage your bookings'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8888a8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Tab switcher */}
        <div style={{ padding: '1.25rem 2rem 0', display: 'flex', gap: '0', background: 'transparent' }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: tab === t ? '#e94560' : 'rgba(255,255,255,0.04)',
                color: tab === t ? 'white' : '#6a6a8a',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                borderRadius: t === 'login' ? '8px 0 0 8px' : '0 8px 8px 0',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >{t === 'login' ? 'Sign In' : 'Register'}</button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {error && (
            <div style={{
              background: 'rgba(231,76,60,0.12)',
              border: '1px solid rgba(231,76,60,0.4)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              color: '#ff8080',
              fontSize: '0.875rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input className="auth-input" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input className="auth-input" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading} style={submitBtnStyle(loading)}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p style={{ textAlign: 'center', color: '#6a6a8a', fontSize: '0.85rem' }}>
                No account?{' '}
                <button type="button" onClick={() => switchTab('register')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  Register here
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input className="auth-input" type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Jane Smith" required />
              </div>
              <div>
                <label style={labelStyle}>Email address</label>
                <input className="auth-input" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input className="auth-input" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min 6 chars" required />
                </div>
                <div>
                  <label style={labelStyle}>Confirm</label>
                  <input className="auth-input" type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="Repeat" required />
                </div>
              </div>
              <button type="submit" disabled={loading} style={submitBtnStyle(loading)}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <p style={{ textAlign: 'center', color: '#6a6a8a', fontSize: '0.85rem' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('login')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#8888a8',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const submitBtnStyle = (loading) => ({
  width: '100%',
  padding: '0.875rem',
  background: loading ? '#2a1a1e' : 'linear-gradient(135deg, #e94560 0%, #c73652 100%)',
  color: loading ? '#6a6a8a' : 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '1rem',
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'opacity 0.2s',
  marginTop: '0.25rem',
  boxShadow: loading ? 'none' : '0 4px 20px rgba(233,69,96,0.35)',
  fontFamily: 'inherit',
})
