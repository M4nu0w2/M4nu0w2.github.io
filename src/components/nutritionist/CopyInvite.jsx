import { useState } from 'react';

function CopyInvite({ url }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus('Link copiato.'); }
    catch { setStatus('Copia non disponibile: seleziona il testo.'); }
  }
  return <div className="invite-box"><p className="muted">Invia questo link al paziente (WhatsApp, email…). Deve aprirlo con il suo account Google.</p><div className="invite-row"><input readOnly value={url} onFocus={event => event.target.select()} aria-label="Link di invito" /><button className="btn secondary small" onClick={copy}>Copia link</button></div><p role="status" aria-live="polite">{status}</p></div>;
}

export { CopyInvite };
