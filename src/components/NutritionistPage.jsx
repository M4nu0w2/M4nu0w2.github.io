import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { parseDietPdf } from '../lib/dietEngine.mjs';

const itemKey = (item, mealIndex, itemIndex) => item.id || `${mealIndex}_${itemIndex}`;
const percent = c => c && c.total ? Math.round(c.done / c.total * 100) : null;
const seenLabel = value => value ? new Date(value).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Mai';

async function api(route, csrf, body) {
  const options = { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(30000) };
  if (body !== undefined) Object.assign(options, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } });
  const response = await fetch(route, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'request_failed'), { status: response.status, code: data.error });
  return data;
}

function CopyInvite({ url }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus('Link copiato.'); }
    catch { setStatus('Copia non disponibile: seleziona il testo.'); }
  }
  return <div className="invite-box"><p className="muted">Invia questo link al paziente (WhatsApp, email…). Deve aprirlo con il suo account Google.</p><div className="invite-row"><input readOnly value={url} onFocus={event => event.target.select()} aria-label="Link di invito" /><button className="btn secondary small" onClick={copy}>Copia link</button></div><p role="status" aria-live="polite">{status}</p></div>;
}

function AddPatientForm({ csrf, onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [created, setCreated] = useState(null);
  async function save(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const patient = await api('/api/nutritionist/patients', csrf, { name, email });
      setCreated(patient); setName(''); setEmail('');
      onAdded();
    } catch (e) {
      setError(e.code === 'duplicate_patient' ? 'Hai già un paziente con questa email.' : e.code === 'validation' ? 'Inserisci nome e un’email Google valida.' : 'Salvataggio non riuscito. Riprova.');
    } finally { setSaving(false); }
  }
  if (!open) return <button className="btn primary" onClick={() => { setOpen(true); setCreated(null); }}>+ Nuovo paziente</button>;
  return <section className="settings-card nutri-form" aria-label="Nuovo paziente">
    {created ? <><h2>{created.name} aggiunto</h2><CopyInvite url={created.inviteUrl} /><div className="actions"><button className="btn secondary" onClick={() => setCreated(null)}>Aggiungi un altro</button><button className="btn primary" onClick={() => setOpen(false)}>Chiudi</button></div></>
      : <form onSubmit={save}><h2>Nuovo paziente</h2>
        <label className="form-field">Nome e cognome<input value={name} required maxLength={100} onChange={event => setName(event.target.value)} /></label>
        <label className="form-field">Email dell'account Google<input type="email" value={email} required maxLength={200} onChange={event => setEmail(event.target.value)} /></label>
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="actions"><button type="button" className="btn secondary" disabled={saving} onClick={() => setOpen(false)}>Annulla</button><button type="submit" className="btn primary" disabled={saving || !name.trim() || !email.trim()}>{saving ? 'Salvataggio…' : 'Crea invito'}</button></div>
      </form>}
  </section>;
}

function PlanUpload({ patient, csrf, onUploaded }) {
  const [loading, setLoading] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState(''), [done, setDone] = useState('');
  async function load(file) {
    if (!file) return;
    setError(''); setDone('');
    if (!/\.pdf$/i.test(file.name) || file.type && file.type !== 'application/pdf') { setError('Scegli un file PDF.'); return; }
    if (file.size > 30 * 1024 * 1024) { setError('Il PDF supera 30 MB.'); return; }
    setLoading(true);
    try {
      const data = await parseDietPdf(await file.arrayBuffer(), message => setProgress(String(message)));
      await api(`/api/nutritionist/patients/${patient.id}/plan`, csrf, { name: file.name, data });
      setDone(`Piano “${file.name.replace(/\.pdf$/i, '')}” assegnato. Il paziente lo riceve al prossimo accesso.`);
      onUploaded();
    } catch (e) { setError(e.message || 'Caricamento non riuscito.'); } finally { setLoading(false); }
  }
  return <div className="nutri-upload">
    <label className="drop-zone">▤ <strong>{patient.planName ? 'Sostituisci il piano (PDF)' : 'Assegna un piano (PDF)'}</strong><input aria-label={`PDF del piano per ${patient.name}`} type="file" accept="application/pdf,.pdf" disabled={loading} onChange={event => { load(event.target.files[0]); event.target.value = ''; }} /></label>
    {loading && <p role="status">Lettura PDF… {progress}</p>}
    {done && <p className="notice" role="status">{done}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <p className="muted">Il PDF non viene salvato sul server: viene letto nel browser e salvato solo il piano.</p>
  </div>;
}

function PatientDetail({ patient, csrf, refreshList }) {
  const [detail, setDetail] = useState(null), [error, setError] = useState(''), [day, setDay] = useState(null);
  const load = useCallback(async () => {
    try {
      const data = await api(`/api/nutritionist/patients/${patient.id}`, csrf);
      setDetail(data); setError('');
      setDay(current => current && data.plan?.data.days[current] ? current : data.plan?.data.days[data.day] ? data.day : Object.keys(data.plan?.data.days || {})[0] || null);
    } catch { setError('Dettaglio non disponibile. Riprova.'); }
  }, [patient.id, csrf]);
  useEffect(() => { load(); }, [load]);
  if (error) return <div className="nutri-detail"><p className="notice error" role="alert">{error}</p><button className="btn secondary small" onClick={load}>Riprova</button></div>;
  if (!detail) return <div className="nutri-detail"><p role="status">Caricamento…</p></div>;
  const { plan, tracking } = detail;
  const checked = day && tracking[day]?.checked?.value || {};
  const water = day && tracking[day]?.water?.value || 0;
  return <div className="nutri-detail">
    {detail.patient.inviteUrl && <CopyInvite url={detail.patient.inviteUrl} />}
    {plan ? <>
      <p className="muted">Piano: <strong>{plan.name}</strong> · assegnato il {new Date(plan.createdAt).toLocaleDateString('it-IT')}</p>
      {day && <>
        <div className="day-tabs" role="group" aria-label="Giorno">{Object.entries(plan.data.days).map(([key, value]) => <button key={key} className={`day-tab ${day === key ? 'active' : ''}`} aria-pressed={day === key} onClick={() => setDay(key)}>{(value.dayName || key).slice(0, 3)}</button>)}</div>
        <p className="muted">{day === detail.day ? 'Oggi' : plan.data.days[day].dayName || day} · Acqua: {water} bicchieri ({(water * .2).toLocaleString('it-IT')} L)</p>
        <div className="nutri-meals">{(plan.data.days[day].meals || []).map((meal, mi) => <section className="meal-card" key={meal.id || mi}>
          <div className="meal-heading"><h3>{meal.icon || '◷'} {meal.name || meal.mealName || 'Pasto'}</h3><span className="badge">{meal.items.filter((item, ii) => checked[itemKey(item, mi, ii)]).length}/{meal.items.length}</span></div>
          {meal.items.map((item, ii) => { const key = itemKey(item, mi, ii); const eaten = !!checked[key]; return <div className={`food-row ${eaten ? 'checked' : ''}`} key={key}><span className={`nutri-tick ${eaten ? 'done' : ''}`} aria-hidden="true">{eaten ? '✓' : '○'}</span><div className="food-content"><div className="food-name">{item.isSubItem && '↳ '}{item.name}</div></div><span className="food-qty">{item.qty}</span><span className="sr-only">{eaten ? 'consumato' : 'non consumato'}</span></div>; })}
        </section>)}</div>
      </>}
    </> : <p className="muted">Nessun piano assegnato.</p>}
    <PlanUpload patient={{ ...detail.patient, planName: plan?.name }} csrf={csrf} onUploaded={() => { load(); refreshList(); }} />
  </div>;
}

function PatientList({ session }) {
  const [list, setList] = useState(null), [error, setError] = useState(''), [expanded, setExpanded] = useState(null);
  const load = useCallback(async () => {
    try { setList(await api('/api/nutritionist/patients', session.csrf)); setError(''); }
    catch { setError('Elenco non disponibile. Controlla la connessione e riprova.'); }
  }, [session.csrf]);
  useEffect(() => { load(); }, [load]);
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
