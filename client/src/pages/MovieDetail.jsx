import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { isValidPosterUrl } from '../utils/posterUrl'

const API = 'http://localhost:3000'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })
}

function StarRating({ rating }) {
  const stars = Math.round(rating / 2)
  return (
    <span>
      <span style={{ color: 'var(--gold)' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
      <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>{rating}/10</span>
    </span>
  )
}

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMovie()
  }, [id])

  async function fetchMovie() {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/movies/${id}`)
      if (!res.ok) throw new Error('Movie not found')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <p>{error}</p>
      <Link to="/" style={{ color: 'var(--accent)', marginTop: '1rem', display: 'inline-block' }}>← Back to Movies</Link>
    </div>
  )

  const { movie, screenings } = data
  const hasPoster = isValidPosterUrl(movie.posterUrl)

  // Group screenings by date
  const grouped = screenings.reduce((acc, s) => {
    const day = new Date(s.startTime).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(s)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
        ← Back to Movies
      </Link>

      {/* Movie Hero */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: hasPoster ? '220px 1fr' : '1fr',
        gap: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '2rem',
      }}>
        {hasPoster && (
          <div style={{ height: '320px', overflow: 'hidden' }}>
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => e.target.style.display = 'none'}
            />
          </div>
        )}
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              background: movie.status === 'coming_soon' ? 'rgba(245,197,24,0.15)' : 'rgba(46,204,113,0.15)',
              border: `1px solid ${movie.status === 'coming_soon' ? 'var(--gold)' : 'var(--success)'}`,
              color: movie.status === 'coming_soon' ? 'var(--gold)' : 'var(--success)',
              padding: '0.2rem 0.7rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {movie.status === 'coming_soon' ? 'Coming Soon' : 'Now Showing'}
            </span>
            {movie.genre && (
              <span style={{
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '0.2rem 0.7rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
              }}>{movie.genre}</span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text)' }}>
            {movie.title}
          </h1>

          <div style={{ marginBottom: '1rem' }}>
            <StarRating rating={movie.rating} />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</span>
              <p style={{ fontWeight: '600', marginTop: '0.2rem' }}>{movie.duration} min</p>
            </div>
            {movie.genre && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genre</span>
                <p style={{ fontWeight: '600', marginTop: '0.2rem' }}>{movie.genre}</p>
              </div>
            )}
          </div>

          {movie.description && (
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem' }}>{movie.description}</p>
          )}
        </div>
      </div>

      {/* Screenings */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text)' }}>
        {screenings.length > 0 ? 'Available Screenings' : 'No Upcoming Screenings'}
      </h2>

      {screenings.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎭</div>
          {movie.status === 'coming_soon'
            ? <p>This movie is coming soon. Screenings will be added shortly.</p>
            : <p>No upcoming screenings available. Please check back later.</p>
          }
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([day, dayScreenings]) => (
            <div key={day}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}>
                <span style={{
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '0.3rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                }}>{formatDate(dayScreenings[0].startTime)}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {dayScreenings.map(screening => {
                  const totalSeats = screening.hall ? screening.hall.rows * screening.hall.columns : 0
                  const booked = (screening.bookedSeats || []).length
                  const available = totalSeats - booked
                  const soldOut = available <= 0

                  return (
                    <button
                      key={screening._id}
                      onClick={() => !soldOut && navigate(`/screenings/${screening._id}/seats`)}
                      disabled={soldOut}
                      style={{
                        background: soldOut ? 'var(--bg-card2)' : 'var(--bg-card)',
                        border: '1px solid',
                        borderColor: soldOut ? 'var(--border)' : 'var(--accent)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        cursor: soldOut ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        opacity: soldOut ? 0.6 : 1,
                        transition: 'all 0.2s',
                        minWidth: '160px',
                      }}
                      onMouseEnter={e => { if (!soldOut) e.currentTarget.style.background = 'rgba(233,69,96,0.08)' }}
                      onMouseLeave={e => { if (!soldOut) e.currentTarget.style.background = 'var(--bg-card)' }}
                    >
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: soldOut ? 'var(--text-muted)' : 'var(--text)', marginBottom: '0.3rem' }}>
                        {formatTime(screening.startTime)}
                      </div>
                      {screening.hall && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          {screening.hall.name}
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: soldOut ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>
                        {soldOut ? 'SOLD OUT' : `${available} seats left`}
                      </div>
                      {!soldOut && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          ${screening.price?.toFixed(2) || '12.00'} / seat
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
