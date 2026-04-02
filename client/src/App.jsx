import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import MovieDetail from './pages/MovieDetail'
import SeatSelection from './pages/SeatSelection'
import MyTickets from './pages/MyTickets'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Browse />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/screenings/:id/seats" element={<SeatSelection />} />
          <Route path="/my-tickets" element={<MyTickets />} />
        </Routes>
      </main>
      <footer style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}>
        © 2026 CineVillage · All rights reserved
      </footer>
    </AuthProvider>
  )
}
