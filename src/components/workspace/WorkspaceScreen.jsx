import React, { useEffect, useMemo, useRef } from 'react'
import TopBar from '../common/TopBar'
import ChatWindow from './ChatWindow'
import ResultPanel from './ResultPanel'

function WorkspaceScreen({
  activeFile,
  chatScrollRef,
  chatMessages,
  question,
  chartType,
  relationships,
  selectedRelationshipIds,
  loading,
  isQuerying,
  activeFileId,
  error,
  latestResult,
  dashboardName,
  dashboards,
  onBackToUploads,
  onLogout,
  onQuestion,
  onChartType,
  onRelationshipToggle,
  onAsk,
  onDashboardName,
  onSaveDashboard,
  onLoadDashboard,
}) {
  const resultsRef = useRef(null)

  const hasResults = useMemo(() => {
    const hasSummary = Boolean((latestResult?.summary || '').trim())
    const hasRows = Array.isArray(latestResult?.rows) && latestResult.rows.length > 0
    const hasColumns = Array.isArray(latestResult?.columns) && latestResult.columns.length > 0
    const hasCharts = Array.isArray(latestResult?.charts) && latestResult.charts.length > 0
    return hasSummary || hasRows || hasColumns || hasCharts
  }, [latestResult])

  useEffect(() => {
    if (!hasResults || !resultsRef.current) return
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hasResults, latestResult])

  return (
    <div className="app-shell theme-sunrise">
      <TopBar
        title="Analytics Workspace"
        subtitle={activeFile ? `Analyzing: ${activeFile.originalName}` : 'Select a file to start analysis'}
        actions={
          <>
            <button className="btn" onClick={onBackToUploads}>Back to Uploads</button>
            <button className="btn danger" onClick={onLogout}>Logout</button>
          </>
        }
      />

      <main className="workspace-single-column">
        <section className="workspace-chat-only">
          <ChatWindow
            chatScrollRef={chatScrollRef}
            chatMessages={chatMessages}
            question={question}
            chartType={chartType}
            relationships={relationships}
            selectedRelationshipIds={selectedRelationshipIds}
            loading={loading}
            isQuerying={isQuerying}
            activeFileId={activeFileId}
            error={error}
            onQuestion={onQuestion}
            onChartType={onChartType}
            onRelationshipToggle={onRelationshipToggle}
            onAsk={onAsk}
          />
        </section>

        <section className="workspace-results-below" ref={resultsRef}>
          <ResultPanel
            latestResult={latestResult}
            chartType={chartType}
            dashboardName={dashboardName}
            dashboards={dashboards}
            onDashboardName={onDashboardName}
            onSaveDashboard={onSaveDashboard}
            onLoadDashboard={onLoadDashboard}
          />
        </section>
      </main>
    </div>
  )
}

export default WorkspaceScreen
