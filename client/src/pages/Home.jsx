import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PosterCard from '../components/PosterCard'
import { isValidPosterUrl } from '../utils/posterUrl'

const API = 'http://localhost:3000'

export default function Home() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API}/api/movies`)
      .then(r => r.ok ? r.json() : [])
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false))
  }, [])

  const nowShowing = movies.filter(m => m.status === 'now_showing')
  const comingSoon = movies.filter(m => m.status === 'coming_soon')
  const featured = nowShowing[0] || movies[0]
  const featuredHeroPoster = featured && isValidPosterUrl(featured.posterUrl)

  return (
    <div>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{opacity:.4} 50%{opacity:.8} 100%{opacity:.4} }
        .scroll-row { display:flex; gap:1rem; overflow-x:auto; padding-bottom:1rem; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; }
        .scroll-row::-webkit-scrollbar { height:3px; }
        .scroll-row::-webkit-scrollbar-track { background:transparent; }
        .scroll-row::-webkit-scrollbar-thumb { background:rgba(233,69,96,0.4); border-radius:2px; }
        .scroll-row > * { scroll-snap-align:start; }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a14 0%, #1a0614 50%, #0a0a14 100%)',
      }}>
        {/* Atmospheric background orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '5%', width: '50vw', height: '70vh', background: 'radial-gradient(ellipse, rgba(233,69,96,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '40vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(90,30,180,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
          {/* Film strip dots */}
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${12 + i * 10}%`,
              left: `${2 + (i % 2) * 3}%`,
              width: '6px', height: '6px',
              background: 'rgba(233,69,96,0.2)',
              borderRadius: '50%',
              animation: `shimmer ${2 + i * 0.3}s ease-in-out infinite`,
            }} />
          ))}
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', width: '100%', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: featuredHeroPoster ? '1fr auto' : '1fr', gap: '3rem', alignItems: 'center' }}>
          {/* Left: Text content */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: '30px', padding: '0.35rem 0.85rem', marginBottom: '1.5rem' }}>
              <span style={{ width: '7px', height: '7px', background: '#e94560', borderRadius: '50%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <span style={{ color: '#e94560', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Live Booking Open</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              fontWeight: '900',
              lineHeight: '1.1',
              marginBottom: '1.25rem',
              letterSpacing: '-0.5px',
            }}>
              <span style={{ color: '#e8e8f0' }}>The Best Seat</span>
              <br />
              <span style={{
                background: 'linear-gradient(90deg, #e94560 0%, #ff8fa0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>in the House.</span>
            </h1>

            <p style={{ color: '#8888a8', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '480px' }}>
              Discover the latest films, pick your perfect seat, and book in seconds — all without the queue.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/movies?tab=now_showing')}
                style={{
                  padding: '0.9rem 2.2rem',
                  background: 'linear-gradient(135deg, #e94560 0%, #c73652 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 30px rgba(233,69,96,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(233,69,96,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(233,69,96,0.4)' }}
              >
                Book Tickets
              </button>
              <button
                onClick={() => navigate('/movies')}
                style={{
                  padding: '0.9rem 2.2rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e8e8f0',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                Browse All Movies
              </button>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Now Showing', value: nowShowing.length || '—' },
                { label: 'Coming Soon', value: comingSoon.length || '—' },
                { label: 'Online Booking', value: '24/7' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: '800', color: '#e8e8f0', lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: '0.78rem', color: '#6a6a8a', marginTop: '0.35rem', fontWeight: '500' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Featured movie poster */}
          {featuredHeroPoster && (
            <div style={{ position: 'relative', flexShrink: 0, animation: 'float 4s ease-in-out infinite' }}>
              <div style={{ position: 'absolute', inset: '-12px', background: 'linear-gradient(135deg, rgba(233,69,96,0.3), rgba(90,30,180,0.2))', borderRadius: '22px', filter: 'blur(20px)' }} />
              <Link to={`/movies/${featured._id}`}>
                <img
                  src={featured.posterUrl}
                  alt={featured.title}
                  style={{ width: '220px', height: '330px', objectFit: 'cover', borderRadius: '16px', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
                  onError={e => e.target.style.display = 'none'}
                />
              </Link>
            </div>
          )}
        </div>

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(transparent, var(--bg))' }} />
      </section>

      {/* ── Now Showing ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '4px', height: '26px', background: 'linear-gradient(180deg, #e94560, #ff8fa0)', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e8e8f0' }}>Now Showing</h2>
            {!loading && (
              <span style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                {nowShowing.length} films
              </span>
            )}
          </div>
          <Link to="/movies?tab=now_showing" style={{ color: '#e94560', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            See all <span>→</span>
          </Link>
        </div>

        {loading ? (
          <CarouselSkeleton />
        ) : nowShowing.length === 0 ? (
          <EmptyCarousel message="No movies currently showing. Check back soon!" />
        ) : (
          <div className="scroll-row">
            {nowShowing.map((m, i) => <PosterCard key={m._id} movie={m} index={i} />)}
          </div>
        )}
      </section>

      {/* ── Divider ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
      </div>

      {/* ── Coming Soon ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '4px', height: '26px', background: 'linear-gradient(180deg, #f5c518, #ffdf70)', borderRadius: '2px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e8e8f0' }}>Coming Soon</h2>
            {!loading && comingSoon.length > 0 && (
              <span style={{ background: 'rgba(245,197,24,0.12)', color: '#f5c518', border: '1px solid rgba(245,197,24,0.3)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                {comingSoon.length} films
              </span>
            )}
          </div>
          <Link to="/movies?tab=coming_soon" style={{ color: '#f5c518', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            See all <span>→</span>
          </Link>
        </div>

        {loading ? (
          <CarouselSkeleton accent="#f5c518" />
        ) : comingSoon.length === 0 ? (
          <EmptyCarousel message="No upcoming movies yet. Stay tuned!" />
        ) : (
          <div className="scroll-row">
            {comingSoon.map((m, i) => <PosterCard key={m._id} movie={m} index={i} />)}
          </div>
        )}
      </section>

      {/* ── CTA banner ── */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(233,69,96,0.1) 0%, rgba(90,30,180,0.08) 100%)',
        borderTop: '1px solid rgba(233,69,96,0.15)',
        borderBottom: '1px solid rgba(233,69,96,0.15)',
        padding: '3rem 2rem',
        textAlign: 'center',
        margin: '1rem 0 0',
      }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '800', color: '#e8e8f0', marginBottom: '0.75rem' }}>
          Ready to watch something great?
        </h2>
        <p style={{ color: '#8888a8', marginBottom: '1.75rem', fontSize: '1rem' }}>
          Pick a movie, choose your seats, and you're set.
        </p>
        <button
          onClick={() => navigate('/movies')}
          style={{
            padding: '0.9rem 2.5rem',
            background: 'linear-gradient(135deg, #e94560, #c73652)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(233,69,96,0.35)',
            fontFamily: 'inherit',
          }}
        >
          Browse All Movies →
        </button>
      </section>
    </div>
  )
}

function CarouselSkeleton({ accent = '#e94560' }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ flexShrink: 0, width: '160px', borderRadius: '12px', overflow: 'hidden', opacity: 1 - i * 0.12 }}>
          <div style={{ height: '235px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.7rem' }}>
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '0.4rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyCarousel({ message }) {
  return (
    <div style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center', color: '#6a6a8a', fontSize: '0.9rem' }}>
      {message}
    </div>
  )
}
