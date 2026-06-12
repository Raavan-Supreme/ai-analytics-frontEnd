
import React from 'react'

function AuthScreen({ email, password, loading, error, onEmail, onPassword, onLogin, onRegister }) {
  return (
    <div className="app-shell auth-shell">
      <section className="auth-hero shell-card">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="eyebrow">Analytics command center</div>
        <h2>Hackathoz Analytics Studio</h2>
        <p>New UI, same backend. Sign in and launch the full data workspace.</p>
        <div className="auth-grid">
          <input className="field" value={email} onChange={(e) => onEmail(e.target.value)} placeholder="Email" />
          <input className="field" type="password" value={password} onChange={(e) => onPassword(e.target.value)} placeholder="Password" />
        </div>
        <div className="row-actions">
          <button className="btn primary" onClick={onLogin} disabled={loading}>{loading ? 'Please wait...' : 'Login'}</button>
          <button className="btn" onClick={onRegister} disabled={loading}>Register</button>
        </div>
        {error ? <div className="error-box">{error}</div> : null}
      </section>
    </div>
  )
}

export default AuthScreen
