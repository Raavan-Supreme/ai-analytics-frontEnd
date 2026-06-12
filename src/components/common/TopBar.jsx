
import React from 'react'

function TopBar({ title, subtitle, actions }) {
  return (
    <header className="topbar shell-card">
      <div>
        <div className="eyebrow">Hackathoz Winner UI</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="row-actions">{actions}</div>
    </header>
  )
}

export default TopBar
