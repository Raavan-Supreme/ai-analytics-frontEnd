
import React from 'react'
import TopBar from '../common/TopBar'
import DataTable from '../common/DataTable'

function UploadScreen({
  files = [],
  selectedFiles = [],
  activeFileId,
  previewByFileId = {},
  error,
  loading,
  onPickFiles,
  onUpload,
  onOpenWorkspace,
  onBackToWorkspace,
  onLogout,
  onPreview,
}) {
  const activePreview = activeFileId ? previewByFileId[activeFileId] : null

  return (
    <div className="app-shell">
      <TopBar
        title="Upload + Preview Workspace"
        subtitle="Everything on one responsive screen: upload, library, and preview."
        actions={
          <>
            <button className="btn" onClick={onBackToWorkspace} disabled={!activeFileId}>Open Workspace</button>
            <button className="btn danger" onClick={onLogout}>Logout</button>
          </>
        }
      />

      <main className="upload-layout">
        <section className="upload-stage shell-card">
          <div className="section-title-row">
            <div>
              <div className="eyebrow">Step 1</div>
              <h3>Drop your files</h3>
            </div>
            <div className="status-chip">{selectedFiles.length} selected</div>
          </div>

          <label className="upload-zone" htmlFor="upload-input">
            <div className="upload-zone-icon">⬆</div>
            <div className="upload-zone-title">Drag files here or click to browse</div>
            <div className="upload-zone-subtitle">CSV, XLSX, XLS supported</div>
          </label>

          <input
            id="upload-input"
            type="file"
            className="hidden-input"
            multiple
            accept=".csv,.xlsx,.xls"
            onChange={(e) => onPickFiles(Array.from(e.target.files || []))}
          />

          <div className="pill-list">
            {selectedFiles.length ? selectedFiles.map((file) => (
              <span key={`${file.name}-${file.size}`} className="soft-pill">{file.name}</span>
            )) : <div className="empty-card compact">No files selected yet.</div>}
          </div>

          <div className="action-row wide-actions">
            <button className="btn primary btn-wide" onClick={onUpload} disabled={!selectedFiles.length || loading}>
              {loading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
        </section>

        <section className="library-stage shell-card">
          <div className="section-title-row">
            <div>
              <div className="eyebrow">Step 2</div>
              <h3>Uploaded library</h3>
            </div>
            <div className="status-chip">{files.length} files</div>
          </div>

          <div className="file-list-grid">
            {files.length ? files.map((file) => (
              <article key={file.id} className={`file-tile ${activeFileId === file.id ? 'active' : ''}`}>
                <div>
                  <div className="file-tile-name">{file.originalName}</div>
                  <div className="file-tile-meta">ID {file.id}</div>
                </div>
                <div className="file-tile-actions">
                  <button className="btn" onClick={() => onPreview(file.id)}>Preview</button>
                  <button className="btn primary" onClick={() => onOpenWorkspace(file.id)}>Analyze</button>
                </div>
              </article>
            )) : <div className="empty-card">Upload a file to see it here.</div>}
          </div>
        </section>

        <section className="preview-stage shell-card">
          <div className="section-title-row">
            <div>
              <div className="eyebrow">Step 3</div>
              <h3>Live preview</h3>
            </div>
            <div className="status-chip">{activePreview?.rows?.length || 0} rows</div>
          </div>

          {!activePreview ? (
            <div className="preview-empty-state">
              <div className="empty-card big">Choose a file from the library to preview its structure here.</div>
            </div>
          ) : (
            <>
              <div className="pill-list scroll-x">
                {/* {(activePreview.columns || []).map((col) => (
                  <span key={col} className="soft-pill">{col}</span>
                ))} */}
              </div>
              <DataTable columns={activePreview.columns || []} rows={activePreview.rows || []} className="tall-table" />
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default UploadScreen
