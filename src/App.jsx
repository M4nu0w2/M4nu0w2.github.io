import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { createStore } from './lib/planStore.mjs';
import ChatPage from './components/ChatPage.jsx';
import { parseProgeoPdf, getSampleProgeoDiet, buildShoppingList, getFoodChoices } from './lib/dietEngine.mjs';

const dateLabel = value => new Date(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const itemKey = (item, mealIndex, itemIndex) => item.id || `${mealIndex}_${itemIndex}`;
const todayKey = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'][new Date().getDay()];

function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current, opener = document.activeElement; dialog.showModal(); return () => { dialog.close(); if (opener?.isConnected) opener.focus(); }; }, []);
  return <dialog ref={ref} className="modal" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}><div className="modal-heading"><h2>{title}</h2><button className="btn secondary small" onClick={onClose} aria-label="Chiudi">✕</button></div>{children}</dialog>;
}

function Login() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  async function check() {
    setStatus(null); setError('');
    try { const response = await fetch('/auth/status', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(10000) }); if (!response.ok) throw new Error(); setStatus(await response.json()); }
    catch { setError('Connessione non disponibile. Controlla la rete e riprova.'); }
  }
  useEffect(() => { check(); }, []);
  const messages = { expired: 'La sessione è terminata. Accedi di nuovo.', account_changed: 'Account cambiato. Accedi di nuovo.', cancelled: 'Accesso annullato.', invalid_login: 'Accesso non riuscito. Riprova con Google.', not_allowed: 'Questo account non è abilitato.', too_many_attempts: 'Troppi tentativi. Attendi un minuto.' };
  return <main className="login-page"><section className="login-card"><span className="brand">N<span>✦</span> NutriPro</span><p className="eyebrow">IL TUO SPAZIO PERSONALE</p><h1>Il tuo piano.<br />Ogni giorno.</h1><p className="muted">Accedi per ritrovare i tuoi piani alimentari, seguire i pasti e organizzare la settimana.</p><p id="login-status" role="status">{error || messages[new URLSearchParams(location.search).get('error')] || (status ? status.configured ? 'Continua con il tuo account Google.' : 'Accesso Google non ancora disponibile.' : 'Verifica accesso…')}</p>{status?.configured && <a id="google-login" className="btn primary" href="/auth/google">Accedi con Google</a>}{(error || status && !status.configured) && <button className="btn secondary" onClick={check}>Riprova</button>}</section></main>;
}

function Protected() {
  const [session, setSession] = useState(null);
  const [locked, setLocked] = useState(true);
  const [logoutError, setLogoutError] = useState('');
  const identity = useRef(null);
  const loggingOut = useRef(false);
  useEffect(() => {
    let disposed = false, pending = false, expiry;
    const leave = (reason = 'expired') => { setLocked(true); location.replace(`/login?error=${reason}`); };
    async function verify() {
      if (pending || disposed || loggingOut.current) return;
      pending = true;
      try {
        const response = await fetch('/api/session', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error();
        const value = await response.json();
        if (!value.sub || !value.csrf || value.expiresAt <= Date.now()) throw new Error();
        if (identity.current && identity.current.sub !== value.sub) { leave('account_changed'); return; }
        if (disposed || loggingOut.current) return;
        identity.current = value; setSession(value); setLocked(document.visibilityState === 'hidden');
        clearTimeout(expiry); expiry = setTimeout(leave, Math.max(0, value.expiresAt - Date.now()));
      } catch { if (!disposed) leave(); } finally { pending = false; }
    }
    const returnToPage = () => { setLocked(true); if (document.visibilityState !== 'hidden') verify(); };
    const hide = () => setLocked(true);
    verify(); const interval = setInterval(verify, 60000);
    window.addEventListener('focus', returnToPage); document.addEventListener('visibilitychange', returnToPage); window.addEventListener('pageshow', returnToPage); window.addEventListener('pagehide', hide);
    return () => { disposed = true; clearInterval(interval); clearTimeout(expiry); window.removeEventListener('focus', returnToPage); document.removeEventListener('visibilitychange', returnToPage); window.removeEventListener('pageshow', returnToPage); window.removeEventListener('pagehide', hide); };
  }, []);
  async function logout() {
    loggingOut.current = true;
    setLocked(true);
    try { const response = await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-Token': identity.current.csrf }, signal: AbortSignal.timeout(10000) }); if (!response.ok && response.status !== 401) throw new Error(); location.replace('/login'); }
    catch { setLogoutError('Uscita non riuscita. Controlla la connessione e riprova.'); }
  }
  const gate = <main className="login-page"><section className="login-card"><p role="status">{logoutError || 'Verifica della sessione…'}</p>{logoutError && <button className="btn secondary" onClick={logout}>Riprova uscita</button>}</section></main>;
  if (!session) return gate;
  return <>{locked && gate}<div hidden={locked} style={locked ? { visibility: 'hidden' } : undefined} inert={locked ? true : undefined}>{/* Keep state during focus verification, including the native file picker. */}<Workspace session={session} logout={logout} /></div></>;
}

function Workspace({ session, logout }) {
  const [store] = useState(() => createStore(localStorage, session.sub));
  const [archive, setArchive] = useState(null);
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState(null);
  const [calculator, setCalculator] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    try { setArchive(store.migrate()); } catch (e) { setError(e.message); }
    const refresh = event => { if (event.key === store.key) try { setArchive(store.read()); setError(''); } catch (e) { setError(e.message); setArchive(null); } };
    window.addEventListener('storage', refresh); return () => window.removeEventListener('storage', refresh);
  }, [store]);
  function mutate(operation) { try { setArchive(operation()); setError(''); return true; } catch (e) { setError(e.message); try { setArchive(store.read()); } catch { setArchive(null); } return false; } }
  const active = archive?.plans.find(plan => plan.id === archive.activeId);
  function beginImport(mode = 'new') { if (!archive) return; setImportMode({ mode, expectedRevision: archive.revision, targetId: active?.id }); }
  function activate(id) { if (mutate(() => store.setActive(id, archive.revision))) navigate(id ? '/' : '/plans'); }
  return <div className="app-shell"><a className="skip-link" href="#main-content">Vai al contenuto</a><aside className="sidebar"><Link to="/" className="brand">N<span>✦</span> NutriPro</Link><p className="eyebrow">IL TUO BENESSERE</p><nav aria-label="Navigazione principale"><NavLink to="/" end className="nav-link">◉ Oggi</NavLink><NavLink to="/plans" className="nav-link">▤ I miei piani <span>{archive?.plans.length || 0}</span></NavLink><NavLink to="/chat" className="nav-link">Assistente</NavLink><button className="nav-link" onClick={() => setCalculator(true)}>⇄ Calcolatore</button></nav><div className="sidebar-bottom"><p className="muted">Piani salvati in questo browser, separati per account.</p></div></aside><div className="workspace"><header className="topbar"><span className="muted">Una buona abitudine alla volta.</span><span className="account-chip" title={session.email}><span className="plan-avatar">{session.name?.slice(0, 1).toUpperCase() || 'N'}</span><span id="account-name">{session.name}</span></span><button className="btn secondary small" onClick={logout}>Esci</button></header><main id="main-content" className="page" tabIndex={-1}>{error && <div className="notice error" role="alert">{error}</div>}{!archive && !error && <p role="status">Caricamento piani…</p>}{archive && <Routes><Route path="/" element={<Dashboard plan={active} hasPlans={!!archive.plans.length} beginImport={beginImport} saveTracking={(field, value) => mutate(() => store.saveTracking(active.id, field, value))} />} /><Route path="/plans" element={<PlansPage archive={archive} beginImport={beginImport} activate={activate} />} /><Route path="/plans/:id" element={<PlanDetail archive={archive} activate={activate} />} /><Route path="/chat" element={<ChatPage session={session} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>}</main></div>{importMode && <ImportDialog operation={importMode} active={active} onClose={() => setImportMode(null)} onSave={(data, sourceName) => { const ok = mutate(() => store.importPlan(data, { ...importMode, sourceName })); if (ok) { setImportMode(null); navigate('/'); } return ok; }} />}{calculator && <Calculator onClose={() => setCalculator(false)} />}</div>;
}

function DayPicker({ days, day, setDay }) { return <div className="day-tabs" role="group" aria-label="Giorno del piano">{Object.entries(days).map(([key, value]) => <button key={key} className={`day-tab ${day === key ? 'active' : ''}`} aria-pressed={day === key} onClick={() => setDay(key)}>{value.dayName || key}</button>)}</div>; }
function Meals({ plan, day, readonly = false, toggle }) {
  return <div className="meal-list">{(plan.data.days[day]?.meals || []).map((meal, mi) => <section className="meal-card" key={meal.id || mi}><div className="meal-heading"><h2>{meal.icon || '◷'} {meal.name || meal.mealName || 'Pasto'}</h2>{!readonly && <span className="badge">{meal.items.filter((item, ii) => plan.checked?.[day]?.[itemKey(item, mi, ii)]).length}/{meal.items.length}</span>}</div>{meal.items.map((item, ii) => { const key = itemKey(item, mi, ii), checked = !!plan.checked?.[day]?.[key]; const content = <><div className="food-content"><div className="food-name">{item.isSubItem && '↳ '}{item.name}</div>{item.conversionNote && <p className="muted">{item.conversionNote}</p>}{getFoodChoices(item).length > 1 && <p className="alternatives">oppure {getFoodChoices(item).slice(1).map(choice => `${choice.name}${choice.qty ? ` · ${choice.qty}` : ''}`).join(' oppure ')}</p>}</div><span className="food-qty">{item.qty}</span></>; return readonly ? <div className="food-row" key={key}>{content}</div> : <label className={`food-row ${checked ? 'checked' : ''}`} key={key}><input className="food-check" type="checkbox" checked={checked} onChange={() => toggle(key)} aria-label={`${item.name} consumato`} />{content}</label>; })}</section>)}{!plan.data.days[day]?.meals?.length && <p className="muted">Nessun pasto per questo giorno.</p>}</div>;
}
function Dashboard({ plan, hasPlans, beginImport, saveTracking }) {
  const [day, setDay] = useState(todayKey);
  const [shopping, setShopping] = useState(false);
  useEffect(() => { if (plan && !plan.data.days[day]) setDay(Object.keys(plan.data.days)[0]); }, [plan, day]);
  if (!plan) return <section id="upload-overlay" className="empty-state"><p className="eyebrow">IL TUO PERCORSO INIZIA QUI</p><h1>{hasPlans ? 'Scegli il tuo piano attivo.' : 'Benvenuto nel tuo nuovo spazio.'}</h1><p className="muted">{hasPlans ? 'I tuoi piani precedenti sono conservati nello storico. Attivane uno o importa il più recente.' : 'Carica il PDF del tuo piano alimentare. Ritroverai qui pasti, alternative e progressi quotidiani.'}</p><div className="actions"><button className="btn primary" onClick={() => beginImport()}>Carica il tuo PDF</button>{hasPlans && <Link className="btn secondary" to="/plans">Vai ai miei piani</Link>}</div></section>;
  const items = (plan.data.days[day]?.meals || []).flatMap((meal, mi) => meal.items.map((item, ii) => itemKey(item, mi, ii)));
  const completed = items.filter(key => plan.checked?.[day]?.[key]).length;
  const water = plan.water?.[day] || 0;
  function toggle(key) { saveTracking('checked', { ...plan.checked, [day]: { ...plan.checked?.[day], [key]: !plan.checked?.[day]?.[key] } }); }
  function setWater(value) { saveTracking('water', { ...plan.water, [day]: Math.max(0, Math.min(12, value)) }); }
  return <><div className="page-heading"><div><p className="eyebrow">IL TUO PIANO ATTIVO</p><h1>Il menu di oggi</h1><p className="muted">{plan.name}</p></div><div className="actions"><Link className="btn secondary" to="/plans">Gestisci piani</Link><button id="btn-export-shopping" className="btn primary" onClick={() => setShopping(true)}>Esporta lista della spesa</button></div></div><div className="stats-grid"><section className="stat-card"><span className="muted">Progressi del giorno</span><strong>{completed}<small> / {items.length} alimenti</small></strong><progress value={completed} max={items.length || 1} aria-label="Alimenti consumati" /></section><section className="stat-card"><span className="muted">Idratazione</span><strong>{(water * .2).toLocaleString('it-IT')}<small> / 2,4 litri</small></strong></section><section className="stat-card"><span className="muted">Il tuo piano</span><strong>{Object.keys(plan.data.days).length}<small> giorni di menu</small></strong></section></div><DayPicker days={plan.data.days} day={day} setDay={setDay} /><div className="dashboard-grid"><Meals plan={plan} day={day} toggle={toggle} /><aside className="water-card"><p className="eyebrow">PICCOLE BUONE ABITUDINI</p><h2>Un bicchiere alla volta</h2><p className="muted">Ogni bicchiere vale 200 ml.</p><strong id="water-badge">{water} / 12 ({(water * .2).toLocaleString('it-IT')} L)</strong><div className="water-grid">{Array.from({ length: 12 }, (_, i) => <button key={i} className={`glass ${water > i ? 'active' : ''}`} aria-label={`${i + 1} bicchieri`} aria-pressed={water > i} onClick={() => setWater(i + 1)}>♧</button>)}</div><div className="water-controls"><button id="btn-water-minus" className="btn secondary" aria-label="Togli un bicchiere" disabled={!water} onClick={() => setWater(water - 1)}>−</button><button id="btn-water-plus" className="btn primary" aria-label="Aggiungi un bicchiere" disabled={water >= 12} onClick={() => setWater(water + 1)}>+</button></div></aside></div>{shopping && <Shopping plan={plan} day={day} onClose={() => setShopping(false)} />}</>;
}

function PlansPage({ archive, beginImport, activate }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all');
  const plans = [...archive.plans].reverse().filter(plan => plan.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (filter === 'all' || (filter === 'active' ? plan.id === archive.activeId : plan.id !== archive.activeId)));
  return <><div className="page-heading"><div><p className="eyebrow">IL TUO PERCORSO, NEL TEMPO</p><h1>I miei piani</h1><p className="muted">Un piano attivo. Tutti i precedenti sempre a disposizione.</p></div><button className="btn primary" onClick={() => beginImport()}>+ Nuovo piano</button></div><div className="stats-grid"><section className="stat-card"><span className="muted">Piani conservati</span><strong>{archive.plans.length}</strong></section><section className="stat-card"><span className="muted">Piano attivo</span><strong>{archive.activeId ? '1' : '0'}<small> alla volta</small></strong></section><section className="stat-card"><span className="muted">Nello storico</span><strong>{archive.plans.length - (archive.activeId ? 1 : 0)}</strong></section></div><div className="toolbar"><label className="search-input"><span className="sr-only">Cerca un piano</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca un piano…" /></label><div className="filter-tabs" role="group" aria-label="Filtra piani">{[['all', 'Tutti'], ['active', 'Attivo'], ['archived', 'Precedenti']].map(([value, label]) => <button key={value} className={`btn ${filter === value ? 'primary' : 'secondary'}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div><div className="plans-grid">{plans.map(plan => { const active = plan.id === archive.activeId; return <article className={`plan-card ${active ? 'active-plan' : ''}`} key={plan.id}><div className="plan-card-header"><span className="plan-avatar">▤</span><span className={`badge ${active ? 'active' : 'archived'}`}>{active ? 'Attivo' : 'Precedente'}</span></div><h2>{plan.name}</h2><p className="plan-meta">Importato il {dateLabel(plan.createdAt)}</p>{plan.updatedAt !== plan.createdAt && <p className="plan-meta">Sostituito il {dateLabel(plan.updatedAt)}</p>}<p className="muted">{Object.keys(plan.data.days).length} giorni · {Object.values(plan.data.days).reduce((count, day) => count + day.meals.length, 0)} pasti</p><div className="plan-actions"><Link className="btn secondary" to={`/plans/${plan.id}`}>Consulta piano</Link><button className={`btn ${active ? 'secondary' : 'primary'}`} onClick={() => activate(active ? null : plan.id)}>{active ? 'Disattiva' : 'Rendi attivo'}</button>{active && <button className="btn danger small" onClick={() => beginImport('replace')}>Sostituisci PDF</button>}</div></article>; })}</div>{!plans.length && <section className="empty-state"><h2>{archive.plans.length ? 'Nessun piano trovato.' : 'Il tuo archivio ti aspetta.'}</h2><p className="muted">{archive.plans.length ? 'Prova un altro nome o cambia filtro.' : 'Importa il primo PDF per iniziare.'}</p></section>}<p className="muted">Un nuovo piano archivia il precedente senza cancellarlo. Sostituisci PDF aggiorna solo il piano attivo e richiede due conferme.</p></>;
}
function PlanDetail({ archive, activate }) {
  const { id } = useParams(), plan = archive.plans.find(item => item.id === id);
  const [day, setDay] = useState('lun');
  useEffect(() => { if (plan && !plan.data.days[day]) setDay(Object.keys(plan.data.days)[0]); }, [plan, day]);
  if (!plan) return <section className="empty-state"><h1>Piano non trovato.</h1><Link className="btn secondary" to="/plans">Torna ai piani</Link></section>;
  return <><Link className="muted" to="/plans">← Tutti i piani</Link><div className="page-heading"><div><p className="eyebrow">CONSULTAZIONE DEL PIANO</p><h1>{plan.name}</h1><p className="muted">Importato il {dateLabel(plan.createdAt)} · {archive.activeId === id ? 'Piano attivo' : 'Piano precedente'}</p></div>{archive.activeId !== id ? <button className="btn primary" onClick={() => activate(id)}>Rendi attivo</button> : <Link className="btn primary" to="/">Segui questo piano</Link>}</div><div className="notice">Stai consultando il piano. Le spunte e l’acqua si aggiornano dalla pagina Oggi, solo per il piano attivo.</div><DayPicker days={plan.data.days} day={day} setDay={setDay} /><Meals plan={plan} day={day} readonly /></>;
}

function ImportDialog({ operation, active, onClose, onSave }) {
  const replacement = operation.mode === 'replace';
  const [firstConfirm, setFirstConfirm] = useState(!replacement), [finalConfirm, setFinalConfirm] = useState(false);
  const [parsed, setParsed] = useState(null), [source, setSource] = useState(''), [loading, setLoading] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState('');
  async function load(file) {
    if (!file) return;
    setParsed(null); setFinalConfirm(false); setError('');
    if (!/\.pdf$/i.test(file.name) || file.type && file.type !== 'application/pdf') { setError('Scegli un file PDF.'); return; }
    if (file.size > 30 * 1024 * 1024) { setError('Il PDF supera 30 MB. Scegli un file più piccolo.'); return; }
    setLoading(true); setSource(file.name);
    try { const data = await parseProgeoPdf(await file.arrayBuffer(), message => setProgress(String(message))); if (!Object.values(data?.days || {}).some(day => day.meals?.some(meal => meal.items?.length))) throw new Error('Nessun piano alimentare leggibile nel PDF.'); setParsed(data); }
    catch (e) { setError(e.message || 'PDF non leggibile.'); } finally { setLoading(false); }
  }
  return <Modal title={replacement ? 'Sostituisci il piano attuale' : 'Importa un nuovo piano'} onClose={loading ? () => {} : onClose}>{replacement && <div className="notice warning"><strong>Operazione distruttiva</strong><p>Il contenuto di “{active?.name}”, le spunte e il conteggio acqua saranno sostituiti. Gli altri piani restano conservati.</p></div>}{!firstConfirm ? <><p>Conferma di voler sostituire questo piano prima di selezionare il nuovo PDF.</p><button className="btn danger" onClick={() => setFirstConfirm(true)}>Confermo: voglio sostituire il piano attuale</button></> : <><p className="muted">{replacement ? 'Scegli il PDF corretto. Potrai verificarlo prima della conferma finale.' : 'Il nuovo piano diventerà attivo. Il precedente resterà disponibile nello storico.'}</p><label className="drop-zone">▤ <strong>Scegli il PDF del piano</strong><input aria-label="PDF del piano" type="file" accept="application/pdf,.pdf" disabled={loading} onChange={event => load(event.target.files[0])} /></label>{!replacement && <button id="btn-load-sample" className="btn secondary" disabled={loading} onClick={() => { setParsed(getSampleProgeoDiet()); setSource('Piano di prova Progeo'); }}>Carica Piano di Prova Progeo</button>}{loading && <p role="status">Lettura PDF… {progress}</p>}{parsed && <div className="notice"><strong>{source}</strong><p>{Object.keys(parsed.days).length} giorni · {Object.values(parsed.days).reduce((sum, day) => sum + day.meals.length, 0)} pasti riconosciuti</p></div>}{replacement && parsed && <label className="confirm-check"><input type="checkbox" checked={finalConfirm} onChange={event => setFinalConfirm(event.target.checked)} />Confermo definitivamente: sostituisci il piano attuale e azzera il suo tracking.</label>}{error && <p className="notice error" role="alert">{error}</p>}<div className="actions"><button className="btn secondary" disabled={loading} onClick={onClose}>Annulla</button><button className={`btn ${replacement ? 'danger' : 'primary'}`} disabled={!parsed || loading || replacement && !finalConfirm} onClick={() => { if (!onSave(parsed, source)) setError('Importazione non completata. Chiudi e riapri la finestra per verificare lo stato del piano.'); }}>{replacement ? 'Sostituisci definitivamente' : 'Importa e attiva'}</button></div></>}</Modal>;
}

function Shopping({ plan, day, onClose }) {
  const [selection, setSelection] = useState(Object.keys(plan.data.days)), [status, setStatus] = useState('');
  const preview = useRef(null);
  const lines = buildShoppingList(plan.data, selection), text = lines.join('\n');
  async function copy() { try { await navigator.clipboard.writeText(text); setStatus('Lista copiata.'); } catch { preview.current?.focus(); preview.current?.select(); setStatus('Copia non disponibile. Testo selezionato: copialo manualmente.'); } }
  async function share() { try { await navigator.share({ title: 'Lista della spesa NutriPro', text }); setStatus('Lista condivisa.'); } catch (e) { setStatus(e.name === 'AbortError' ? 'Condivisione annullata.' : 'Condivisione non disponibile. Usa Copia lista o Scarica.'); } }
  function download() { const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'lista-spesa-nutripro.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus('Lista scaricata.'); }
  return <Modal title="Esporta lista della spesa" onClose={onClose}><p className="muted">Scegli i giorni. Le alternative restano insieme alle rispettive quantità.</p><fieldset className="shopping-days"><legend>Giorni della spesa</legend>{Object.entries(plan.data.days).map(([key, value]) => <label key={key}><input type="checkbox" checked={selection.includes(key)} onChange={event => setSelection(event.target.checked ? [...selection, key] : selection.filter(item => item !== key))} />{value.dayName || key}</label>)}</fieldset><label className="form-field">Anteprima: {lines.length} voci<textarea ref={preview} id="shopping-preview" readOnly value={text} rows={10} /></label><div className="actions"><button id="btn-copy-shopping" className="btn primary" disabled={!lines.length} onClick={copy}>Copia lista</button>{typeof navigator.share === 'function' && <button className="btn secondary" disabled={!lines.length} onClick={share}>Condividi</button>}<button id="btn-download-shopping" className="btn secondary" disabled={!lines.length} onClick={download}>Scarica .txt</button></div><p id="shopping-status" role="status" aria-live="polite">{status}</p></Modal>;
}
function Calculator({ onClose }) {
  const [category, setCategory] = useState('pasta'), [raw, setRaw] = useState('80'), [spoon, setSpoon] = useState('oil'), [count, setCount] = useState('1');
  const ratios = { pasta: 2.2, cereal: 2.5, legumes: 2.5, meat: .8, potatoes: 1 };
  const portions = { oil: 4, cereal: 20, couscous: 10, legumes: 20, milk: 200, flakes: 40 };
  return <Modal title="Calcolatore porzioni" onClose={onClose}><p className="muted">Stime indicative: la cottura e la misura domestica possono variare.</p><div className="calculator-grid"><section><h3>Da crudo a cotto</h3><label className="form-field">Alimento<select value={category} onChange={event => setCategory(event.target.value)}>{[['pasta', 'Pasta'], ['cereal', 'Riso e cereali'], ['legumes', 'Legumi secchi'], ['meat', 'Carne'], ['potatoes', 'Patate']].map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label className="form-field">Peso crudo (g)<input type="number" min="0" value={raw} onChange={event => setRaw(event.target.value)} /></label><output>{Math.round(Math.max(0, Number(raw) || 0) * ratios[category])} g cotti</output></section><section><h3>Misure domestiche</h3><label className="form-field">Misura<select value={spoon} onChange={event => setSpoon(event.target.value)}>{[['oil', 'Cucchiaino olio'], ['cereal', 'Cucchiaio cereali'], ['couscous', 'Cucchiaio couscous'], ['legumes', 'Cucchiaio legumi secchi'], ['milk', 'Bicchiere latte'], ['flakes', 'Bicchiere fiocchi']].map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label className="form-field">Quantità<input type="number" min="0" step="0.5" value={count} onChange={event => setCount(event.target.value)} /></label><output>{Math.round(Math.max(0, Number(count) || 0) * portions[spoon])} {spoon === 'milk' ? 'ml' : 'g'}{spoon === 'legumes' && ` secchi ≈ ${Math.round(Math.max(0, Number(count) || 0) * 50)} g cotti`}</output></section></div></Modal>;
}

export default function App() { return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Protected />} /></Routes>; }
