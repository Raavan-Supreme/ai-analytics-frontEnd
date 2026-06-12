import React from 'react'
import { CHART_TYPES } from '../../constants/ui'

function ChatWindow({
  chatScrollRef,
  chatMessages = [],
  question,
  chartType,
  relationships = [],
  selectedRelationshipIds = [],
  loading,
  isQuerying,
  activeFileId,
  error,
  onQuestion,
  onChartType,
  onRelationshipToggle,
  onAsk,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!question.trim() || loading || isQuerying || !activeFileId) return
    onAsk()
  }

  return (
    <div className="chat-panel-modern shell-card compact-chat-shell">
      <div className="section-title-row compact-row">
        <div>
          <div className="eyebrow">AI analyst</div>
          <h3>Conversation</h3>
        </div>
        <div className="status-chip">{activeFileId ? 'Connected' : 'No file'}</div>
      </div>

      <div className="chat-scroll-modern compact-chat-scroll" ref={chatScrollRef}>
        {chatMessages.length ? chatMessages.map((msg, idx) => {
          const isUser = msg.role === 'user'

          return (
            <div key={idx} className={`message-row ${isUser ? 'user' : 'assistant'}`}>
              <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{msg.at ? new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            </div>
          )
        }) : <div className="empty-card compact">Start by asking a question about the selected file.</div>}
      </div>

      <form className="chat-composer-modern compact-composer" onSubmit={handleSubmit}>
        <div className="compact-composer-top">
          <textarea className="field composer-textarea compact-textarea" value={question} onChange={(e) => onQuestion(e.target.value)} placeholder="Ask anything about your file..." />
          <div className="compact-controls">
            <select className="field compact-field" value={chartType} onChange={(e) => onChartType(e.target.value)}>
              {CHART_TYPES.map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
            </select>
            <button className="btn primary" type="submit" disabled={loading || isQuerying || !activeFileId}>{isQuerying ? 'Running...' : 'Run Analysis'}</button>
          </div>
        </div>

        {relationships.length > 0 ? (
          <div className="relationship-wrap compact-relationships">
            <div className="eyebrow">Relationships</div>
            <div className="relation-grid compact-relation-grid">
              {relationships.map((rel) => (
                <label key={rel.relationshipId} className="relation-card compact-relation-card">
                  <input type="checkbox" checked={selectedRelationshipIds.includes(rel.relationshipId)} onChange={(e) => onRelationshipToggle(rel.relationshipId, e.target.checked)} />
                  <span>{rel.leftName} ({rel.leftKey}) ↔ {rel.rightName} ({rel.rightKey}) · {rel.joinType}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <div className="error-box">{error}</div> : null}
      </form>
    </div>
  )
}

export default ChatWindow
