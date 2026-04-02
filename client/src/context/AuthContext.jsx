import { createContext, useContext, useState, useEffect } from 'react'

const API = 'http://localhost:3000'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cv_token')
    if (!token) { setAuthLoading(false); return }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCustomer({ ...data, token })
        else localStorage.removeItem('cv_token')
      })
      .catch(() => localStorage.removeItem('cv_token'))
      .finally(() => setAuthLoading(false))
  }, [])

  const login = (customerData, token) => {
    localStorage.setItem('cv_token', token)
    setCustomer({ ...customerData, token })
  }

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
