import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard'

const API = 'http://localhost:3000'

const TAB_CONFIG = {
  now_showing: {
    label: 'Now Showing',
    accent: '#e94560',
    accentAlpha: 'rgba(233,69,96,0.12)',
    accentBorder: 'rgba(233,69,96,0.25)',
    dot: '#e94560',
    badge: 'rgba(46,204,113,0.15)',
    badgeColor: '#2ecc71',
    description: 'Book your seats for films on screen right now',
    emptyMsg: 'No movies are currently showing. Check back soon!',
  },
  coming_soon: {
    label: 'Coming Soon',
    accent: '#f5c518',
    accentAlpha: 'rgba(245,197,24,0.1)',
    accentBorder: 'rgba(245,197,24,0.25)',
    dot: '#f5c518',
    badge: 'rgba(245,197,24,0.12)',
    badgeColor: '#f5c518',
    description: 'Upcoming films arriving at CineVillage',
    emptyMsg: 'No upcoming movies announced yet. Stay tuned!',
  },
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [tab, setTab] = useState(searchParams.get('tab') || 'now_showing')
  const [genre, setGenre] = useState(searchParams.get('genre') || 'all')
  const searchRef = useRef(null)

  useEffect(() => { fetchMovies() }, [])

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus()
  }, [])

  async function fetchMovies() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/movies`)
      setMovies(res.ok ? await res.json() : [])
    } catch {
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  // Sync into URL (omit defaults so URLs stay clean)
  useEffect(() => {
    const params = {}
    if (tab !== 'now_showing') params.tab = tab
    if (genre !== 'all') params.genre = genre
    if (search) params.q = search
    setSearchParams(params, { replace: true })
  }, [tab, genre, search])

  const genres = [...new Set(movies.filter(m => m.status === tab).map(m => m.genre).filter(Boolean))].sort()

  const filtered = movies.filter(m => {
    const matchTab  = m.status === tab
    const matchGenre = genre === 'all' || m.genre === genre
    const matchSearch = !search.trim() || m.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchGenre && matchSearch
  })

  const TABS = [
    { key: 'now_showing', count: movies.filter(m => m.status === 'now_showing').length },
    { key: 'coming_soon', count: movies.filter(m => m.status === 'coming_soon').length },
  ]

  const cfg = TAB_CONFIG[tab]

  return (
    <div>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{
        background: `linear-gradient(180deg, ${cfg.accentAlpha} 0%, transparent 100%)`,
        borderBottom: '1px solid var(--border)',
        padding: '2.5rem 2rem 0',
        transition: 'background 0.3s',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)', marginBottom: '0.3rem' }}>
                Browse Movies
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', transition: 'color 0.2s' }}>
                {cfg.description}
              </p>
            </div>

            {/* Live count pill */}
            {!loading && (
              <div style={{
                background: cfg.accentAlpha,
                border: `1px solid ${cfg.accentBorder}`,
                borderRadius: '20px',
                padding: '0.35rem 1rem',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: cfg.accent,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                alignSelf: 'flex-start',
                marginTop: '0.25rem',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.dot, display: 'inline-block', animation: tab === 'now_showing' ? 'shimmer 1.5s ease-in-out infinite' : 'none' }} />
                {filtered.length} {filtered.length === 1 ? 'film' : 'films'}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: '560px', marginBottom: '1.5rem' }}>
            <span style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '0.95rem' }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: `1.5px solid var(--border)`,
                color: 'var(--text)',
                padding: '0.85rem 2.75rem 0.85rem 3rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = cfg.accent; e.target.style.boxShadow = `0 0 0 3px ${cfg.accentAlpha}` }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.2rem' }}
              >✕</button>
            )}
          </div>

          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)' }}>
            {TABS.map(({ key, count }) => {
              const t = TAB_CONFIG[key]
              const active = tab === key
              return (
                <button
                  key={key}
                  onClick={() => { setTab(key); setGenre('all') }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'none', border: 'none',
                    borderBottom: active ? `2.5px solid ${t.accent}` : '2.5px solid transparent',
                    color: active ? '#e8e8f0' : 'var(--text-muted)',
                    fontWeight: active ? '700' : '500',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.55rem',
                    fontFamily: 'inherit',
                    marginBottom: '-1px',
                  }}
                >
                  {t.label}
                  <span style={{
                    background: active ? t.accentAlpha : 'rgba(255,255,255,0.04)',
                    color: active ? t.accent : 'var(--text-muted)',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                  }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Filter / sort bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genre</span>
            {/* Genre pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['all', ...genres].map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  style={{
                    padding: '0.3rem 0.85rem',
                    background: genre === g ? cfg.accentAlpha : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${genre === g ? cfg.accentBorder : 'var(--border)'}`,
                    color: genre === g ? cfg.accent : 'var(--text-muted)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: genre === g ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g === 'all' ? 'All Genres' : g}
                </button>
              ))}
            </div>
            {(genre !== 'all' || search) && (
              <button
                onClick={() => { setGenre('all'); setSearch('') }}
                style={{ background: 'none', border: 'none', color: cfg.accent, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', padding: '0.3rem 0.5rem' }}
              >
                Clear
              </button>
            )}
          </div>

          {!loading && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              {filtered.length} <span style={{ color: 'var(--text)' }}>result{filtered.length !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState search={search} cfg={cfg} onClear={() => { setSearch(''); setGenre('all') }} />
        ) : (
          <div
            key={tab}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
              gap: '1.4rem',
              animation: 'fadeUp 0.25s ease',
            }}
          >
            {filtered.map((movie, i) => (
              <MovieCard key={movie._id} movie={movie} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '1.4rem' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ height: '290px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          <div style={{ padding: '1rem', background: 'var(--bg-card)' }}>
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '0.5rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            <div style={{ height: '11px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', width: '60%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search, cfg, onClear }) {
  return (
    <div style={{
      textAlign: 'center', padding: '5rem 2rem',
      background: cfg.accentAlpha,
      border: `1px dashed ${cfg.accentBorder}`,
      borderRadius: '16px',
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎭</div>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
        {search ? `No results for "${search}"` : 'Nothing here yet'}
      </h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
        {search ? 'Try a different title or clear your search' : cfg.emptyMsg}
      </p>
      {(search) && (
        <button
          onClick={onClear}
          style={{
            background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`,
            color: cfg.accent === '#f5c518' ? '#1a1a00' : 'white',
            border: 'none', padding: '0.65rem 1.75rem',
            borderRadius: '10px', fontWeight: '700', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.9rem',
          }}
        >
          Clear Search
        </button>
      )}
    </div>
  )
}
