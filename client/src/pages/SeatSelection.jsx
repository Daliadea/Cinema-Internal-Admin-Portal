import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

const API = 'http://localhost:3000'
const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MAX_SEATS = 10

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function SeatSelection() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customer, logout, authLoading } = useAuth()

  const [screening, setScreening] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])

  // Booking state
  const [showConfirm, setShowConfirm] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(null)

  // Concurrency banner
  const [concurrencyError, setConcurrencyError] = useState(null)

  // Auth modal
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  useEffect(() => { fetchScreening() }, [id])

  // Dismiss confirm panel if user logs out mid-flow
  useEffect(() => {
    if (!customer) setShowConfirm(false)
  }, [customer])

  async function fetchScreening() {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/screenings/${id}`)
      if (!res.ok) throw new Error('Screening not found')
      setScreening(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleSeat(seatCode) {
    setConcurrencyError(null)
    setSelectedSeats(prev => {
      if (prev.includes(seatCode)) return prev.filter(s => s !== seatCode)
      if (prev.length >= MAX_SEATS) return prev   // limit reached — banner shown above the map
      return [...prev, seatCode]
    })
  }

  // Refresh map immediately before showing the confirm panel so seat data is fresh
  async function handleProceed() {
    if (!customer) {
      setAuthTab('login')
      setShowAuth(true)
      return
    }
    setBookingError(null)
    // Refresh seat data before confirming so the user sees the latest state
    await fetchScreening()
    setShowConfirm(true)
  }

  async function handleBook() {
    if (!customer || selectedSeats.length === 0) return
    setBooking(true)
    setBookingError(null)

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customer.token}`
        },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email,
          screeningId: id,
          seats: selectedSeats,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired — sign the user out and prompt re-login
          logout()
          setShowConfirm(false)
          setAuthTab('login')
          setShowAuth(true)
          return
        }
        if (res.status === 409) {
          const contested = [...selectedSeats]
          await fetchScreening()
          setSelectedSeats([])
          setShowConfirm(false)
          setBookingError(null)
          setConcurrencyError({ seats: contested })
        } else {
          setBookingError(data.error || 'Booking failed. Please try again.')
        }
        return
      }

      setBookingSuccess(data)
      setSelectedSeats([])
      setShowConfirm(false)
      await fetchScreening()
    } catch {
      setBookingError('Network error. Please check your connection and try again.')
    } finally {
      setBooking(false)
    }
  }

  if (authLoading || loading) return <Spinner />
  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <p>{error}</p>
      <button onClick={() => navigate(-1)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '1rem', fontSize: '0.95rem' }}>
        ← Go Back
      </button>
    </div>
  )

  const hall = screening.hall
  const movie = screening.movie
  const bookedSeats = screening.bookedSeats || []
  const wheelchairSeats = hall?.wheelchairSeats || []
  const totalSeats = hall ? hall.rows * hall.columns : 0
  const availableCount = totalSeats - bookedSeats.length
  const isSoldOut = totalSeats > 0 && availableCount <= 0
  const price = screening.price || 12.00
  const totalPrice = selectedSeats.length * price
  const atSeatLimit = selectedSeats.length >= MAX_SEATS

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>

      {showAuth && (
        <AuthModal defaultTab={authTab} onClose={() => setShowAuth(false)} />
      )}

      {/* ── Success Banner ── */}
      {bookingSuccess && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(46,204,113,0.12), rgba(39,174,96,0.08))',
          border: '1px solid rgba(46,204,113,0.35)',
          borderRadius: '16px', padding: '2rem',
          marginBottom: '1.5rem', textAlign: 'center',
          animation: 'popIn 0.3s ease',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
          <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: '800' }}>
            Booking Confirmed!
          </h3>
          <p style={{ color: 'var(--text)', marginBottom: '0.35rem' }}>
            Reference: <strong style={{ fontFamily: 'monospace', color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: '1px' }}>
              {bookingSuccess.bookingRef}
            </strong>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Seats {bookingSuccess.seats.join(', ')} · Total ${bookingSuccess.totalAmount.toFixed(2)}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/my-tickets" style={{
              background: 'linear-gradient(135deg, var(--success), #27ae60)',
              color: 'white', padding: '0.6rem 1.5rem',
              borderRadius: '9px', fontWeight: '700', fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(46,204,113,0.3)',
            }}>
              View My Tickets →
            </Link>
            <button onClick={() => setBookingSuccess(null)} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '0.6rem 1.5rem',
              borderRadius: '9px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit',
            }}>
              Book More Seats
            </button>
          </div>
        </div>
      )}

      {/* ── Sold-out Banner ── */}
      {isSoldOut && !bookingSuccess && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(231,76,60,0.14), rgba(192,57,43,0.08))',
          border: '1px solid rgba(231,76,60,0.4)',
          borderRadius: '14px', padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.85rem',
          animation: 'popIn 0.25s ease',
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🎭</span>
          <div>
            <p style={{ fontWeight: '700', color: '#ff6b6b', marginBottom: '0.2rem', fontSize: '0.95rem' }}>
              This screening is sold out
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              All seats have been booked.{' '}
              <Link to={`/movies/${movie._id}`} style={{ color: 'var(--accent)', fontWeight: '600' }}>
                View other screening times →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Concurrency Banner ── */}
      {concurrencyError && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(231,76,60,0.14), rgba(192,57,43,0.08))',
          border: '1px solid rgba(231,76,60,0.4)',
          borderRadius: '14px', padding: '1.1rem 1.4rem',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
          animation: 'popIn 0.25s ease',
        }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '700', color: '#ff6b6b', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
              Someone else just booked {concurrencyError.seats.length === 1 ? 'that seat' : 'those seats'}!
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              Seat{concurrencyError.seats.length !== 1 ? 's' : ''}{' '}
              <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
                {concurrencyError.seats.join(', ')}
              </strong>{' '}
              {concurrencyError.seats.length !== 1 ? 'were' : 'was'} taken while you were confirming.
              The map has been updated — please choose available seats.
            </p>
          </div>
          <button
            onClick={() => setConcurrencyError(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.1rem', flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      {/* ── Max-seat limit warning ── */}
      {atSeatLimit && !isSoldOut && (
        <div style={{
          background: 'rgba(245,197,24,0.08)',
          border: '1px solid rgba(245,197,24,0.3)',
          borderRadius: '12px', padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          fontSize: '0.85rem',
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <p style={{ color: 'var(--gold)', margin: 0, fontWeight: '600' }}>
            Maximum {MAX_SEATS} seats per booking reached.
            Deselect a seat to change your selection.
          </p>
        </div>
      )}

      <Link to={`/movies/${movie._id}`} style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
        ← {movie.title}
      </Link>

      {/* ── Screening Info Bar ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.35rem' }}>
            {movie.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {formatDateTime(screening.startTime)}
            {hall && <> · <strong style={{ color: 'var(--text)' }}>{hall.name}</strong></>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          <StatPill label="Per Seat" value={`$${price.toFixed(2)}`} color="var(--gold)" />
          <StatPill label="Available" value={isSoldOut ? 'SOLD OUT' : availableCount} color={isSoldOut ? 'var(--danger)' : 'var(--success)'} />
          <StatPill label="Capacity" value={totalSeats} color="var(--text-muted)" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '2rem', alignItems: 'start' }}>

        {/* ── Seat Map ── */}
        <div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { color: 'var(--seat-available)', label: 'Available' },
              { color: 'var(--seat-selected)', label: 'Selected' },
              { color: 'var(--seat-occupied)', label: 'Occupied' },
              { color: 'var(--seat-wheelchair)', label: 'Wheelchair' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '16px', height: '16px', background: color, borderRadius: '4px' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Screen arc */}
          <div style={{ maxWidth: '420px', margin: '0 auto 0.4rem' }}>
            <div style={{ height: '6px', background: 'linear-gradient(90deg, transparent, rgba(233,69,96,0.6), transparent)', borderRadius: '50% 50% 0 0' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: '2rem', fontWeight: '600' }}>
            SCREEN
          </p>

          {/* Seat Grid */}
          {hall && (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '5px', minWidth: 'max-content' }}>
                {Array.from({ length: hall.rows }, (_, r) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '20px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', flexShrink: 0 }}>
                      {ROW_LETTERS[r]}
                    </span>
                    {Array.from({ length: hall.columns }, (_, c) => {
                      const seatCode = `${ROW_LETTERS[r]}${c + 1}`
                      const isBooked = bookedSeats.includes(seatCode)
                      const isSelected = selectedSeats.includes(seatCode)
                      const isWheelchair = wheelchairSeats.includes(seatCode)
                      const isBlocked = atSeatLimit && !isSelected

                      let bg = isBooked ? 'var(--seat-occupied)'
                        : isSelected ? 'var(--seat-selected)'
                        : isWheelchair ? 'var(--seat-wheelchair)'
                        : 'var(--seat-available)'

                      return (
                        <button
                          key={seatCode}
                          title={
                            isBooked ? `${seatCode} — Taken` :
                            isBlocked ? `${seatCode} — Max ${MAX_SEATS} seats reached` :
                            `${seatCode}${isWheelchair ? ' ♿' : ''}`
                          }
                          onClick={() => !isBooked && !isSoldOut && toggleSeat(seatCode)}
                          disabled={isBooked || isSoldOut}
                          style={{
                            width: '30px', height: '30px', borderRadius: '6px',
                            border: isSelected ? '2px solid white' : '2px solid transparent',
                            background: bg,
                            color: isSelected ? '#1a1a00' : isBooked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                            fontSize: '0.58rem', fontWeight: '700', fontFamily: 'monospace',
                            cursor: (isBooked || isSoldOut) ? 'not-allowed' : isBlocked ? 'not-allowed' : 'pointer',
                            opacity: isBooked ? 0.5 : (isBlocked && !isSelected) ? 0.45 : 1,
                            transition: 'transform 0.1s',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { if (!isBooked && !isSoldOut) e.currentTarget.style.transform = 'scale(1.18)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          {c + 1}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No hall warning */}
          {!hall && (
            <div style={{ color: 'var(--danger)', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
              ⚠️ This screening does not have a hall assigned. Booking is unavailable.
            </div>
          )}
        </div>

        {/* ── Booking Panel ── */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)', margin: 0 }}>
                Your Selection
              </h3>
              {!isSoldOut && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                  Up to {MAX_SEATS} seats per booking
                </p>
              )}
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>

              {/* Sold-out state */}
              {isSoldOut ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ color: 'var(--danger)', fontWeight: '700', marginBottom: '0.5rem' }}>Sold Out</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No seats are available for this screening.</p>
                  <Link to={`/movies/${movie._id}`} style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--accent)', fontWeight: '600', fontSize: '0.88rem' }}>
                    ← Find another time
                  </Link>
                </div>
              ) : (
                <>
                  {/* Empty state */}
                  {selectedSeats.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '0.75rem 0' }}>
                      Click seats on the map to select them
                    </p>
                  )}

                  {/* Selected seats */}
                  {selectedSeats.length > 0 && (
                    <>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Selected Seats ({selectedSeats.length}/{MAX_SEATS})
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1.1rem' }}>
                        {selectedSeats.map(seat => (
                          <span
                            key={seat}
                            onClick={() => toggleSeat(seat)}
                            title="Click to deselect"
                            style={{
                              background: 'var(--seat-selected)', color: '#1a1a00',
                              padding: '0.2rem 0.5rem', borderRadius: '5px',
                              fontSize: '0.8rem', fontWeight: '700', fontFamily: 'monospace',
                              cursor: 'pointer',
                            }}
                          >{seat}</span>
                        ))}
                      </div>

                      {/* Price breakdown */}
                      <div style={{ background: 'var(--bg-card2)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          <span>{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} × ${price.toFixed(2)}</span>
                          <span style={{ color: 'var(--text)' }}>${totalPrice.toFixed(2)}</span>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '0.5rem' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                          <span style={{ color: 'var(--text)' }}>Total</span>
                          <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── NOT logged in ── */}
                  {!customer && (
                    <div>
                      {selectedSeats.length > 0 && (
                        <div style={{
                          background: 'rgba(233,69,96,0.08)',
                          border: '1px solid rgba(233,69,96,0.2)',
                          borderRadius: '10px', padding: '0.85rem',
                          marginBottom: '1rem', textAlign: 'center',
                        }}>
                          <p style={{ color: 'var(--text)', fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                            Sign in to complete your booking
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            Seats are not reserved until payment is confirmed
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          onClick={() => { setAuthTab('login'); setShowAuth(true) }}
                          disabled={selectedSeats.length === 0}
                          style={{
                            width: '100%', padding: '0.85rem',
                            background: selectedSeats.length === 0
                              ? 'rgba(255,255,255,0.04)'
                              : 'linear-gradient(135deg, #e94560, #c73652)',
                            color: selectedSeats.length === 0 ? 'var(--text-muted)' : 'white',
                            border: 'none', borderRadius: '10px',
                            fontWeight: '700', fontSize: '0.95rem',
                            cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
                            boxShadow: selectedSeats.length === 0 ? 'none' : '0 4px 16px rgba(233,69,96,0.3)',
                            fontFamily: 'inherit',
                          }}
                        >
                          {selectedSeats.length === 0 ? 'Select seats to continue' : 'Sign In to Book'}
                        </button>
                        {selectedSeats.length > 0 && (
                          <button
                            onClick={() => { setAuthTab('register'); setShowAuth(true) }}
                            style={{
                              width: '100%', padding: '0.65rem',
                              background: 'transparent', border: '1px solid var(--border)',
                              color: 'var(--text-muted)', borderRadius: '10px', cursor: 'pointer',
                              fontSize: '0.85rem', fontFamily: 'inherit',
                            }}
                          >
                            New here? Create a free account
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Logged in — ready to confirm ── */}
                  {customer && !showConfirm && (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px', padding: '0.65rem 0.85rem',
                        marginBottom: '1rem',
                      }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                          background: 'linear-gradient(135deg, #e94560, #c73652)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '800', fontSize: '0.7rem',
                        }}>
                          {customer.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ color: 'var(--text)', fontWeight: '600', fontSize: '0.82rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.name}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleProceed}
                        disabled={selectedSeats.length === 0}
                        style={{
                          width: '100%', padding: '0.85rem',
                          background: selectedSeats.length === 0
                            ? 'rgba(255,255,255,0.04)'
                            : 'linear-gradient(135deg, #e94560, #c73652)',
                          color: selectedSeats.length === 0 ? 'var(--text-muted)' : 'white',
                          border: 'none', borderRadius: '10px',
                          fontWeight: '700', fontSize: '0.95rem',
                          cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
                          boxShadow: selectedSeats.length === 0 ? 'none' : '0 4px 16px rgba(233,69,96,0.3)',
                          fontFamily: 'inherit',
                        }}
                      >
                        {selectedSeats.length === 0 ? 'Select seats to continue' : `Review & Book ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''}`}
                      </button>
                    </>
                  )}

                  {/* ── Confirm step ── */}
                  {customer && showConfirm && (
                    <div style={{ animation: 'popIn 0.2s ease' }}>
                      {bookingError && (
                        <div style={{
                          background: 'rgba(231,76,60,0.12)',
                          border: '1px solid rgba(231,76,60,0.3)',
                          borderRadius: '8px', padding: '0.75rem 0.9rem',
                          marginBottom: '1rem', fontSize: '0.82rem',
                          color: '#ff8080', lineHeight: '1.5',
                        }}>
                          ⚠️ {bookingError}
                        </div>
                      )}

                      <div style={{
                        background: 'rgba(46,204,113,0.06)',
                        border: '1px solid rgba(46,204,113,0.2)',
                        borderRadius: '10px', padding: '0.85rem',
                        marginBottom: '0.75rem', fontSize: '0.83rem',
                      }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Booking As
                        </p>
                        <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.15rem' }}>{customer.name}</p>
                        <p style={{ color: 'var(--text-muted)' }}>{customer.email}</p>
                      </div>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
                        Seats are not reserved until payment is confirmed
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          onClick={handleBook}
                          disabled={booking}
                          style={{
                            width: '100%', padding: '0.9rem',
                            background: booking ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #e94560, #c73652)',
                            color: booking ? 'var(--text-muted)' : 'white',
                            border: 'none', borderRadius: '10px',
                            fontWeight: '700', fontSize: '0.95rem',
                            cursor: booking ? 'not-allowed' : 'pointer',
                            boxShadow: booking ? 'none' : '0 4px 20px rgba(233,69,96,0.35)',
                            fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          }}
                        >
                          {booking ? (
                            <>
                              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                              Processing...
                            </>
                          ) : `Confirm & Pay $${totalPrice.toFixed(2)}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowConfirm(false); setBookingError(null) }}
                          disabled={booking}
                          style={{
                            width: '100%', padding: '0.65rem',
                            background: 'transparent', border: '1px solid var(--border)',
                            color: 'var(--text-muted)', borderRadius: '10px',
                            cursor: booking ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem', fontFamily: 'inherit',
                          }}
                        >
                          ← Change Seats
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{label}</p>
      <p style={{ fontWeight: '800', color, fontSize: '1rem', margin: 0 }}>{value}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
