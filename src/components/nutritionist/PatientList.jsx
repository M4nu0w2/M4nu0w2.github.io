import { useState } from 'react';
import { useNutriApi, useLoader } from './api.mjs';
import { AddPatientForm } from './AddPatientForm.jsx';
import { PatientDetail } from './PatientDetail.jsx';

const percent = c => c && c.total ? Math.round(c.done / c.total * 100) : null;
const seenLabel = value => value ? new Date(value).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Mai';

function PatientList({ session }) {
  const api = useNutriApi(session.csrf);
  const [list, error, load] = useLoader(() => api('/api/nutritionist/patients'), [session.csrf], 'Elenco non disponibile. Controlla la connessione e riprova.');
  const [expanded, setExpanded] = useState(null);
  const patients = list?.patients || [];
  return <>
    <div className="page-heading"><div><p className="eyebrow">LA TUA DASHBOARD</p><h1>I tuoi pazienti</h1><p className="muted">Compliance di oggi a colpo d'occhio. Espandi una riga per il dettaglio dei pasti.</p></div><AddPatientForm csrf={session.csrf} onAdded={load} /></div>
    {error && <div className="notice error" role="alert">{error} <button className="btn secondary small" onClick={load}>Riprova</button></div>}
    {!list && !error && <p role="status">Caricamento pazienti…</p>}
    {list && <div className="stats-grid"><section className="stat-card"><span className="muted">Pazienti</span><strong>{patients.length}</strong></section><section className="stat-card"><span className="muted">Attivi</span><strong>{patients.filter(p => p.status === 'active').length}</strong></section><section className="stat-card"><span className="muted">Inviti in attesa</span><strong>{patients.filter(p => p.status === 'pending').length}</strong></section></div>}
    {list && !patients.length && <section className="empty-state"><h2>Nessun paziente ancora.</h2><p className="muted">Aggiungi il primo paziente e invia il link di invito.</p></section>}
    <ul className="nutri-list">{patients.map(p => { const pct = percent(p.compliance); const open = expanded === p.id; return <li key={p.id} className={`nutri-row ${open ? 'open' : ''}`}>
      <button className="nutri-row-head" aria-expanded={open} onClick={() => setExpanded(open ? null : p.id)}>
        <span className="plan-avatar">{p.name.slice(0, 1).toUpperCase()}</span>
        <span className="nutri-id"><strong>{p.name}</strong><span className="muted">{p.email}</span></span>
        <span className={`badge ${p.status === 'active' ? 'active' : 'archived'}`}>{p.status === 'active' ? 'Attivo' : 'Invito inviato'}</span>
        <span className="nutri-cell"><span className="muted">Piano</span>{p.planName ? '✓' : '—'}</span>
        <span className="nutri-cell"><span className="muted">Ultimo accesso</span>{seenLabel(p.lastSeenAt)}</span>
        <span className="nutri-cell nutri-compliance"><span className="muted">Oggi</span>{pct === null ? '—' : <><progress value={p.compliance.done} max={p.compliance.total} aria-label={`Compliance di oggi di ${p.name}`} /> {pct}%</>}</span>
        <span className="nutri-caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && <PatientDetail patient={p} csrf={session.csrf} refreshList={load} />}
    </li>; })}</ul>
  </>;
}

export { PatientList };
