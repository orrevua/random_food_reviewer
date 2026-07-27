import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { getProfile } from './lib/db'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CategoryDetail from './pages/CategoryDetail'
import EstablishmentDetail from './pages/EstablishmentDetail'
import ReviewPage from './pages/ReviewPage'
import Join from './pages/Join'
import Profile from './pages/Profile'

function Shell() {
  const { session, loading, signOut, user } = useAuth()
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setDisplayName(null)
      return
    }
    let cancelled = false
    getProfile(user.id)
      .then((p) => {
        if (!cancelled) setDisplayName(p?.display_name ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) {
    return (
      <div className="auth-shell">
        <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
      </div>
    )
  }
  if (!session) return <Login />

  return (
    <BrowserRouter>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-brand">
            <span aria-hidden>🍜</span>
            <span>Food Reviewer</span>
          </Link>
          <div className="user-chip">
            <Link to="/profile" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
              {displayName ?? user?.email}
            </Link>
            <button type="button" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/category/:id" element={<CategoryDetail />} />
          <Route path="/establishment/:id" element={<EstablishmentDetail />} />
          <Route path="/establishment/:id/review" element={<ReviewPage />} />
          <Route path="/join/:id" element={<Join />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
