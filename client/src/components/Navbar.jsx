import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { customer, logout, authLoading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function openLogin() { setAuthTab('login'); setShowAuth(true) }
  function openRegister() { setAuthTab('register'); setShowAuth(true) }

  function handleLogout() {
    logout()
    setShowDropdown(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path || (path === '/movies' && location.pathname.startsWith('/movies'))

  const navLinkStyle = (active) => ({
    color: active ? '#e8e8f0' : '#6a6a8a',
    fontWeight: active ? '600' : '400',
    fontSize: '0.92rem',
    textDecoration: 'none',
    padding: '0.3rem 0',
    borderBottom: `2px solid ${active ? '#e94560' : 'transparent'}`,
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  })

  // User initials for avatar
  const initials = customer?.name
    ? customer.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '64px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem',
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              background: 'linear-gradient(135deg, #e94560, #c73652)',
              color: 'white', width: '34px', height: '34px',
              borderRadius: '9px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '900', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(233,69,96,0.3)',
            }}>C</span>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#e8e8f0', letterSpacing: '-0.3px' }}>
              Cine<span style={{ color: '#e94560' }}>Village</span>
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={navLinkStyle(location.pathname === '/')}>Home</Link>
            <Link to="/movies" style={navLinkStyle(isActive('/movies'))}>Movies</Link>
            <Link to="/my-tickets" style={navLinkStyle(location.pathname === '/my-tickets')}>My Tickets</Link>
          </div>

          {/* Account section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {authLoading ? (
              <div style={{ width: '80px', height: '34px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', animation: 'shimmer 1.5s infinite' }} />
            ) : customer ? (
              /* Logged-in user menu */
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: showDropdown ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${showDropdown ? 'rgba(233,69,96,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px', padding: '0.4rem 0.7rem 0.4rem 0.4rem',
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: 'linear-gradient(135deg, #e94560, #c73652)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '0.72rem', flexShrink: 0,
                  }}>{initials}</div>
                  <span style={{ color: '#e8e8f0', fontSize: '0.88rem', fontWeight: '600', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customer.name.split(' ')[0]}
                  </span>
                  <span style={{ color: '#6a6a8a', fontSize: '0.8rem', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'linear-gradient(145deg, #1a1a2e, #14142a)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', overflow: 'hidden', minWidth: '200px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    animation: 'slideDown 0.15s ease',
                  }}>
                    <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} } @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
                    {/* User info header */}
                    <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: '#e8e8f0', fontWeight: '700', fontSize: '0.9rem', margin: 0 }}>{customer.name}</p>
                      <p style={{ color: '#6a6a8a', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>{customer.email}</p>
                    </div>
                    {/* Menu items */}
                    {[
                      { icon: '🎟️', label: 'My Tickets', action: () => { navigate('/my-tickets'); setShowDropdown(false) } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={dropdownItemStyle}>
                        <span>{item.icon}</span> {item.label}
                      </button>
                    ))}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    <button onClick={handleLogout} style={{ ...dropdownItemStyle, color: '#e94560' }}>
                      <span>↪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in */
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={openLogin}
                  style={{
                    padding: '0.45rem 1rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#8888a8',
                    borderRadius: '9px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e94560'; e.currentTarget.style.color = '#e8e8f0' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#8888a8' }}
                >
                  Sign In
                </button>
                <button
                  onClick={openRegister}
                  style={{
                    padding: '0.45rem 1.1rem',
                    background: 'linear-gradient(135deg, #e94560, #c73652)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '9px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(233,69,96,0.3)',
                    transition: 'transform 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Join Free
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal defaultTab={authTab} onClose={() => setShowAuth(false)} />}
    </>
  )
}

const dropdownItemStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
  padding: '0.75rem 1rem', background: 'none', border: 'none',
  color: '#c8c8e0', fontSize: '0.88rem', fontWeight: '500',
  cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
  fontFamily: 'inherit',
  ':hover': { background: 'rgba(255,255,255,0.04)' },
}
