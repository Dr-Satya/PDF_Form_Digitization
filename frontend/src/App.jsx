import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PDFViewer from './PDFViewer'
import DynamicForm from './DynamicForm'
import PublicForm from './PublicForm'

function AppContent() {
  const [count, setCount] = useState(0)
  const [formId, setFormId] = useState(null)
  const [schema, setSchema] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [shareUrl, setShareUrl] = useState(null)
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {

    if (token) {

      localStorage.setItem('token', token)

    } else {

      localStorage.removeItem('token')

    }

  }, [token])

  useEffect(() => {

    if (!formId || !token) return

    const handleFocus = () => {

      refreshSubmissions(formId)

    }

    window.addEventListener('focus', handleFocus)

    return () => {

      window.removeEventListener('focus', handleFocus)

    }

  }, [formId, token])

  const handleLogin = (newToken) => {

    setToken(newToken)

  }

  const handleActivate = async () => {

    if (!formId) return

    const response = await fetch(`http://localhost:8000/api/forms/${formId}/activate`, {

      method: 'POST',

      headers: {

        Authorization: `Bearer ${token}`

      }

    })

    const data = await response.json()

    if (response.ok) {

      setShareUrl(`${window.location.origin}/public/${data.public_slug}`)

    } else {

      const details = data?.details ? `\nDetails: ${data.details}` : ''
      alert('Activate failed: ' + (data?.error || 'Unknown error') + details)

    }

  }

  const handleDeactivate = async () => {

    if (!formId) return

    const response = await fetch(`http://localhost:8000/api/forms/${formId}/deactivate`, {

      method: 'POST',

      headers: {

        Authorization: `Bearer ${token}`

      }

    })

    const data = await response.json()

    if (response.ok) {

      setShareUrl(null)

      alert('Form deactivated')

    } else {

      const details = data?.details ? `\nDetails: ${data.details}` : ''
      alert('Deactivate failed: ' + (data?.error || 'Unknown error') + details)

    }

  }

  const handleLogout = () => {

    setToken(null)

    setFormId(null)

    setSchema(null)

    setShareUrl(null)

    setSubmissions([])

  }

  const refreshSubmissions = async (targetFormId = formId) => {

    if (!targetFormId) return

    const response = await fetch(`http://localhost:8000/api/forms/${targetFormId}/submissions`, {

      headers: {

        Authorization: `Bearer ${token}`

      }

    })

    const data = await response.json()

    if (response.ok) {

      setSubmissions(data.submissions || [])

    }

  }

  const handleUpload = async (e) => {

    e.preventDefault()

    const formData = new FormData()

    formData.append('file', e.target.elements.file.files[0])

    try {

      const response = await fetch('http://localhost:8000/api/forms/upload', {

        method: 'POST',

        headers: {

          Authorization: `Bearer ${token}`

        },

        body: formData,

      })

      const data = await response.json()

      if (response.ok) {

        setFormId(data.form_id)

        setShareUrl(null)

        setSubmissions([])

        const schemaResponse = await fetch(`http://localhost:8000/api/forms/${data.form_id}`, {

          headers: {

            Authorization: `Bearer ${token}`

          }

        })

        const schemaData = await schemaResponse.json()

        setSchema(schemaData.schema)

        await refreshSubmissions(data.form_id)

      } else {

        const details = data?.details ? `\nDetails: ${data.details}` : ''
        alert('Upload failed: ' + (data?.error || 'Unknown error') + details)

      }

    } catch (error) {

      alert('Upload error: ' + error.message)

    }

  }

  const handleSubmitForm = async (filledData) => {

    await fetch(`http://localhost:8000/api/forms/${formId}/submit`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ filled_data: filledData }),

    })

    alert('Form submitted successfully!')

    await refreshSubmissions(formId)

  }

  if (!token) {

    return (

      <div>

        <h1>Admin Login</h1>

        <form onSubmit={(e) => {

          e.preventDefault()

          const email = e.target.email.value

          const password = e.target.password.value

          fetch('http://localhost:8000/api/admin/login', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ email, password }),

          })

          .then(res => res.json())

          .then(data => {

            if (data.access_token) {

              setToken(data.access_token)

            } else {

              alert(data.error)

            }

          })

        }}>

          <input name="email" type="email" placeholder="Email" required />

          <input name="password" type="password" placeholder="Password" required />

          <button type="submit">Login</button>

        </form>

      </div>

    )

  }

  return (

    <>

      <div>

        <a href="https://vite.dev" target="_blank">

          <img src={viteLogo} className="logo" alt="Vite logo" />

        </a>

        <a href="https://react.dev" target="_blank">

          <img src={reactLogo} className="logo react" alt="React logo" />

        </a>

      </div>

      <h1>PDF Form Digitization - Admin</h1>

      <button onClick={handleLogout}>Logout</button>

      <PDFViewer />

      <form onSubmit={handleUpload}>

        <input type="file" name="file" accept=".pdf" required />

        <button type="submit">Upload PDF</button>

      </form>

      {formId && (

        <div>

          <button onClick={handleActivate}>Activate & Generate Share URL</button>

          <button onClick={handleDeactivate} style={{ marginLeft: '8px' }}>Deactivate</button>

        </div>

      )}

      {shareUrl && <p>Share this URL: <a href={shareUrl} target="_blank">{shareUrl}</a></p>}

      {schema && <DynamicForm schema={schema} onSubmit={handleSubmitForm} />}

      {formId && (

        <div>

          <h2>Submissions</h2>

          <button onClick={() => refreshSubmissions()}>Refresh Submissions</button>

          {submissions.length === 0 ? (

            <p>No submissions yet.</p>

          ) : (

            <ul>

              {submissions.map((sub) => (

                <li key={sub.id}>

                  {new Date(sub.submitted_at).toLocaleString()} 

                  <button style={{ marginLeft: '8px' }} onClick={() => alert(JSON.stringify(sub.filled_data, null, 2))}>View</button>

                </li>

              ))}

            </ul>

          )}

        </div>

      )}

      <div className="card">

        <button onClick={() => setCount((count) => count + 1)}>

          count is {count}

        </button>

        <p>

          Edit <code>src/App.jsx</code> and save to test HMR

        </p>

      </div>

      <p className="read-the-docs">

        Click on the Vite and React logos to learn more

      </p>

    </>

  )

}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/public/:slug" element={<PublicForm />} />
      </Routes>
    </Router>
  )
}

export default App
