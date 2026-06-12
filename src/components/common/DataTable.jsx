
import React from 'react'

function DataTable({ columns = [], rows = [], className = '' }) {
  if (!columns.length) return <div className="empty-card">No tabular data available.</div>

  return (
    <div className={`table-wrap ${className}`.trim()}>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={`${idx}-${col}`}>{String(row?.[col] ?? '-')}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>No rows available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
