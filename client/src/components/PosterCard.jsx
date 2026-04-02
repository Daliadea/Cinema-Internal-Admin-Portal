import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isValidPosterUrl } from '../utils/posterUrl'

const GRADIENTS = [
  'linear-gradient(160deg,#1a0a2e 0%,#6a1a3a 100%)',
  'linear-gradient(160deg,#0a1628 0%,#1a3a6a 100%)',
  'linear-gradient(160deg,#1a0a0a 0%,#6a1a1a 100%)',
  'linear-gradient(160deg,#0a1a0a 0%,#1a4a2a 100%)',
  'linear-gradient(160deg,#1a1a0a 0%,#4a3a0a 100%)',
  'linear-gradient(160deg,#0a0a1a 0%,#2a1a4a 100%)',
]

export default function PosterCard({ movie, index = 0 }) {
  const [hovered, setHovered] = useState(false)
  const hasPoster = isValidPosterUrl(movie.posterUrl)
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const coming = movie.status === 'coming_soon'

  return (
    <Link to={`/movies/${movie._id}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'block', width: '160px' }}>
      <div
        style={{
          width: '160px', borderRadius: '12px', overflow: 'hidden',
          border: `1px solid ${hovered ? (coming ? 'rgba(245,197,24,0.35)' : 'rgba(233,69,96,0.35)') : 'rgba(255,255,255,0.06)'}`,
          transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
          transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          boxShadow: hovered
            ? (coming ? '0 16px 40px rgba(245,197,24,0.2)' : '0 16px 40px rgba(233,69,96,0.22)')
            : '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Poster image */}
        <div style={{ height: '235px', position: 'relative', background: gradient, overflow: 'hidden' }}>
          {hasPoster ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.4s ease, filter 0.3s ease',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                filter: hovered ? 'brightness(0.65)' : 'brightness(1)',
              }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>🎬</span>
            </div>
          )}

          {/* Status badge — only Coming Soon needs labelling here (Now Showing is implied) */}
          {coming && (
            <div style={{
              position: 'absolute', bottom: '0.55rem', left: '0.55rem',
              background: 'rgba(245,197,24,0.92)',
              color: '#1a1200',
              padding: '0.18rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.62rem', fontWeight: '800',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Soon</div>
          )}

          {/* Rating pill */}
          <div style={{
            position: 'absolute', top: '0.5rem', right: '0.5rem',
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            color: '#f5c518', fontSize: '0.7rem', fontWeight: '700',
            padding: '0.2rem 0.45rem', borderRadius: '6px',
          }}>
            ★ {movie.rating}
          </div>

          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 55%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0.75rem',
          }}>
            <span style={{
              color: coming ? '#f5c518' : '#e94560',
              fontSize: '0.75rem', fontWeight: '700',
              transform: hovered ? 'translateY(0)' : 'translateY(5px)',
              transition: 'transform 0.25s ease',
            }}>
              {coming ? 'Learn More →' : 'Book Now →'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: '0.65rem 0.75rem 0.75rem', background: 'var(--bg-card)' }}>
          <p style={{
            fontSize: '0.82rem', fontWeight: '700', color: 'var(--text)',
            lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0,
          }}>{movie.title}</p>
          {movie.genre && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>
              {movie.genre}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
