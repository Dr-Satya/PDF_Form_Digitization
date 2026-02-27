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
  const [forms, setForms] = useState([])
  const [newFormName, setNewFormName] = useState('')

  useEffect(() => {

    if (token) {

      localStorage.setItem('token', token)

    } else {

      localStorage.removeItem('token')

    }

  }, [token])

  const handleSchemaFieldChange = (sectionIndex, fieldIndex, changes) => {

    setSchema((prev) => {

      if (!prev) return prev

      const next = { ...prev }
      const sections = Array.isArray(next.sections) ? [...next.sections] : []
      const section = { ...sections[sectionIndex] }
      const fields = Array.isArray(section.fields) ? [...section.fields] : []
      const field = { ...fields[fieldIndex], ...changes }
      fields[fieldIndex] = field
      section.fields = fields
      sections[sectionIndex] = section
      next.sections = sections
      return next

    })

  }

  const handleSchemaNameChange = (value) => {

    setSchema((prev) => {

      if (!prev) return prev
      return { ...prev, name: value }

    })

  }

  const handleSaveSchema = async () => {

    if (!formId || !schema) return

    const response = await fetch(`http://localhost:8000/api/forms/${formId}/schema`, {

      method: 'PUT',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`

      },

      body: JSON.stringify({ schema })

    })

    const data = await response.json()

    if (response.ok) {

      alert('Form saved')

      await loadForms()

    } else {

      alert('Save failed: ' + (data?.error || 'Unknown error'))

    }

  }

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

  const loadForms = async () => {

    if (!token) return

    const response = await fetch('http://localhost:8000/api/forms', {

      headers: {

        Authorization: `Bearer ${token}`

      }

    })

    const data = await response.json()

    if (response.ok) {

      setForms(data.forms || [])

    }

  }

  const loadFormDetails = async (targetFormId, selectedForm = null) => {

    if (!targetFormId) return

    const schemaResponse = await fetch(`http://localhost:8000/api/forms/${targetFormId}`, {

      headers: {

        Authorization: `Bearer ${token}`

      }

    })

    const schemaData = await schemaResponse.json()

    if (schemaResponse.ok) {

      setSchema(schemaData.schema)

    }

    await refreshSubmissions(targetFormId)

    const selected = selectedForm || (forms || []).find((f) => String(f.id) === String(targetFormId))

    if (selected && selected.status === 'active' && selected.public_slug) {

      setShareUrl(`${window.location.origin}/public/${selected.public_slug}`)

    } else {

      setShareUrl(null)

    }

  }

  useEffect(() => {

    if (!token) {

      setForms([])

      return

    }

    loadForms()

  }, [token])

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

      await loadForms()

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

      await loadForms()

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

    setForms([])

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

    if (newFormName.trim()) {

      formData.append('form_name', newFormName.trim())

    }

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

        setNewFormName('')

        await refreshSubmissions(data.form_id)

        await loadForms()

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

              setFormId(null)

              setSchema(null)

              setShareUrl(null)

              setSubmissions([])

              setForms([])

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

        <input

          type="text"

          placeholder="Form name (optional)"

          value={newFormName}

          onChange={(e) => setNewFormName(e.target.value)}

          style={{ marginRight: '8px' }}

        />

        <input type="file" name="file" accept=".pdf" required />

        <button type="submit">Upload PDF</button>

      </form>

      <div>

        <h2>Your Forms</h2>

        {forms.length === 0 ? (

          <p>No forms yet.</p>

        ) : (

          <select

            value={formId || ''}

            onChange={async (e) => {

              const selectedId = e.target.value

              if (!selectedId) return

              const selectedForm = (forms || []).find((f) => String(f.id) === String(selectedId))

              setFormId(selectedId)

              setSchema(null)

              setShareUrl(null)

              setSubmissions([])

              await loadFormDetails(selectedId, selectedForm)

            }}

          >

            <option value="">Select a form</option>

            {forms.map((f) => (

              <option key={f.id} value={f.id}>

                {(f.name && String(f.name).trim()) ? String(f.name) : `${String(f.id).slice(0, 8)}...`} ({f.status})

              </option>

            ))}

          </select>

        )}

      </div>

      {formId && (

        <div>

          <button onClick={handleActivate}>Activate & Generate Share URL</button>

          <button onClick={handleDeactivate} style={{ marginLeft: '8px' }}>Deactivate</button>

        </div>

      )}

      {shareUrl && <p>Share this URL: <a href={shareUrl} target="_blank">{shareUrl}</a></p>}

      {schema && (

        <div>

          <h2>Edit Form</h2>

          <div style={{ marginBottom: '12px' }}>

            <label style={{ marginRight: '8px' }}>Form Name:</label>

            <input

              type="text"

              value={schema.name || ''}

              onChange={(e) => handleSchemaNameChange(e.target.value)}

            />

          </div>

          {schema.sections?.map((section, sectionIndex) => (

            <div key={sectionIndex} style={{ border: '1px solid #ddd', padding: '12px', marginBottom: '12px' }}>

              <h3>{section.title}</h3>

              {section.fields?.map((field, fieldIndex) => (

                <div key={fieldIndex} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>

                  <input

                    type="text"

                    value={field.label || ''}

                    onChange={(e) => handleSchemaFieldChange(sectionIndex, fieldIndex, { label: e.target.value })}

                    style={{ flex: 1 }}

                  />

                  <label>

                    <input

                      type="checkbox"

                      checked={!!field.required}

                      onChange={(e) => handleSchemaFieldChange(sectionIndex, fieldIndex, { required: e.target.checked })}

                      style={{ marginRight: '6px' }}

                    />

                    Required

                  </label>

                </div>

              ))}

            </div>

          ))}

          <button onClick={handleSaveSchema}>Save Form</button>

        </div>

      )}

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
