import { useState } from 'react';
import { parseDietPdf } from '../../lib/dietEngine.mjs';
import { useNutriApi } from './api.mjs';

function PlanUpload({ patient, csrf, onUploaded }) {
  const api = useNutriApi(csrf);
  const [loading, setLoading] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState(''), [done, setDone] = useState('');
  async function load(file) {
    if (!file) return;
    setError(''); setDone('');
    if (!/\.pdf$/i.test(file.name) || file.type && file.type !== 'application/pdf') { setError('Scegli un file PDF.'); return; }
    if (file.size > 30 * 1024 * 1024) { setError('Il PDF supera 30 MB.'); return; }
    setLoading(true);
    try {
      const data = await parseDietPdf(await file.arrayBuffer(), message => setProgress(String(message)));
      await api(`/api/nutritionist/patients/${patient.id}/plan`, { name: file.name, data });
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

export { PlanUpload };
