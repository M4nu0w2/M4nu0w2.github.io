import { useEffect, useRef, useState } from 'react';
import '../chat.css';

const expired = () => window.location.replace('/login?error=expired');
function requestHistory(messages, message) {
  const history = messages.slice(-20).map(({ role, text }) => ({ role, text }));
  let length = history.reduce((sum, entry) => sum + entry.text.length, 0);
  while (history.length && length + message.length > 24000) {
    length -= history[0].text.length + history[1].text.length;
    history.splice(0, 2);
  }
  return history;
}
const errors = {
  rate_limited: 'Hai raggiunto il limite temporaneo. Attendi e riprova.',
  provider_unavailable: 'Gemini Flash è temporaneamente sovraccarico. Attendi qualche minuto e riprova.',
  provider_quota: 'La quota disponibile di Gemini è esaurita. Attendi prima di riprovare.',
  invalid_request: 'La domanda non può essere inviata. Controlla il testo e riprova.',
  blocked_response: 'Gemini non ha restituito una risposta a questa domanda. Prova a riformularla.',
  invalid_response: 'Gemini ha restituito una risposta incompleta. Puoi riprovare.',
  timeout: 'Gemini sta impiegando troppo tempo. Attendi e riprova.',
  provider_error: 'Gemini ha incontrato un problema. Puoi riprovare più tardi.',
  forbidden: 'Gemini non è disponibile con la configurazione attuale. Riprova più tardi.',
  unavailable: 'L’assistente non è disponibile al momento. Riprova più tardi.',
  disabled: 'Assistente non ancora attivo.',
};

export default function ChatPage({ session }) {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  const generation = useRef(0);
  const input = useRef(null);
  const end = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { controller.abort(); setStatus({ enabled: false }); }, 15000);
    generation.current += 1;
    request.current?.abort();
    setStatus(null); setMessages([]); setDraft(''); setError(''); setPending(false);
    fetch('/api/chat/status', { credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        if (response.status === 401) { expired(); return; }
        if (!response.ok) throw new Error('status');
        const data = await response.json();
        if (!controller.signal.aborted) setStatus(data);
      }).catch(() => {
        if (!controller.signal.aborted) setStatus({ enabled: false });
      }).finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); generation.current += 1; request.current?.abort(); };
  }, [session.sub]);

  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, pending]);

  async function send(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!status?.enabled || pending || !message || message.length > 2000) return;
    const id = generation.current;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    setPending(true); setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', credentials: 'same-origin', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf },
        body: JSON.stringify({ message, history: requestHistory(messages, message) }),
      });
      if (response.status === 401) { expired(); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(errors[data.error] || (response.status === 429 ? errors.rate_limited : errors.unavailable));
      if (typeof data.text !== 'string' || !data.text.trim()) throw new Error(errors.unavailable);
      if (generation.current !== id) return;
      setMessages(previous => [...previous, { role: 'user', text: message }, { role: 'model', text: data.text }].slice(-20));
      setDraft('');
    } catch (failure) {
      if (generation.current === id) setError(failure.name === 'AbortError' ? 'La risposta sta impiegando troppo tempo. Puoi riprovare.' : Object.values(errors).includes(failure.message) ? failure.message : errors.unavailable);
    } finally {
      clearTimeout(timer);
      if (generation.current === id) { setPending(false); request.current = null; input.current?.focus(); }
    }
  }

  function reset() {
    generation.current += 1; request.current?.abort(); request.current = null;
    setMessages([]); setDraft(''); setError(''); setPending(false); input.current?.focus();
  }

  return <section className="chat-page" aria-labelledby="chat-title">
    <header className="page-heading">
      <div><p className="eyebrow">Gemini</p><h1 id="chat-title">Assistente</h1><p className="muted">Uno spazio per le tue domande generali.</p></div>
      <div className="actions"><button className="btn secondary" type="button" onClick={reset} disabled={!messages.length && !pending}>Nuova conversazione</button></div>
    </header>
    <div className="chat-info"><span className={`badge ${status?.enabled ? 'active' : 'archived'}`}>{status?.enabled ? (status.model || 'Gemini') : 'In preparazione'}</span><p>I piani e i PDF restano nel tuo archivio e non vengono inviati. Le domande e le risposte vengono elaborate da Google; la cronologia rimane solo in questa pagina e si svuota quando la lasci. Evita dati personali o sanitari.</p></div>
    {status === null ? <p role="status" className="notice">Verifico la disponibilità dell’assistente…</p> : !status.enabled ? <div className="empty-state" role="status"><h2>Assistente non ancora attivo</h2><p>La configurazione di Gemini è in preparazione. Potrai iniziare una conversazione quando sarà disponibile.</p></div> : <div className="chat-panel">
      <div className="chat-transcript" role="log" aria-label="Conversazione" aria-live="polite" aria-relevant="additions">
        {!messages.length && <div className="chat-welcome"><h2>Da dove vuoi iniziare?</h2><p className="muted">Scrivi una domanda generale. L’assistente può sbagliare: verifica le informazioni prima di usarle.</p></div>}
        {messages.map((message, index) => <article className={`chat-message chat-${message.role}`} key={index}><h3>{message.role === 'user' ? 'Tu' : 'Assistente'}</h3><p>{message.text}</p></article>)}
        {pending && <p role="status" className="chat-pending">L’assistente sta rispondendo…</p>}<div ref={end} />
      </div>
      <form className="chat-composer" onSubmit={send}>
        {error && <p className="notice error" role="alert">{error}</p>}
        <label htmlFor="chat-message">La tua domanda</label>
        <textarea ref={input} id="chat-message" rows="3" maxLength="2000" value={draft} onChange={event => setDraft(event.target.value)} disabled={pending} aria-describedby="chat-length" placeholder="Scrivi qui…" />
        <div className="chat-compose-actions"><span id="chat-length" className="muted">{draft.length}/2000 caratteri</span><button className="btn" type="submit" disabled={pending || !draft.trim()}>{pending ? 'Invio in corso…' : 'Invia domanda'}</button></div>
      </form>
    </div>}
  </section>;
}
