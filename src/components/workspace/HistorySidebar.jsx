
import React from 'react'

function HistorySidebar({ filteredHistory = [], historySearch, historyMode, onSearch, onMode, onOpen }) {
  return (
    <div className="history-panel shell-card">
      <div className="section-title-row compact-row">
        <div>
          <div className="eyebrow">Context</div>
          <h3>History</h3>
        </div>
      </div>

      <input className="field" value={historySearch} onChange={(e) => onSearch(e.target.value)} placeholder="Search history..." />
      <select className="field" value={historyMode} onChange={(e) => onMode(e.target.value)}>
        <option value="all">All</option>
        <option value="recent">Recent</option>
        <option value="withCharts">With charts</option>
        <option value="failed">Failed</option>
      </select>

      <div className="history-list">
        {filteredHistory.length ? filteredHistory.map((item, index) => (
          <button type="button" className="history-item" key={item.id || index} onClick={() => onOpen(item)}>
            <div className="history-item-title">{item.question || 'Untitled question'}</div>
            <div className="history-item-sub">{item.summary || item.status || 'Saved query'}</div>
          </button>
        )) : <div className="empty-card compact">No history available.</div>}
      </div>
    </div>
  )
}

export default HistorySidebar
