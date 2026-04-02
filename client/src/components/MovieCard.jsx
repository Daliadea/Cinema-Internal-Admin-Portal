import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isValidPosterUrl } from '../utils/posterUrl'

const FALLBACK_COLORS = [
  'linear-gradient(160deg, #1a1a4e 0%, #4a1a2e 100%)',
  'linear-gradient(160deg, #0f2027 0%, #1a3a43 100%)',
  'linear-gradient(160deg, #200122 0%, #4f0000 100%)',
  'linear-gradient(160deg, #0f0c29 0%, #241e63 100%)',
  'linear-gradient(160deg, #1a1a2e 0%, #0f3460 100%)',
]

function StarRating({ rating }) {
  const stars = Math.round(rating / 2)
  return (
    <span style={{ color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '1px' }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.8rem' }}>
        {rating}/10
      </span>
    </span>
  )
}

const isComingSoon = (movie) => movie.status === 'coming_soon'

export default function MovieCard({ movie, index }) {
  const [hovered, setHovered] = useState(false)
  const hasPoster = isValidPosterUrl(movie.posterUrl)
  const fallback = FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  const coming = isComingSoon(movie)

  return (
    <Link to={`/movies/${movie._id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${hovered ? (coming ? 'rgba(245,197,24,0.4)' : 'rgba(233,69,96,0.4)') : 'var(--border)'}`,
          borderRadius: '14px',
          overflow: 'hidden',
          transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
          transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
          boxShadow: hovered
            ? (coming ? '0 14px 40px rgba(245,197,24,0.15)' : '0 14px 40px rgba(233,69,96,0.18)')
            : 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Poster */}
        <div style={{
          height: '290px',
          background: hasPoster ? '#000' : fallback,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {hasPoster ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.4s ease, filter 0.3s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                filter: hovered ? 'brightness(0.55)' : 'brightness(1)',
              }}
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = fallback }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              transition: 'filter 0.3s ease',
              filter: hovered ? 'brightness(0.6)' : 'brightness(1)',
            }}>
              <span style={{ fontSize: '3rem' }}>🎬</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', textAlign: 'center', padding: '0 1rem' }}>
                {movie.title}
              </span>
            </div>
          )}

          {/* Status badge */}
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: coming ? 'rgba(245,197,24,0.92)' : 'rgba(46,204,113,0.92)',
            color: coming ? '#1a1200' : '#003310',
            padding: '0.22rem 0.65rem',
            borderRadius: '20px',
            fontSize: '0.7rem', fontWeight: '800',
            letterSpacing: '0.6px', textTransform: 'uppercase',
            backdropFilter: 'blur(4px)',
            boxShadow: coming ? '0 2px 8px rgba(245,197,24,0.3)' : '0 2px 8px rgba(46,204,113,0.3)',
          }}>
            {coming ? '⏳ Coming Soon' : '▶ Now Showing'}
          </div>

          {/* Rating pill */}
          <div style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            color: '#f5c518', fontSize: '0.72rem', fontWeight: '700',
            padding: '0.22rem 0.55rem', borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '0.2rem',
          }}>
            ★ {movie.rating}
          </div>

          {/* Hover overlay CTA */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-end',
            padding: '1.25rem',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}>
            <div style={{
              background: coming
                ? 'linear-gradient(135deg, #f5c518, #e6b800)'
                : 'linear-gradient(135deg, #e94560, #c73652)',
              color: coming ? '#1a1200' : 'white',
              padding: '0.6rem 1.5rem',
              borderRadius: '10px',
              fontWeight: '700', fontSize: '0.88rem',
              boxShadow: coming
                ? '0 4px 16px rgba(245,197,24,0.4)'
                : '0 4px 16px rgba(233,69,96,0.4)',
              transform: hovered ? 'translateY(0)' : 'translateY(6px)',
              transition: 'transform 0.25s ease',
            }}>
              {coming ? 'View Details' : 'Book Now →'}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '1rem 1.1rem 1.15rem' }}>
          <h3 style={{
            fontSize: '0.98rem', fontWeight: '700', color: 'var(--text)',
            marginBottom: '0.45rem', lineHeight: '1.35',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{movie.title}</h3>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            {movie.genre && (
              <span style={{
                background: 'var(--bg-card2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', padding: '0.15rem 0.55rem',
                borderRadius: '20px', fontSize: '0.74rem',
              }}>{movie.genre}</span>
            )}
            <span style={{
              background: 'var(--bg-card2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '0.15rem 0.55rem',
              borderRadius: '20px', fontSize: '0.74rem',
            }}>{movie.duration} min</span>
          </div>

          <StarRating rating={movie.rating} />

          {movie.description && (
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.5',
              marginTop: '0.65rem', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{movie.description}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
