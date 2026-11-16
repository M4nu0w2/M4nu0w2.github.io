import { Navigate, Route, Routes } from 'react-router-dom';
import { PatientList } from './nutritionist/PatientList.jsx';

export default function NutritionistPage({ session, logout }) {
  return <div className="app-shell nutri-shell"><a className="skip-link" href="#main-content">Vai al contenuto</a>
    <aside className="sidebar"><span className="brand">N<span>✦</span> Nutrà</span><p className="eyebrow">AREA NUTRIZIONISTA</p>
      <nav aria-label="Navigazione principale"><span className="nav-link active" aria-current="page"><span className="nav-icon" aria-hidden="true">☰</span><span className="nav-label">Pazienti</span></span></nav>
      <div className="sidebar-bottom"><p className="muted">I piani assegnati e la compliance dei pazienti sono salvati sul server.</p></div>
    </aside>
    <div className="workspace"><header className="topbar"><span className="badge nutri-badge">Nutrizionista</span><span className="account-chip" title={session.email}><span className="plan-avatar">{session.name?.slice(0, 1).toUpperCase() || 'N'}</span><span id="account-name">{session.name}</span></span><button className="btn secondary small" onClick={logout}>Esci</button></header>
      <main id="main-content" className="page" tabIndex={-1}><Routes><Route path="/nutritionist" element={<PatientList session={session} />} /><Route path="*" element={<Navigate to="/nutritionist" replace />} /></Routes></main>
    </div>
  </div>;
}
