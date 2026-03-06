import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import PDFViewer from './PDFViewer'
import DynamicForm from './DynamicForm'
import PublicForm from './PublicForm'

const IconUpload = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    <path d="M7 9l5-5 5 5" />
    <path d="M12 4v12" />
  </svg>
)

const IconForms = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 15h6" />
    <path d="M9 19h6" />
    <path d="M9 11h6" />
  </svg>
)

const IconEdit = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4z" />
  </svg>
)

const IconInbox = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 15V8a2 2 0 00-2-2H5a2 2 0 00-2 2v7" />
    <path d="M3 15l3-3h12l3 3" />
    <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
)

const IconTrash = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
  </svg>
)

const IconDownload = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
)

const IconCopy = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'upload', label: 'Upload PDF', icon: IconUpload },
  { key: 'forms', label: 'Manage Forms', icon: IconForms },
  { key: 'builder', label: 'Edit Form', icon: IconEdit },
  { key: 'submissions', label: 'Submissions', icon: IconInbox }
]

function AppContent() {
  const [count, setCount] = useState(0)
  const [formId, setFormId] = useState(null)
  const [schema, setSchema] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [shareUrl, setShareUrl] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState([])
  const [forms, setForms] = useState([])
  const [newFormName, setNewFormName] = useState('')
  const [activeTab, setActiveTab] = useState('upload')
  const [copyStatus, setCopyStatus] = useState('')

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
    setSchema((prev) => (prev ? { ...prev, name: value } : prev))
  }

  const handleSchemaAdminTextChange = (value) => {
    setSchema((prev) => (prev ? { ...prev, adminText: value } : prev))
  }

  const handleSchemaSectionChange = (sectionIndex, changes) => {
    setSchema((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const sections = Array.isArray(next.sections) ? [...next.sections] : []
      const section = { ...sections[sectionIndex], ...changes }
      sections[sectionIndex] = section
      next.sections = sections
      return next
    })
  }

  const handleAddSection = () => {
    setSchema((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const sections = Array.isArray(next.sections) ? [...next.sections] : []
      sections.push({ title: `Section ${sections.length + 1}`, fields: [] })
      next.sections = sections
      return next
    })
  }

  const handleDeleteSection = (sectionIndex) => {
    setSchema((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const sections = Array.isArray(next.sections) ? [...next.sections] : []
      sections.splice(sectionIndex, 1)
      next.sections = sections
      return next
    })
  }

  const handleAddField = (sectionIndex) => {
    setSchema((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const sections = Array.isArray(next.sections) ? [...next.sections] : []
      const section = { ...sections[sectionIndex] }
      const fields = Array.isArray(section.fields) ? [...section.fields] : []
      fields.push({ label: `Field ${fields.length + 1}`, type: 'text', required: false })
      section.fields = fields
      sections[sectionIndex] = section
      next.sections = sections
      return next
    })
  }

  const handleDeleteField = (sectionIndex, fieldIndex) => {
    setSchema((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      const sections = Array.isArray(next.sections) ? [...next.sections] : []
      const section = { ...sections[sectionIndex] }
      const fields = Array.isArray(section.fields) ? [...section.fields] : []
      fields.splice(fieldIndex, 1)
      section.fields = fields
      sections[sectionIndex] = section
      next.sections = sections
      return next
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const email = e.target.email.value
    const password = e.target.password.value

    const response = await fetch('http://localhost:8000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (response.ok) {
      const data = await response.json()
      const accessToken = data.token || data.access_token
      if (!accessToken) {
        alert('Login response missing token')
        return
      }
      setToken(accessToken)
      setActiveTab('upload')
    } else {
      alert('Invalid credentials')
    }
  }

  const handleLogout = () => {
    setToken(null)
    setFormId(null)
    setSchema(null)
    setShareUrl(null)
    setSubmissions([])
    setForms([])
    setActiveTab('upload')
  }

  const loadForms = async () => {
    if (!token) return
    const response = await fetch('http://localhost:8000/api/forms', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      const nextForms = Array.isArray(data) ? data : data.forms || []
      setForms(nextForms)
    }
  }

  const loadFormDetails = async (id) => {
    if (!token || !id) return
    const response = await fetch(`http://localhost:8000/api/forms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setSchema(data.schema)
      if (data.public_slug && data.status === 'active') {
        setShareUrl(`http://localhost:3000/public/${data.public_slug}`)
      } else {
        setShareUrl(null)
      }
    }
  }

  const handleActivate = async (id) => {
    const response = await fetch(`http://localhost:8000/api/forms/${id}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      await loadForms()
      setFormId(String(id))
      await loadFormDetails(id)
      setActiveTab('submissions')
    } else {
      alert('Failed to activate form')
    }
  }

  const handleDeactivate = async (id) => {
    const response = await fetch(`http://localhost:8000/api/forms/${id}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      await loadForms()
      if (formId === id) {
        await loadFormDetails(id)
      }
    } else {
      alert('Failed to deactivate form')
    }
  }

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Delete this submission and PDF?')) return
    const response = await fetch(`http://localhost:8000/api/submissions/${submissionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) loadSubmissions()
    else alert('Failed to delete submission')
  }

  const handleDeleteForm = async (id) => {
    if (!window.confirm('Delete this form and all submissions?')) return
    const response = await fetch(`http://localhost:8000/api/forms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      loadForms()
      if (formId === id) {
        setFormId(null)
        setSchema(null)
        setShareUrl(null)
        setSubmissions([])
      }
    } else {
      alert('Failed to delete form')
    }
  }

  const loadSubmissions = async () => {
    if (!formId || !token) return
    const response = await fetch(`http://localhost:8000/api/forms/${formId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      const nextSubs = Array.isArray(data) ? data : data.submissions || []
      setSubmissions(nextSubs)
      setSelectedSubmissionIds([])
    }
  }

  const toggleSubmissionSelected = (id) => {
    setSelectedSubmissionIds((prev) => {
      const sid = String(id)
      return prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    })
  }

  const setAllSubmissionsSelected = (checked) => {
    if (!checked) {
      setSelectedSubmissionIds([])
      return
    }
    setSelectedSubmissionIds(submissions.map((s) => String(s.id)))
  }

  const handleBulkDownloadSubmissions = async () => {
    if (!selectedSubmissionIds.length) return
    try {
      const response = await fetch('http://localhost:8000/api/submissions/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ submission_ids: selectedSubmissionIds })
      })
      if (!response.ok) {
        alert('Failed to download submissions')
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'submissions.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch {
      alert('Failed to download submissions')
    }
  }

  const handleBulkDeleteSubmissions = async () => {
    if (!selectedSubmissionIds.length) return
    if (!window.confirm(`Delete ${selectedSubmissionIds.length} submission(s) and PDFs?`)) return
    const response = await fetch('http://localhost:8000/api/submissions/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ submission_ids: selectedSubmissionIds })
    })
    if (response.ok) {
      setSelectedSubmissionIds([])
      loadSubmissions()
    } else {
      alert('Failed to delete submissions')
    }
  }

  const handleCreateForm = async (e) => {
    e.preventDefault()
    const response = await fetch('http://localhost:8000/api/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newFormName })
    })
    if (response.ok) {
      setNewFormName('')
      loadForms()
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const form = e.target
    const fileInput = form.file
    const nameInput = form.form_name
    if (!fileInput?.files?.[0]) {
      alert('Please choose a PDF file')
      return
    }
    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    if (nameInput?.value) {
      formData.append('form_name', nameInput.value)
    }

    const response = await fetch('http://localhost:8000/api/forms/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })

    if (response.ok) {
      const data = await response.json()
      setFormId(data.form_id)
      if (data.schema) {
        setSchema(data.schema)
      } else {
        await loadFormDetails(data.form_id)
      }
      loadForms()
      setActiveTab('builder')
    } else {
      alert('Upload failed')
    }
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
    if (!response.ok) {
      alert('Failed to save schema')
    }
  }

  const handleDownloadPdf = async (submissionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/submissions/${submissionId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        alert('Failed to download PDF')
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch {
      alert('Failed to download PDF')
    }
  }

  const refreshSubmissions = () => loadSubmissions()

  const handleSubmitForm = async (filledData) => {
    if (!formId) return
    const response = await fetch(`http://localhost:8000/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ filled_data: filledData })
    })

    if (response.ok) {
      alert('Form submitted successfully')
      loadSubmissions()
    } else {
      alert('Failed to submit form')
    }
  }

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyStatus('Link copied!')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch (err) {
      console.error(err)
      setCopyStatus('Copy failed')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  useEffect(() => {
    if (token) loadForms()
  }, [token])

  useEffect(() => {
    if (formId) {
      loadFormDetails(formId)
      loadSubmissions()
    }
  }, [formId])

  const renderUploadTab = () => (
    <section className="card" aria-labelledby="upload-title">
      <div className="card-header">
        <h2 id="upload-title">Upload New PDF</h2>
        <p>Add a base PDF to start generating online forms.</p>
      </div>
      <form onSubmit={handleUpload} className="form-grid">
        <label className="form-group">
          <span>Form Name</span>
          <input type="text" name="form_name" required aria-required="true" />
        </label>
        <label className="form-group">
          <span>PDF File</span>
          <input type="file" name="file" accept="application/pdf" required aria-required="true" />
        </label>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">
            <IconUpload /> Upload PDF
          </button>
        </div>
      </form>
    </section>
  )

  const renderFormsTab = () => (
    <>
      <section className="card" aria-labelledby="create-form-title">
        <div className="card-header">
          <h2 id="create-form-title">Create Blank Form</h2>
          <p>Spin up a form without uploading a PDF.</p>
        </div>
        <form onSubmit={handleCreateForm} className="form-grid">
          <label className="form-group">
            <span>Form Name</span>
            <input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              <IconForms /> Create
            </button>
          </div>
        </form>
      </section>
      <section className="card" aria-labelledby="list-form-title">
        <div className="card-header">
          <h2 id="list-form-title">Your Forms</h2>
          <p>Activate, deactivate, or delete existing forms.</p>
        </div>
        {forms.length === 0 ? (
          <div className="empty-state">
            <p>No forms available. Upload a PDF or create one.</p>
          </div>
        ) : (
          <ul className="list">
            {forms.map((f) => (
              <li key={f.id} className={`list-item ${formId === f.id ? 'is-active' : ''}`}>
                <div>
                  <p className="list-title">{f.name || 'Untitled Form'}</p>
                  <p className="list-meta">Status: {f.status || 'unknown'}</p>
                  <p className="list-meta">Created: {new Date(f.created_at).toLocaleString()}</p>
                  {f.status === 'active' && f.public_slug ? (
                    <p className="list-meta">
                      Share: {' '}
                      <a
                        href={`/public/${f.public_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                      >
                        {`/public/${f.public_slug}`}
                      </a>
                      {' '} 
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={async () => {
                          const url = `${window.location.origin}/public/${f.public_slug}`
                          try {
                            await navigator.clipboard.writeText(url)
                          } catch {
                            alert('Copy failed')
                          }
                        }}
                        style={{ marginLeft: '8px' }}
                      >
                        <IconCopy /> Copy
                      </button>
                    </p>
                  ) : null}
                </div>
                <div className="list-actions" role="group" aria-label="Form actions">
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      const nextId = String(f.id)
                      setFormId(nextId)
                      await loadFormDetails(nextId)
                      setActiveTab('builder')
                    }}
                  >
                    View
                  </button>
                  {f.status === 'active' ? (
                    <button className="btn btn-neutral" onClick={() => handleDeactivate(f.id)}>
                      <IconX /> Deactivate
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={() => handleActivate(f.id)}>
                      <IconCheck /> Activate
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => handleDeleteForm(f.id)}>
                    <IconTrash /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )

  const renderBuilderTab = () => (
    <>
      <section className="card" aria-labelledby="select-form-title">
        <div className="card-header">
          <h2 id="select-form-title">Select Form to Edit</h2>
          <p>Choose a form to update its schema.</p>
        </div>
        <label className="form-group">
          <span>Form</span>
          <select value={formId || ''} onChange={(e) => setFormId(e.target.value || null)}>
            <option value="">Select a form</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || 'Untitled Form'}
              </option>
            ))}
          </select>
        </label>
      </section>
      {schema ? (
        <section className="card" aria-labelledby="builder-title">
          <div className="card-header">
            <h2 id="builder-title">Edit Schema</h2>
            <button className="btn btn-primary" onClick={handleSaveSchema}>
              Save Changes
            </button>
          </div>
          <div className="form-group">
            <label>Form Name</label>
            <input value={schema.name || ''} onChange={(e) => handleSchemaNameChange(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Admin Instructions</label>
            <textarea value={schema.adminText || ''} onChange={(e) => handleSchemaAdminTextChange(e.target.value)} rows={3} />
          </div>
          <div className="section-stack">
            {schema.sections?.map((section, sectionIndex) => (
              <article key={sectionIndex} className="section-card">
                <header>
                  <input value={section.title || ''} onChange={(e) => handleSchemaSectionChange(sectionIndex, { title: e.target.value })} />
                  <button className="icon-btn" onClick={() => handleDeleteSection(sectionIndex)} aria-label="Delete section">
                    <IconTrash />
                  </button>
                </header>
                {section.fields?.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="field-row">
                    <input
                      value={field.label || ''}
                      onChange={(e) => handleSchemaFieldChange(sectionIndex, fieldIndex, { label: e.target.value })}
                      placeholder="Field label"
                    />
                    <select value={field.type} onChange={(e) => handleSchemaFieldChange(sectionIndex, fieldIndex, { type: e.target.value })}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="date">Date</option>
                      <option value="textarea">Textarea</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="radio">Radio</option>
                      <option value="select">Select</option>
                    </select>
                    <label className="field-required">
                      <input
                        type="checkbox"
                        checked={!!field.required}
                        onChange={(e) => handleSchemaFieldChange(sectionIndex, fieldIndex, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <button className="icon-btn" onClick={() => handleDeleteField(sectionIndex, fieldIndex)} aria-label="Delete field">
                      <IconTrash />
                    </button>
                  </div>
                ))}
                <button className="btn btn-neutral" onClick={() => handleAddField(sectionIndex)}>
                  + Add Field
                </button>
              </article>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleAddSection}>
            + Add Section
          </button>
        </section>
      ) : (
        <section className="card empty-card">
          <p>Select a form to start editing.</p>
        </section>
      )}
      {schema && (
        <section className="card" aria-labelledby="preview-title">
          <div className="card-header">
            <h2 id="preview-title">Live Preview</h2>
            <p>Test the form before sharing.</p>
          </div>
          <DynamicForm schema={schema} onSubmit={handleSubmitForm} />
        </section>
      )}
    </>
  )

  const renderSubmissionsTab = () => (
    <>
      <section className="card" aria-labelledby="share-title">
        <div className="card-header">
          <h2 id="share-title">Share Form</h2>
          <p>Provide the public link to respondents.</p>
        </div>
        {shareUrl ? (
          <div className="share-box">
            <code>{shareUrl}</code>
            <button className="btn btn-secondary" onClick={handleCopyShareUrl}>
              <IconCopy /> Copy Link
            </button>
            {copyStatus && <span className="share-status">{copyStatus}</span>}
          </div>
        ) : (
          <p>Select a form to generate a share link.</p>
        )}
      </section>
      <section className="card" aria-labelledby="submission-title">
        <div className="card-header">
          <h2 id="submission-title">Submission Records</h2>
          <div className="card-actions">
            <label>
              <span className="sr-only">Select form</span>
              <select value={formId || ''} onChange={(e) => setFormId(e.target.value || null)}>
                <option value="">Select a form</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || 'Untitled Form'}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-neutral" onClick={refreshSubmissions} disabled={!formId}>
              Refresh
            </button>
            <button
              className="btn btn-primary"
              onClick={handleBulkDownloadSubmissions}
              disabled={!selectedSubmissionIds.length}
            >
              <IconDownload /> Download Selected
            </button>
            <button
              className="btn btn-danger"
              onClick={handleBulkDeleteSubmissions}
              disabled={!selectedSubmissionIds.length}
            >
              <IconTrash /> Delete Selected
            </button>
          </div>
        </div>
        {submissions.length === 0 ? (
          <div className="empty-state">
            <p>No submissions for the selected form.</p>
          </div>
        ) : (
          <ul className="list">
            <li className="list-item" style={{ alignItems: 'center' }}>
              <label className="field-required" style={{ marginRight: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={selectedSubmissionIds.length > 0 && selectedSubmissionIds.length === submissions.length}
                  onChange={(e) => setAllSubmissionsSelected(e.target.checked)}
                />
                Select all
              </label>
              <div style={{ flex: 1, color: 'var(--muted)' }}>
                {selectedSubmissionIds.length} selected
              </div>
            </li>
            {submissions.map((sub) => (
              <li key={sub.id} className="list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedSubmissionIds.includes(String(sub.id))}
                    onChange={() => toggleSubmissionSelected(sub.id)}
                    aria-label="Select submission"
                  />
                  <div>
                  <p className="list-title">{sub.submitter_email || 'Anonymous user'}</p>
                  <p className="list-meta">{new Date(sub.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="list-actions">
                  <button className="btn btn-primary" onClick={() => handleDownloadPdf(sub.id)}>
                    <IconDownload /> PDF
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteSubmission(sub.id)}>
                    <IconTrash /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )

  if (!token) {
    return (
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleLogin}>
          <h1>Admin Login</h1>
          <p>Enter your credentials to manage forms.</p>
          <label className="form-group">
            <span>Email</span>
            <input type="email" name="email" required aria-required="true" />
          </label>
          <label className="form-group">
            <span>Password</span>
            <input type="password" name="password" required aria-required="true" />
          </label>
          <button className="btn btn-primary" type="submit">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <aside className="sidebar" aria-label="Admin navigation">
        <div className="sidebar-header">
          <h1>PDF Digitization</h1>
          <p>Admin Console</p>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={`nav-link ${activeTab === item.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(item.key)}
                aria-current={activeTab === item.key ? 'page' : undefined}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <button className="btn btn-danger logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="main">
        <header className="main-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Admin Dashboard</h2>
            <p>Manage PDFs, forms, and submissions from one workspace.</p>
          </div>
        </header>
        <div className="content-area">
          {activeTab === 'upload' && renderUploadTab()}
          {activeTab === 'forms' && renderFormsTab()}
          {activeTab === 'builder' && renderBuilderTab()}
          {activeTab === 'submissions' && renderSubmissionsTab()}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/pdf/:id" element={<PDFViewer />} />
        <Route path="/form/:shareToken" element={<DynamicForm />} />
        <Route path="/public/:slug" element={<PublicForm />} />
        <Route path="/public/form/:slug" element={<PublicForm />} />
      </Routes>
    </Router>
  )
}

export default App
