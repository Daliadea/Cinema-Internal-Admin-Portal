import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { QRCodeSVG } from 'qrcode.react'
import AuthModal from '../components/AuthModal'

const API = 'http://localhost:3000'

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatBookingDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function MyTickets() {
  const { customer, authLoading } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  // Auth modal — opened directly from the sign-in prompt
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  useEffect(() => {
    if (customer) loadBookings()
    else { setBookings(null); setFetchError(null) }
  }, [customer])

  async function loadBookings() {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`${API}/api/customer/bookings`, {
        headers: { Authorization: `Bearer ${customer.token}` }
      })
      if (!res.ok) {
        setFetchError('Failed to load your bookings. Please try again.')
        setBookings(null)
      } else {
        setBookings(await res.json())
      }
    } catch {
      setFetchError('Network error. Please check your connection and try again.')
      setBookings(null)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <PageSpinner />

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!customer) {
    return (
      <>
        {showAuth && <AuthModal defaultTab={authTab} onClose={() => setShowAuth(false)} />}
        <div style={{ maxWidth: '520px', margin: '6rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>🎟️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.5rem' }}>
            Sign in to view your tickets
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            All your bookings are saved to your account. Sign in to see your upcoming and past screenings.
          </p>
          <button
            onClick={() => { setAuthTab('login'); setShowAuth(true) }}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #e94560, #c73652)',
              color: 'white', padding: '0.85rem 2.25rem',
              borderRadius: '12px', fontWeight: '700', fontSize: '1rem',
              boxShadow: '0 4px 20px rgba(233,69,96,0.35)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign In
          </button>
          <p style={{ marginTop: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button
              onClick={() => { setAuthTab('register'); setShowAuth(true) }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '600', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}
            >
              Create one free
            </button>
          </p>
        </div>
      </>
    )
  }

  // ── Signed in ──────────────────────────────────────────────────────────────
  const now = new Date()
  const upcoming = bookings?.filter(b => b.screening && new Date(b.screening.startTime) >= now) || []
  const past = bookings?.filter(b => b.screening && new Date(b.screening.startTime) < now) || []

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.4rem' }}>
          My Tickets
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          All bookings for {customer.name}
        </p>
      </div>

      {/* Account card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(233,69,96,0.1), rgba(90,30,180,0.08))',
        border: '1px solid rgba(233,69,96,0.2)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
          background: 'linear-gradient(135deg, #e94560, #c73652)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: '800', fontSize: '1rem',
        }}>
          {customer.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '700', color: 'var(--text)', margin: 0 }}>{customer.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.15rem 0 0' }}>{customer.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', margin: 0 }}>{upcoming.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>Upcoming</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', margin: 0 }}>{(bookings || []).length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>Total</p>
          </div>
        </div>
      </div>

      {loading ? (
        <TicketSkeletons />
      ) : fetchError ? (
        <div style={{
          background: 'rgba(231,76,60,0.1)',
          border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: '14px', padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <p style={{ color: '#ff8080', fontWeight: '700', marginBottom: '0.5rem' }}>{fetchError}</p>
          <button
            onClick={loadBookings}
            style={{
              marginTop: '0.75rem',
              background: 'linear-gradient(135deg, #e94560, #c73652)',
              color: 'white', border: 'none',
              padding: '0.65rem 1.75rem', borderRadius: '10px',
              fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try Again
          </button>
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <EmptyTickets onBrowse={() => navigate('/movies')} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <SectionHeader title="Upcoming" count={upcoming.length} color="var(--success)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {upcoming.map(b => <TicketCard key={b._id} booking={b} isUpcoming />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <SectionHeader title="Past" count={past.length} color="var(--text-muted)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {past.map(b => <TicketCard key={b._id} booking={b} isUpcoming={false} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function SectionHeader({ title, count, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{title}</h2>
      <span style={{ background: 'rgba(255,255,255,0.06)', color, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
        {count}
      </span>
    </div>
  )
}

function QRModal({ booking, onClose }) {
  const overlayRef = useRef(null)

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const screening = booking.screening
  const movie = screening?.movie
  const hall = screening?.hall

  // Encode key booking details into the QR so staff can scan and verify
  const qrPayload = JSON.stringify({
    ref: booking.bookingRef,
    seats: booking.seats,
    movie: movie?.title || 'N/A',
    time: screening ? new Date(screening.startTime).toISOString() : null,
    hall: hall?.name || 'N/A',
    total: booking.totalAmount,
  })

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%', maxWidth: '360px',
        textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: '800', color: 'white', margin: 0, fontSize: '1rem' }}>
              {movie?.title || 'Ticket'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
              {screening
                ? new Date(screening.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'N/A'}
              {hall && <> · {hall.name}</>}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)',
            width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontFamily: 'inherit',
          }}>✕</button>
        </div>

        {/* QR code */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '1.25rem', display: 'inline-block',
          boxShadow: '0 8px 32px rgba(233,69,96,0.25)',
        }}>
          <QRCodeSVG value={qrPayload} size={200} level="M" />
        </div>

        {/* Booking ref */}
        <div style={{ marginTop: '1.25rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.35rem' }}>
            Booking Reference
          </p>
          <p style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1.25rem', color: '#f5c518', margin: 0, letterSpacing: '2px' }}>
            {booking.bookingRef}
          </p>
        </div>

        {/* Seats */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {booking.seats.map(seat => (
            <span key={seat} style={{
              background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)',
              color: '#2ecc71', padding: '0.2rem 0.55rem', borderRadius: '6px',
              fontSize: '0.85rem', fontWeight: '700', fontFamily: 'monospace',
            }}>{seat}</span>
          ))}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', marginTop: '1.25rem', lineHeight: '1.5' }}>
          Present this QR code at the cinema entrance
        </p>
      </div>
    </div>
  )
}

function TicketCard({ booking, isUpcoming }) {
  const [showQR, setShowQR] = useState(false)
  const { screening } = booking
  const movie = screening?.movie
  const hall = screening?.hall

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid',
      borderColor: isUpcoming ? 'rgba(233,69,96,0.25)' : 'var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      opacity: isUpcoming ? 1 : 0.75,
    }}>
      {isUpcoming && (
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #e94560, #ff8fa0)' }} />
      )}

      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
              {movie ? movie.title : 'Deleted Movie'}
            </h3>
            {screening && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {formatDateTime(screening.startTime)}
                {hall && <span style={{ color: 'var(--text)', fontWeight: '600' }}> · {hall.name}</span>}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <span style={{
              fontFamily: 'monospace', fontWeight: '700', fontSize: '0.82rem',
              color: isUpcoming ? 'var(--gold)' : 'var(--text-muted)',
              background: isUpcoming ? 'rgba(245,197,24,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isUpcoming ? 'rgba(245,197,24,0.25)' : 'var(--border)'}`,
              padding: '0.25rem 0.65rem', borderRadius: '6px',
            }}>{booking.bookingRef}</span>
            <span style={{
              background: isUpcoming ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isUpcoming ? 'rgba(46,204,113,0.25)' : 'var(--border)'}`,
              color: isUpcoming ? 'var(--success)' : 'var(--text-muted)',
              padding: '0.2rem 0.65rem', borderRadius: '20px',
              fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase',
            }}>
              {isUpcoming ? 'Upcoming' : 'Completed'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', fontWeight: '600' }}>Seats</p>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {booking.seats.map(seat => (
                <span key={seat} style={{
                  background: isUpcoming ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isUpcoming ? 'rgba(46,204,113,0.25)' : 'var(--border)'}`,
                  color: isUpcoming ? 'var(--success)' : 'var(--text-muted)',
                  padding: '0.2rem 0.55rem', borderRadius: '6px',
                  fontSize: '0.82rem', fontWeight: '700', fontFamily: 'monospace',
                }}>{seat}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Paid</p>
            <p style={{ fontWeight: '800', fontSize: '1.2rem', color: isUpcoming ? 'var(--gold)' : 'var(--text-muted)', margin: 0 }}>
              ${booking.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        padding: '0.6rem 1.5rem',
        borderTop: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          Booked {formatBookingDate(booking.createdAt)}
        </p>
        <button
          onClick={() => setShowQR(true)}
          style={{
            background: isUpcoming ? 'rgba(233,69,96,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isUpcoming ? 'rgba(233,69,96,0.25)' : 'var(--border)'}`,
            color: isUpcoming ? '#e94560' : 'var(--text-muted)',
            padding: '0.3rem 0.85rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: '700',
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isUpcoming ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isUpcoming ? 'rgba(233,69,96,0.1)' : 'rgba(255,255,255,0.05)'
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>▦</span> Show QR
        </button>
      </div>

      {showQR && <QRModal booking={booking} onClose={() => setShowQR(false)} />}
    </div>
  )
}

function EmptyTickets({ onBrowse }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎬</div>
      <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>No bookings yet</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your tickets will appear here after you book</p>
      <button onClick={onBrowse} style={{
        background: 'linear-gradient(135deg, #e94560, #c73652)',
        color: 'white', border: 'none', padding: '0.75rem 2rem',
        borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem',
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 20px rgba(233,69,96,0.3)',
      }}>
        Browse Movies →
      </button>
    </div>
  )
}

function TicketSkeletons() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
          <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '40%', marginBottom: '0.75rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  )
}

function PageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
