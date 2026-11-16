import { WAITLIST_ENDPOINT, CONTACT_EMAIL } from '../config.js';

// Messaggi di validazione (stesse regole del server in functions/api/waitlist.js).
const RULES = {
  name: (v) => (v.trim() ? '' : 'Inserisci nome e cognome.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : "Inserisci un'email valida."),
  role: (v) => (v ? '' : 'Scegli il tuo ruolo.'),
  patients: (v) => (v === '' || (/^\d+$/.test(v) && Number(v) <= 10000) ? '' : 'Inserisci un numero intero, oppure lascia vuoto.'),
  privacy: (_, el) => (el.checked ? '' : 'Serve il consenso per poterti ricontattare.'),
};

/**
 * Form waitlist: validazione accessibile + invio JSON a WAITLIST_ENDPOINT.
 * Senza JS il form funziona lo stesso (POST classico, il server risponde con redirect).
 */
export function initWaitlist() {
  const form = document.querySelector('[data-waitlist]');
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('[type="submit"]');

  // Esito di un invio senza JS (redirect del server con ?waitlist=ok|errore).
  const outcome = new URLSearchParams(location.search).get('waitlist');
  if (outcome === 'ok') showSuccess(form);
  else if (outcome === 'errore') setStatus(status, errorText(), true);

  const validate = (field) => {
    const rule = RULES[field.name];
    if (!rule) return true;
    const message = rule(field.value, field);
    const error = form.querySelector(`#${field.id}-errore`);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message;
    return !message;
  };

  form.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('blur', () => field.getAttribute('aria-invalid') && validate(field));
    field.addEventListener('change', () => field.getAttribute('aria-invalid') && validate(field));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input:not([name="website"]), select')];
    const invalid = fields.filter((f) => !validate(f));
    if (invalid.length) {
      invalid[0].focus();
      setStatus(status, 'Controlla i campi evidenziati.', true);
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    data.privacy = form.elements.privacy.checked;
    button.disabled = true;
    button.textContent = 'Invio in corso…';
    setStatus(status, '');
    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      showSuccess(form, data.name);
    } catch {
      setStatus(status, errorText(), true);
      button.disabled = false;
      button.textContent = 'Candidati come tester';
    }
  });
}

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle('is-error', isError);
}

function errorText() {
  return `Non siamo riusciti a inviare la candidatura. Riprova tra poco${CONTACT_EMAIL ? ` o scrivici a ${CONTACT_EMAIL}` : ''}.`;
}

function showSuccess(form, name = '') {
  const first = String(name).trim().split(/\s+/)[0];
  const box = document.createElement('div');
  box.className = 'waitlist waitlist--done card';
  box.setAttribute('role', 'status');
  box.setAttribute('tabindex', '-1');
  box.innerHTML = `
    <span class="waitlist__ok" aria-hidden="true">✓</span>
    <h3>Grazie${first ? `, ${escapeHtml(first)}` : ''}!</h3>
    <p>Abbiamo ricevuto la tua candidatura. Ti scriveremo appena apriamo i primi accessi di prova.</p>`;
  form.replaceWith(box);
  box.focus();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
