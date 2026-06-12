
import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import './App.css'
import DataTable from './components/common/DataTable'
import AnimatedCharts from './components/charts/AnimatedCharts'
import { parseApiError } from './utils/format'

const API_BASE = 'http://localhost:8090/api'
const CHART_TYPES = ['auto', 'all', 'bar', 'line', 'pie', 'scatter', 'area']
const EMPTY_RESULT = { summary: '', columns: [], rows: [], charts: [] }
const VALID_ROUTES = ['login', 'upload', 'workspace', 'history', 'dashboards', 'settings']

const historyCacheKeyFor = (email, fileId) => `analytics_history_cache_${email || 'guest'}_${fileId || 'none'}`

const routeFromPath = (pathname) => {
  const clean = String(pathname || '/').replace(/^\/+/, '').split('/')[0]
  return VALID_ROUTES.includes(clean) ? clean : 'login'
}

function normalizeResult(data) {
  return {
    ...EMPTY_RESULT,
    ...(data || {}),
    columns: Array.isArray(data?.columns) ? data.columns : [],
    rows: Array.isArray(data?.rows) ? data.rows : [],
    charts: Array.isArray(data?.charts) ? data.charts : Array.isArray(data?.chart) ? data.chart : data?.chart ? [data.chart] : [],
  }
}

function App() {
  const [route, setRoute] = useState(() => routeFromPath(window.location.pathname))
  const [email, setEmail] = useState(localStorage.getItem('analytics_email') || 'demo@example.com')
  const [password, setPassword] = useState('password')
  const [token, setToken] = useState(localStorage.getItem('analytics_token') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedFiles, setSelectedFiles] = useState([])
  const [files, setFiles] = useState([])
  const [previewByFileId, setPreviewByFileId] = useState({})
  const [fullPreviewByFileId, setFullPreviewByFileId] = useState({})
  const [activeFileId, setActiveFileId] = useState(null)
  const [selectedSheetByFileId, setSelectedSheetByFileId] = useState({})
  const [relationships, setRelationships] = useState([])
  const [selectedRelationshipIds, setSelectedRelationshipIds] = useState([])

  const [question, setQuestion] = useState('How many products are there?')
  const [chartType, setChartType] = useState('all')
  const [chatMessages, setChatMessages] = useState([])
  const [latestResult, setLatestResult] = useState(EMPTY_RESULT)
  const [isQuerying, setIsQuerying] = useState(false)

  const [history, setHistory] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [dashboards, setDashboards] = useState([])
  const [dashboardName, setDashboardName] = useState('My Dashboard')
  const [historyCache, setHistoryCache] = useState({})
  const [uploadUiState, setUploadUiState] = useState('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  const inFlightQueryKeyRef = useRef('')
  const hydratedHistoryKeyRef = useRef('')
  const chatScrollRef = useRef(null)
  const uploadResetTimerRef = useRef(null)

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const activeFile = useMemo(() => files.find((file) => file.id === activeFileId) || null, [files, activeFileId])

  const navigate = (nextRoute, replace = false) => {
    if (!VALID_ROUTES.includes(nextRoute)) return
    const path = `/${nextRoute}`
    if (replace) window.history.replaceState({}, '', path)
    else window.history.pushState({}, '', path)
    setRoute(nextRoute)
  }

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase()
    if (!q) return history
    return history.filter((item) => (`${item?.question || ''} ${item?.summary || ''} ${item?.status || ''}`).toLowerCase().includes(q))
  }, [history, historySearch])

  const sheetHistory = useMemo(() => {
    if (!activeFileId) return []
    const activeId = Number(activeFileId)
    return history.filter((item) => {
      const datasetId = Number(item?.datasetId ?? item?.dataset_id ?? item?.fileId ?? item?.file_id)
      return Number.isFinite(datasetId) && datasetId === activeId
    })
  }, [history, activeFileId])

  const scrollChatToBottom = () => {
    const el = chatScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  const loadWorkspaceData = async (userEmail, nextHeaders = authHeaders) => {
    const [filesRes, relRes, historyRes, dashboardsRes] = await Promise.all([
      axios.get(`${API_BASE}/files`, { params: { email: userEmail }, headers: nextHeaders }),
      axios.get(`${API_BASE}/query/relationships`, { params: { email: userEmail }, headers: nextHeaders }),
      axios.get(`${API_BASE}/query/history`, { params: { email: userEmail }, headers: nextHeaders }),
      axios.get(`${API_BASE}/query/dashboards`, { params: { email: userEmail }, headers: nextHeaders }),
    ])
    setFiles(Array.isArray(filesRes.data) ? filesRes.data : [])
    setRelationships(Array.isArray(relRes.data) ? relRes.data : [])
    setHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
    setDashboards(Array.isArray(dashboardsRes.data) ? dashboardsRes.data : [])
  }

  const login = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password })
      const nextToken = data?.token || ''
      const nextHeaders = nextToken ? { Authorization: `Bearer ${nextToken}` } : {}
      setToken(nextToken)
      localStorage.setItem('analytics_token', nextToken)
      localStorage.setItem('analytics_email', email)
      navigate('upload', true)
      await loadWorkspaceData(email, nextHeaders)
    } catch (err) {
      setError(parseApiError(err, 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  const register = async () => {
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_BASE}/auth/register`, { email, password })
      await login()
    } catch (err) {
      setError(parseApiError(err, 'Signup failed.'))
      setLoading(false)
    }
  }

  const logout = () => {
    setToken('')
    localStorage.removeItem('analytics_token')
    localStorage.removeItem('analytics_email')
    setFiles([])
    setActiveFileId(null)
    setPreviewByFileId({})
    setFullPreviewByFileId({})
    setSelectedSheetByFileId({})
    setRelationships([])
    setSelectedRelationshipIds([])
    setLatestResult(EMPTY_RESULT)
    setChatMessages([])
    setHistory([])
    setDashboards([])
    setHistoryCache({})
    setError('')
    hydratedHistoryKeyRef.current = ''
    navigate('login', true)
  }

  const uploadFiles = async () => {
    if (!selectedFiles.length) return false
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      selectedFiles.forEach((file) => form.append('files', file))
      form.append('email', email)
      await axios.post(`${API_BASE}/files/upload-multiple`, form, { headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' } })
      await loadWorkspaceData(email)
      setSelectedFiles([])
      return true
    } catch (err) {
      setError(parseApiError(err, 'Upload failed.'))
      return false
    } finally {
      setLoading(false)
    }
  }

  const runUploadWithAnimation = async () => {
    if (!selectedFiles.length || loading) return

    setUploadUiState('uploading')
    setUploadProgress(8)

    const progressTimer = window.setInterval(() => {
      setUploadProgress((prev) => (prev >= 92 ? 92 : prev + 6))
    }, 180)

    const ok = await uploadFiles()
    window.clearInterval(progressTimer)

    if (!ok) {
      setUploadUiState('idle')
      setUploadProgress(0)
      return
    }

    setUploadProgress(100)
    setUploadUiState('done')

    if (uploadResetTimerRef.current) {
      window.clearTimeout(uploadResetTimerRef.current)
    }

    uploadResetTimerRef.current = window.setTimeout(() => {
      setUploadUiState('idle')
      setUploadProgress(0)
    }, 3500)
  }

  const previewFile = async (fileId, options = {}) => {
    const { full = false, limit = full ? 200000 : 20, sheetName } = options
    if (!fileId) return
    setActiveFileId(fileId)

    const cached = full ? fullPreviewByFileId[fileId] : previewByFileId[fileId]
    if (cached) {
      const cachedSheet = typeof cached?.sheetName === 'string' ? cached.sheetName : null
      if (!sheetName || cachedSheet === sheetName) return
    }

    try {
      const { data } = await axios.get(`${API_BASE}/files/${fileId}/preview`, {
        params: { email, limit, ...(sheetName ? { sheetName } : {}) },
        headers: authHeaders,
      })

      const normalized = {
        columns: Array.isArray(data?.columns) ? data.columns : [],
        rows: Array.isArray(data?.rows) ? data.rows : [],
        sheetName: typeof data?.sheetName === 'string' ? data.sheetName : null,
        sheetNames: Array.isArray(data?.sheetNames) ? data.sheetNames : [],
      }

      if (full) {
        setFullPreviewByFileId((prev) => ({ ...prev, [fileId]: normalized }))
      } else {
        setPreviewByFileId((prev) => ({ ...prev, [fileId]: normalized }))
      }

      const resolvedSheet = normalized.sheetName || (Array.isArray(normalized.sheetNames) ? normalized.sheetNames[0] : null)
      if (resolvedSheet) {
        setSelectedSheetByFileId((prev) => ({ ...prev, [fileId]: resolvedSheet }))
      }
    } catch (err) {
      setError(parseApiError(err, 'Preview failed for selected file.'))
    }
  }

  const openWorkspace = async (fileId) => {
    const selectedSheet = selectedSheetByFileId[fileId]
    await previewFile(fileId, selectedSheet ? { sheetName: selectedSheet } : {})
    navigate('workspace')
  }

  const openPreviewModal = async (fileId) => {
    const selectedSheet = selectedSheetByFileId[fileId]
    await previewFile(fileId, selectedSheet ? { sheetName: selectedSheet } : {})
    await previewFile(fileId, selectedSheet ? { full: true, limit: 200000, sheetName: selectedSheet } : { full: true, limit: 200000 })
    setIsPreviewModalOpen(true)
  }

  const selectWorkbookSheet = async (fileId, sheetName) => {
    if (!fileId || !sheetName) return
    setSelectedSheetByFileId((prev) => ({ ...prev, [fileId]: sheetName }))
    await previewFile(fileId, { sheetName })
    if (isPreviewModalOpen && Number(activeFileId) === Number(fileId)) {
      await previewFile(fileId, { full: true, limit: 200000, sheetName })
    }
  }

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false)
  }

  const rememberHistoryAnswer = (questionText, payload) => {
    const q = (questionText || '').trim()
    if (!q) return
    setHistoryCache((prev) => {
      const next = { ...prev, [q.toLowerCase()]: { question: q, result: payload, at: new Date().toISOString() } }
      try { localStorage.setItem(historyCacheKeyFor(email, activeFileId), JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handleHistoryClick = (item) => {
    const q = (item?.question || '').trim()
    if (!q) return
    const cached = historyCache[q.toLowerCase()]
    setQuestion(q)
    navigate('workspace')
    if (cached?.result) {
      setLatestResult(normalizeResult(cached.result))
      return
    }
    if (item?.summary) {
      setLatestResult((prev) => ({ ...prev, summary: item.summary }))
    }
  }

  const toggleRelationship = (relationshipId, checked) => {
    if (checked) setSelectedRelationshipIds((prev) => (prev.includes(relationshipId) ? prev : [...prev, relationshipId]))
    else setSelectedRelationshipIds((prev) => prev.filter((id) => id !== relationshipId))
  }

  const askQuery = async () => {
    if (!question.trim() || !activeFileId || isQuerying) return
    const askedQuestion = question.trim()
    const queryKey = JSON.stringify({ askedQuestion, activeFileId, selectedRelationshipIds: [...selectedRelationshipIds].sort(), chartType })
    if (inFlightQueryKeyRef.current === queryKey) return

    setLoading(true)
    setIsQuerying(true)
    setError('')
    inFlightQueryKeyRef.current = queryKey
    setChatMessages((prev) => [...prev, { role: 'user', text: askedQuestion, at: new Date().toISOString() }])

    try {
      const { data } = await axios.post(`${API_BASE}/query`, {
        email,
        fileIds: [activeFileId],
        relationshipIds: selectedRelationshipIds,
        question: askedQuestion,
        sheetName: selectedSheetByFileId[activeFileId] || previewByFileId[activeFileId]?.sheetName || null,
        chartType,
      }, { headers: authHeaders })

      const payload = normalizeResult(data)
      setLatestResult(payload)
      rememberHistoryAnswer(askedQuestion, payload)
      setChatMessages((prev) => [...prev, { role: 'assistant', text: payload.summary || 'Analysis complete.', at: new Date().toISOString() }])
      await loadWorkspaceData(email)
    } catch (err) {
      const message = parseApiError(err, 'Query execution failed.')
      setError(message)
      setChatMessages((prev) => [...prev, { role: 'assistant', text: `Query failed: ${message}`, at: new Date().toISOString() }])
    } finally {
      setLoading(false)
      setIsQuerying(false)
      inFlightQueryKeyRef.current = ''
    }
  }

  const saveDashboard = async () => {
    if (!activeFileId) return
    try {
      await axios.post(`${API_BASE}/query/dashboards`, {
        email,
        name: dashboardName,
        config: { activeFileId, selectedRelationshipIds, question, latestResult, chartType },
      }, { headers: authHeaders })
      await loadWorkspaceData(email)
      navigate('dashboards')
    } catch (err) {
      setError(parseApiError(err, 'Failed to save dashboard.'))
    }
  }

  const loadDashboard = (dashboard) => {
    try {
      const config = typeof dashboard?.configJson === 'string'
        ? JSON.parse(dashboard.configJson)
        : (dashboard?.configJson || dashboard?.config || {})

      setActiveFileId(config.activeFileId || null)
      setSelectedRelationshipIds(Array.isArray(config.selectedRelationshipIds) ? config.selectedRelationshipIds : [])
      setQuestion(config.question || '')
      setLatestResult(normalizeResult(config.latestResult || config.result || EMPTY_RESULT))
      setChartType(CHART_TYPES.includes(config.chartType) ? config.chartType : 'all')
      navigate('workspace')
    } catch (err) {
      setError(parseApiError(err, 'Invalid dashboard payload.'))
    }
  }

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!token || !email) return
    loadWorkspaceData(email).catch(() => logout())
  }, [token, email])

  useEffect(() => {
    if (!token && route !== 'login') {
      navigate('login', true)
    }
    if (token && route === 'login') {
      navigate('upload', true)
    }
  }, [token, route])

  useEffect(() => {
    if (!activeFileId) return

    const ordered = [...sheetHistory].sort((a, b) => {
      const at = new Date(a?.createdAt || a?.created_at || 0).getTime()
      const bt = new Date(b?.createdAt || b?.created_at || 0).getTime()
      return at - bt
    })

    const historyKey = `${activeFileId}:${ordered.map((item) => item?.queryId ?? item?.id ?? item?.createdAt ?? item?.question ?? '').join('|')}`
    if (hydratedHistoryKeyRef.current === historyKey) return

    const hydratedMessages = []
    for (const item of ordered) {
      const asked = String(item?.question || '').trim()
      if (!asked) continue
      hydratedMessages.push({ role: 'user', text: asked, at: item?.createdAt || item?.created_at || new Date().toISOString() })
      hydratedMessages.push({ role: 'assistant', text: String(item?.summary || 'Answered from history.'), at: item?.createdAt || item?.created_at || new Date().toISOString() })
    }

    setChatMessages(hydratedMessages)
    hydratedHistoryKeyRef.current = historyKey
  }, [activeFileId, sheetHistory])

  useEffect(() => {
    if (!email || !activeFileId) return
    try {
      const raw = localStorage.getItem(historyCacheKeyFor(email, activeFileId))
      setHistoryCache(raw ? JSON.parse(raw) : {})
    } catch {
      setHistoryCache({})
    }
  }, [email, activeFileId])

  useEffect(() => {
    scrollChatToBottom()
  }, [chatMessages])

  useEffect(() => {
    if (!isPreviewModalOpen) return undefined
    const onEsc = (e) => {
      if (e.key === 'Escape') closePreviewModal()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isPreviewModalOpen])

  useEffect(() => () => {
    if (uploadResetTimerRef.current) {
      window.clearTimeout(uploadResetTimerRef.current)
    }
  }, [])

  const preview = previewByFileId[activeFileId] || { columns: [], rows: [] }
  const fullPreview = fullPreviewByFileId[activeFileId] || preview
  const activeSheetName = activeFileId
    ? (selectedSheetByFileId[activeFileId] || preview.sheetName || (Array.isArray(preview.sheetNames) ? preview.sheetNames[0] : null))
    : null

  if (route === 'login') {
    return (
      <div className="login-page">
        <section className="login-card">
          <div className="chip">Analytics Studio</div>
          <h1>Sign In</h1>
          <p>Clean dashboard UI with route-based navigation and sidebar workflow.</p>

          <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

          <div className="row">
            <button className="btn primary" disabled={loading} onClick={login}>{loading ? 'Please wait...' : 'Login'}</button>
            <button className="btn" disabled={loading} onClick={register}>Register</button>
          </div>
          {error ? <div className="error-box">{error}</div> : null}
        </section>
      </div>
    )
  }

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Analytics</strong>
            <div className="muted">{email}</div>
          </div>
        </div>

        <nav className="nav-list">
          {[
            { id: 'upload', label: 'Upload', meta: `${files.length} files` },
            { id: 'workspace', label: 'Workspace', meta: activeFile ? activeFile.originalName : 'Pick file' },
            { id: 'history', label: 'History', meta: `${history.length} items` },
            { id: 'dashboards', label: 'Dashboards', meta: `${dashboards.length} saved` },
            { id: 'settings', label: 'Settings', meta: 'Profile + Session' },
          ].map((item) => (
            <button key={item.id} type="button" className={`nav-item ${route === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
              <span>{item.label}</span>
              <small>{item.meta}</small>
            </button>
          ))}
        </nav>

        <button type="button" className="btn danger sidebar-logout" onClick={logout}>Logout</button>
      </aside>

      <main className="content">
        <header className="content-header">
          <h2>{route[0].toUpperCase() + route.slice(1)}</h2>
          {error ? <div className="error-inline">{error}</div> : null}
        </header>

        {route === 'upload' ? (
          <section className="grid two">
            <article className="card upload-panel">
              <h3>Upload Files</h3>
              <p className="muted">CSV and Excel supported. Backend integration is unchanged.</p>

              <label className={`upload-zone upload-zone-${uploadUiState}`} htmlFor="upload-input-inline">
                <input
                  id="upload-input-inline"
                  type="file"
                  className="hidden-upload-input"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    setSelectedFiles(Array.from(e.target.files || []))
                    if (uploadUiState !== 'uploading') {
                      setUploadUiState('idle')
                      setUploadProgress(0)
                    }
                  }}
                />
                <div className="upload-zone-icon-wrap">
                  {uploadUiState === 'uploading' ? <span className="upload-spinner" /> : null}
                  {uploadUiState === 'done' ? <span className="upload-check">✓</span> : null}
                  {uploadUiState === 'idle' ? <span className="upload-arrow">↑</span> : null}
                </div>
                <div className="upload-zone-text">
                  <strong>
                    {uploadUiState === 'uploading' ? 'Uploading files...' : uploadUiState === 'done' ? 'Upload completed' : 'Drag files here or click to browse'}
                  </strong>
                  <span className="muted">
                    {uploadUiState === 'uploading' ? `Progress: ${uploadProgress}%` : uploadUiState === 'done' ? 'Success. Ready for next upload.' : 'CSV, XLSX, XLS supported'}
                  </span>
                </div>
                {(uploadUiState === 'uploading' || uploadUiState === 'done') ? (
                  <div className="upload-progress-track">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                ) : null}
              </label>

              <div className="pill-wrap">
                {selectedFiles.length ? selectedFiles.map((file) => <span className="pill" key={`${file.name}-${file.size}`}>{file.name}</span>) : <span className="muted">No files selected.</span>}
              </div>
              <button className="btn primary" disabled={loading || !selectedFiles.length || uploadUiState === 'uploading'} onClick={runUploadWithAnimation}>
                {uploadUiState === 'uploading' ? 'Uploading...' : 'Upload Files'}
              </button>
            </article>

            <article className="card library-panel">
              <h3>Library</h3>
              <div className="list">
                {files.length ? files.map((file) => (
                  <div className={`list-item library-tile ${activeFileId === file.id ? 'selected' : ''}`} key={file.id}>
                    <div>
                      <strong>{file.originalName}</strong>
                      <div className="muted">ID {file.id}</div>
                    </div>
                    <div className="row">
                      <button className="btn" onClick={() => openPreviewModal(file.id)}>Preview</button>
                      <button className="btn primary" onClick={() => openWorkspace(file.id)}>Open</button>
                    </div>
                  </div>
                )) : <div className="muted">No files uploaded.</div>}
              </div>
            </article>

            <article className="card span-2 preview-strip">
              <div className="row">
                <h3>Preview</h3>
                <button className="btn" onClick={() => openPreviewModal(activeFileId)} disabled={!activeFileId}>Open Full Report</button>
              </div>
              <div className="preview-strip-table">
                {Array.isArray(preview.sheetNames) && preview.sheetNames.length > 1 ? (
                  <div className="preview-sheet-meta">
                    <label className="muted" style={{ marginRight: 8 }}>Sheet</label>
                    <select
                      className="field"
                      value={activeSheetName || ''}
                      onChange={(e) => selectWorkbookSheet(activeFileId, e.target.value)}
                    >
                      {preview.sheetNames.map((sheet) => (
                        <option key={sheet} value={sheet}>{sheet}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <DataTable columns={preview.columns || []} rows={(preview.rows || []).slice(0, 6)} />
              </div>
            </article>
          </section>
        ) : null}

        {isPreviewModalOpen ? (
          <div className="preview-modal-overlay" onClick={closePreviewModal}>
            <section className="preview-modal" onClick={(e) => e.stopPropagation()}>
              <header className="preview-modal-header">
                <div>
                  <h3>Complete Report Preview</h3>
                  <p className="muted">{activeFile?.originalName || 'Selected file'}</p>
                  <div className="preview-meta-row">
                    <span className="preview-meta-chip">Rows: {fullPreview.rows?.length || 0}</span>
                    <span className="preview-meta-chip">Columns: {fullPreview.columns?.length || 0}</span>
                    {Array.isArray(fullPreview.sheetNames) && fullPreview.sheetNames.length > 1 ? (
                      <span className="preview-meta-chip">Sheet: {fullPreview.sheetName || fullPreview.sheetNames[0]}</span>
                    ) : null}
                  </div>
                  {Array.isArray(fullPreview.sheetNames) && fullPreview.sheetNames.length > 1 ? (
                    <p className="muted">Workbook sheets: {fullPreview.sheetNames.join(', ')}</p>
                  ) : null}
                </div>
                <button className="btn" onClick={closePreviewModal}>Close</button>
              </header>

              <div className="preview-modal-body">
                {fullPreview.columns?.length && fullPreview.rows?.length ? (
                  <div className="preview-table-animate">
                    <DataTable columns={fullPreview.columns} rows={fullPreview.rows} />
                  </div>
                ) : (
                  <p className="muted">No preview data available yet. Select a file and click Preview.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {route === 'workspace' ? (
          <section className="grid split">
            <article className="card">
              <h3>Ask Anything</h3>
              <p className="muted">Use natural language over selected files.</p>

              <select className="field" value={activeFileId || ''} onChange={(e) => setActiveFileId(Number(e.target.value) || null)}>
                <option value="">Select file</option>
                {files.map((file) => <option key={file.id} value={file.id}>{file.originalName}</option>)}
              </select>

              {Array.isArray(preview.sheetNames) && preview.sheetNames.length > 1 ? (
                <select
                  className="field"
                  value={activeSheetName || ''}
                  onChange={(e) => selectWorkbookSheet(activeFileId, e.target.value)}
                >
                  {preview.sheetNames.map((sheet) => <option key={sheet} value={sheet}>{sheet}</option>)}
                </select>
              ) : null}

              <textarea className="field textarea" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask data question..." />

              <select className="field" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                {CHART_TYPES.map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
              </select>

              {relationships.length ? (
                <div className="relation-list">
                  {relationships.map((rel) => (
                    <label className="relation-item" key={rel.relationshipId}>
                      <input
                        type="checkbox"
                        checked={selectedRelationshipIds.includes(rel.relationshipId)}
                        onChange={(e) => toggleRelationship(rel.relationshipId, e.target.checked)}
                      />
                      <span>{rel.leftName} ({rel.leftKey}) ↔ {rel.rightName} ({rel.rightKey})</span>
                    </label>
                  ))}
                </div>
              ) : null}

              <button className="btn primary" disabled={isQuerying || loading || !activeFileId || !question.trim()} onClick={askQuery}>
                {isQuerying ? 'Running...' : 'Run Analysis'}
              </button>
            </article>

            <article className="card">
              <h3>Conversation</h3>
              <div className="chat-box" ref={chatScrollRef}>
                {chatMessages.length ? chatMessages.map((msg, idx) => (
                  <div key={idx} className={`bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                    <div>{msg.text}</div>
                  </div>
                )) : <div className="muted">Start with a question.</div>}
              </div>

              <h3>Result</h3>
              {latestResult.summary ? <p className="summary">{latestResult.summary}</p> : <p className="muted">No result yet.</p>}

              {latestResult.rows?.length && latestResult.columns?.length ? (
                <div className="result-stack">
                  <DataTable columns={latestResult.columns} rows={latestResult.rows} />
                  <AnimatedCharts
                    rows={latestResult.rows}
                    columns={latestResult.columns}
                    requestedType={chartType}
                    chartMeta={latestResult.charts}
                  />
                </div>
              ) : null}

              <div className="row">
                <input className="field" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} placeholder="Dashboard name" />
                <button className="btn" onClick={saveDashboard}>Save</button>
              </div>
            </article>
          </section>
        ) : null}

        {route === 'history' ? (
          <section className="card">
            <h3>Query History</h3>
            <input className="field" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search history..." />
            <div className="list">
              {filteredHistory.length ? filteredHistory.map((item, idx) => (
                <button type="button" className="list-item history-btn" key={item.queryId || idx} onClick={() => handleHistoryClick(item)}>
                  <div>
                    <strong>{item.question || 'Untitled question'}</strong>
                    <div className="muted">{item.summary || item.status || 'Saved query'}</div>
                  </div>
                  <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small>
                </button>
              )) : <div className="muted">No history available.</div>}
            </div>
          </section>
        ) : null}

        {route === 'dashboards' ? (
          <section className="card">
            <h3>Saved Dashboards</h3>
            <div className="list">
              {dashboards.length ? dashboards.map((dashboard, idx) => (
                <div className="list-item" key={dashboard.dashboardId || idx}>
                  <div>
                    <strong>{dashboard.name || `Dashboard ${idx + 1}`}</strong>
                    <div className="muted">Updated {dashboard.updatedAt ? new Date(dashboard.updatedAt).toLocaleString() : '-'}</div>
                  </div>
                  <button className="btn primary" onClick={() => loadDashboard(dashboard)}>Load</button>
                </div>
              )) : <div className="muted">No dashboards saved yet.</div>}
            </div>
          </section>
        ) : null}

        {route === 'settings' ? (
          <section className="card">
            <h3>Settings</h3>
            <p className="muted">UI-only settings pane. Backend API contract remains unchanged.</p>
            <div className="setting-grid">
              <label>
                <span>Email</span>
                <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                <span>Token Present</span>
                <input className="field" value={token ? 'Yes' : 'No'} readOnly />
              </label>
            </div>
            <button className="btn danger" onClick={logout}>Sign Out</button>
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default App
