import { useState } from 'react';
import { useNutriApi } from './api.mjs';
import { CopyInvite } from './CopyInvite.jsx';

function AddPatientForm({ csrf, onAdded }) {
  const api = useNutriApi(csrf);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [created, setCreated] = useState(null);
  async function save(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const patient = await api('/api/nutritionist/patients', { name, email });
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

export { AddPatientForm };
