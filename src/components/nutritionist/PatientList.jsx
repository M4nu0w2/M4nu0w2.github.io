import { useEffect, useMemo, useRef, useState } from 'react';
import { useNutriApi, useLoader } from './api.mjs';
import { AddPatientForm } from './AddPatientForm.jsx';
import { PatientDetail } from './PatientDetail.jsx';

const percent = c => c && c.total ? Math.round(c.done / c.total * 100) : null;
const seenLabel = value => value ? new Date(value).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Mai';

const STALE_DAYS = 7;
const LOW_COMPLIANCE_PCT = 50;
const REFRESH_INTERVAL_MS = 120000; // a couple of minutes: a nutritionist left on this tab sees new signups without reloading.

// Thresholds are an implementation choice (the ticket leaves them open), not a PO decision.
const FILTERS = [
  ['all', 'Tutti', () => true],
  ['low-compliance', 'Compliance bassa', p => { const pct = percent(p.compliance); return pct !== null && pct < LOW_COMPLIANCE_PCT; }],
  ['stale', `Senza accesso da ${STALE_DAYS}+ giorni`, p => p.status === 'active' && (!p.lastSeenAt || Date.now() - new Date(p.lastSeenAt).getTime() > STALE_DAYS * 86400000)],
  ['no-plan', 'Senza piano', p => !p.planName],
  ['pending', 'Invito in attesa', p => p.status === 'pending']
];

function PatientList({ session }) {
  const api = useNutriApi(session.csrf);
  const [list, error, load] = useLoader(() => api('/api/nutritionist/patients'), [session.csrf], 'Elenco non disponibile. Controlla la connessione e riprova.');
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [openSignal, setOpenSignal] = useState(0);
  const searchRef = useRef(null);

  // Refresh on return to the tab and every couple of minutes while it stays open; no polling while hidden.
  useEffect(() => {
    function onVisible() { if (document.visibilityState === 'visible') load(); }
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(onVisible, REFRESH_INTERVAL_MS);
    return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(interval); };
  }, [load]);

  // "/" focuses search, "n" opens the new-patient form; both ignored while typing anywhere else.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.key === '/') { event.preventDefault(); searchRef.current?.focus(); }
      else if (event.key.toLowerCase() === 'n') { event.preventDefault(); setOpenSignal(value => value + 1); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const patients = list?.patients || [];
  const activeFilter = FILTERS.find(([value]) => value === filter) || FILTERS[0];
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('it-IT');
    return patients
      .filter(p => !q || p.name.toLocaleLowerCase('it-IT').includes(q) || p.email.toLocaleLowerCase('it-IT').includes(q))
      .filter(activeFilter[2])
      .slice().sort((a, b) => a.name.localeCompare(b.name, 'it-IT'));
  }, [patients, query, filter]);

  return <>
    <div className="page-heading"><div><p className="eyebrow">LA TUA DASHBOARD</p><h1>I tuoi pazienti</h1><p className="muted">Compliance di oggi a colpo d'occhio. Espandi una riga per il dettaglio dei pasti.</p></div><AddPatientForm csrf={session.csrf} onAdded={load} openSignal={openSignal} /></div>
    {error && <div className="notice error" role="alert">{error} <button className="btn secondary small" onClick={load}>Riprova</button></div>}
    {!list && !error && <p role="status">Caricamento pazienti…</p>}
    {list && <div className="stats-grid"><section className="stat-card"><span className="muted">Pazienti</span><strong>{patients.length}</strong></section><section className="stat-card"><span className="muted">Attivi</span><strong>{patients.filter(p => p.status === 'active').length}</strong></section><section className="stat-card"><span className="muted">Inviti in attesa</span><strong>{patients.filter(p => p.status === 'pending').length}</strong></section></div>}
    {list && !patients.length && <section className="empty-state"><h2>Nessun paziente ancora.</h2><p className="muted">Aggiungi il primo paziente e invia il link di invito.</p></section>}
    {list && Boolean(patients.length) && <div className="toolbar">
      <label className="search-input"><span className="sr-only">Cerca un paziente per nome o email</span><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca per nome o email… (premi /)" /></label>
      <div className="filter-tabs" role="group" aria-label="Filtra pazienti">{FILTERS.map(([value, label]) => <button key={value} className={`btn ${filter === value ? 'primary' : 'secondary'}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    </div>}
    {list && Boolean(patients.length) && !shown.length && <section className="empty-state"><h2>Nessun paziente trovato.</h2><p className="muted">Prova un'altra ricerca o cambia filtro.</p></section>}
    <ul className="nutri-list">{shown.map(p => { const pct = percent(p.compliance); const open = expanded === p.id; return <li key={p.id} className={`nutri-row ${open ? 'open' : ''}`}>
      <button className="nutri-row-head" aria-expanded={open} onClick={() => setExpanded(open ? null : p.id)}>
        <span className="plan-avatar">{p.name.slice(0, 1).toUpperCase()}</span>
        <span className="nutri-id"><strong>{p.name}</strong><span className="muted">{p.email}</span></span>
        <span className={`badge ${p.status === 'active' ? 'active' : 'archived'}`}>{p.status === 'active' ? 'Attivo' : 'Invito inviato'}</span>
        <span className="nutri-cell"><span className="muted">Piano</span>{p.planName ? '✓' : '—'}</span>
        <span className="nutri-cell"><span className="muted">Ultimo accesso</span>{seenLabel(p.lastSeenAt)}</span>
        <span className="nutri-cell nutri-compliance"><span className="muted">Oggi</span>{pct === null ? '—' : <><progress value={p.compliance.done} max={p.compliance.total} aria-label={`Compliance di oggi di ${p.name}`} aria-valuetext={`${pct}%`} /> {pct}%</>}</span>
        <span className="nutri-caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && <PatientDetail patient={p} csrf={session.csrf} refreshList={load} />}
    </li>; })}</ul>
  </>;
}

export { PatientList };
