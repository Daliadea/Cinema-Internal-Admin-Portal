import { createContext, useContext, useState, useEffect } from 'react'

const API = 'http://localhost:3000'
const AuthContext = createContext(null)

// AuthProvider wraps the whole app and provides login state to every component.
// Any component can call useAuth() to get: customer, login, logout, authLoading.
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)  // null = not logged in
  const [authLoading, setAuthLoading] = useState(true)

  // On first load: check localStorage for a saved JWT.
  // If found, verify it with the server (/api/auth/me).
  // If valid, restore the session; if not, clear the stale token.
  useEffect(() => {
    const token = localStorage.getItem('cv_token')
    if (!token) { setAuthLoading(false); return }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCustomer({ ...data, token })
        else localStorage.removeItem('cv_token')  // token invalid or expired
      })
      .catch(() => localStorage.removeItem('cv_token'))
      .finally(() => setAuthLoading(false))
  }, [])

  // Called after successful login/register API response
  const login = (customerData, token) => {
    localStorage.setItem('cv_token', token)  // persist JWT across page refreshes
    setCustomer({ ...customerData, token })
  }

  // Clears session — removes JWT from storage and nulls out customer state
  const logout = () => {
    localStorage.removeItem('cv_token')
    setCustomer(null)
  }

  return (
    <AuthContext.Provider value={{ customer, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
