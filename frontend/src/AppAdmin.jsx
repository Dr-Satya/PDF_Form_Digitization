import { useEffect, useMemo, useState } from 'react'
import Footer from './Footer'

function AppAdmin() {
  const [token, setToken] = useState(localStorage.getItem('appAdminToken'))
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')

  useEffect(() => {
    if (token) localStorage.setItem('appAdminToken', token)
    else localStorage.removeItem('appAdminToken')
  }, [token])

  const authHeader = useMemo(() => {
    if (!token) return null
    return { Authorization: `Bearer ${token}` }
  }, [token])

  const loadAdmins = async () => {
    if (!authHeader) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/app-admin/admins', {
        headers: authHeader
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to load admins')
        setAdmins([])
        setLoading(false)
        return
      }
      setAdmins(Array.isArray(data?.admins) ? data.admins : [])
    } catch {
      setError('Failed to load admins')
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    const form = e.target
    const email = form.email.value
    const password = form.password.value

    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/app-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Login failed')
        setLoading(false)
        return
      }
      setToken(data?.access_token)
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setAdmins([])
    setNewAdminEmail('')
    setNewAdminPassword('')
    setError('')
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!authHeader) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/app-admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create admin')
        setLoading(false)
        return
      }
      setNewAdminEmail('')
      setNewAdminPassword('')
      await loadAdmins()
    } catch {
      setError('Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (adminId) => {
    if (!authHeader) return
    const newPassword = window.prompt('Enter a new password for this admin:')
    if (!newPassword) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`http://localhost:8000/api/app-admin/admins/${adminId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({ password: newPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to reset password')
        setLoading(false)
        return
      }
    } catch {
      setError('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div>
          <form className="auth-card" onSubmit={handleLogin}>
            <div className="brand-lockup">
              <img className="brand-logo" src="/Pragyanovation_Logo.jpg" alt="Pragyanovation" />
              <div className="brand-text">
                <h1>App Administrator</h1>
              </div>
            </div>
            <p>Sign in to manage admin users.</p>
            {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
            <label className="form-group">
              <span>Email</span>
              <input type="email" name="email" required aria-required="true" />
            </label>
            <label className="form-group">
              <span>Password</span>
              <input type="password" name="password" required aria-required="true" />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <aside className="sidebar" aria-label="App administrator navigation">
        <div className="sidebar-header">
          <div className="brand-lockup">
            <img className="brand-logo" src="/Pragyanovation_Logo.jpg" alt="Pragyanovation" />
            <div className="brand-text">
              <h1>PDF Digitization</h1>
              <p>App Administrator</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn btn-neutral" onClick={loadAdmins} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="main-header">
          <div>
            <p className="eyebrow">Superuser</p>
            <h2>Admin User Management</h2>
            <p>Create admin accounts and reset passwords.</p>
          </div>
        </header>

        <div className="content-area">
          <section className="card" aria-labelledby="create-admin-title">
            <div className="card-header">
              <h2 id="create-admin-title">Create Admin</h2>
              <p>Provision a new admin user who can manage forms and submissions.</p>
            </div>
            {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
            <form className="form-grid" onSubmit={handleCreateAdmin}>
              <label className="form-group">
                <span>Email</span>
                <input value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required />
              </label>
              <label className="form-group">
                <span>Temporary Password</span>
                <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required />
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </section>

          <section className="card" aria-labelledby="admins-title">
            <div className="card-header">
              <h2 id="admins-title">Existing Admins</h2>
              <p>Reset passwords for admin users.</p>
            </div>

            {loading ? (
              <div className="empty-state">
                <p>Loading…</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="empty-state">
                <p>No admins found.</p>
              </div>
            ) : (
              <ul className="list">
                {admins.map((admin) => (
                  <li key={admin.id} className="list-item">
                    <div>
                      <p className="list-title">{admin.email}</p>
                      <p className="list-meta">{admin.id}</p>
                    </div>
                    <div className="list-actions">
                      <button className="btn btn-danger" onClick={() => handleResetPassword(admin.id)}>
                        Reset Password
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <Footer />
      </main>
    </div>
  )
}

export default AppAdmin
