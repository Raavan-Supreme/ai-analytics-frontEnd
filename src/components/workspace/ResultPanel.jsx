import React from 'react'
import DataTable from '../common/DataTable'
import AnimatedCharts from '../charts/AnimatedCharts'

function ResultPanel({ latestResult, chartType, dashboardName, dashboards = [], onDashboardName, onSaveDashboard, onLoadDashboard }) {
  const rows = Array.isArray(latestResult?.rows) ? latestResult.rows : []
  const columns = Array.isArray(latestResult?.columns) ? latestResult.columns : []
  const charts = Array.isArray(latestResult?.charts) ? latestResult.charts : []
  const summary = latestResult?.summary || ''
  const hasRows = rows.length > 0
  const hasColumns = columns.length > 0
  const hasCharts = hasRows && hasColumns
  const hasDashboards = dashboards.length > 0
  const showAnything = summary || hasCharts || hasColumns || hasDashboards

  if (!showAnything) return null

  return (
    <div className="results-stack-v3">
      {summary ? (
        <section className="results-summary shell-card">
          <div className="section-title-row compact-row">
            <div>
              <div className="eyebrow">Insights</div>
              <h3>Answer</h3>
            </div>
            <div className="status-chip">{rows.length} rows</div>
          </div>
          <div className="summary-text-block">{summary}</div>
        </section>
      ) : null}

      {(hasDashboards || hasColumns || hasCharts) ? (
        <section className="results-toolbar shell-card">
          <input className="field" value={dashboardName} onChange={(e) => onDashboardName(e.target.value)} placeholder="Dashboard name" />
          <div className="action-row wrap-row">
            <button className="btn primary" onClick={onSaveDashboard}>Save Dashboard</button>
            {dashboards.slice(0, 6).map((d, idx) => (
              <button key={d.id || idx} className="btn" onClick={() => onLoadDashboard(d)}>{d.name || `Dashboard ${idx + 1}`}</button>
            ))}
          </div>
        </section>
      ) : null}

      {hasColumns ? (
        <section className="results-table shell-card full-width-block clip-section">
          <div className="section-title-row compact-row">
            <div>
              <div className="eyebrow">Records</div>
              <h3>Table</h3>
            </div>
            <div className="status-chip">{columns.length} cols</div>
          </div>
          <DataTable columns={columns} rows={rows} className="wide-table" />
        </section>
      ) : null}

      {hasCharts ? (
        <section className="results-visuals shell-card full-width-block clip-section">
          <div className="section-title-row compact-row">
            <div>
              <div className="eyebrow">Visuals</div>
              <h3>Charts</h3>
            </div>
            <div className="status-chip">{chartType.toUpperCase()}</div>
          </div>
          <AnimatedCharts rows={rows} columns={columns} requestedType={chartType} chartMeta={charts} />
        </section>
      ) : null}
    </div>
  )
}

export default ResultPanel
