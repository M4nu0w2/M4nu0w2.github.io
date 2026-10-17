// POST /api/waitlist — salva una candidatura nella tabella `waitlist` (D1, binding DB).
// Accetta JSON (fetch dal sito) o form classico (senza JS: risponde con redirect alla pagina).

const ROLES = ['Nutrizionista', 'Dietista', 'Biologo nutrizionista', 'Altro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('content-type') || '').includes('application/json');

  // Accetta solo invii dal sito stesso.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply(wantsJson, 403, 'origin');

  let data;
  try {
    data = wantsJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(wantsJson, 400, 'formato');
  }

  // Trappola anti-spam compilata: fingiamo successo senza salvare.
  if (data.website) return reply(wantsJson, 200);

  const name = String(data.name ?? '').trim().slice(0, 100);
  const email = String(data.email ?? '').trim().toLowerCase().slice(0, 200);
  const role = String(data.role ?? '');
  const patientsRaw = String(data.patients ?? '').trim();
  const consent = data.privacy === true || data.privacy === '1' || data.privacy === 'on';

  const errors = {};
  if (!name) errors.name = 'Inserisci nome e cognome.';
  if (!EMAIL_RE.test(email)) errors.email = "Inserisci un'email valida.";
  if (!ROLES.includes(role)) errors.role = 'Scegli il tuo ruolo.';
  if (patientsRaw && !(/^\d+$/.test(patientsRaw) && Number(patientsRaw) <= 10000)) errors.patients = 'Numero non valido.';
  if (!consent) errors.privacy = 'Serve il consenso.';
  if (Object.keys(errors).length) return reply(wantsJson, 422, 'validazione', errors);

  if (!env.DB) return reply(wantsJson, 500, 'db');

  try {
    // Email già presente: nessun errore (non riveliamo chi è iscritto).
    await env.DB.prepare(
      `INSERT INTO waitlist (name, email, role, patients, consent_at)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(email) DO NOTHING`,
    )
      .bind(name, email, role, patientsRaw ? Number(patientsRaw) : null, new Date().toISOString())
      .run();
  } catch (err) {
    console.error('waitlist insert failed', err);
    return reply(wantsJson, 500, 'db');
  }

  return reply(wantsJson, 200);
}

export function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

function reply(wantsJson, status, error, errors) {
  const ok = status === 200;
  if (wantsJson) return Response.json(ok ? { ok } : { ok, error, errors }, { status });
  return new Response(null, { status: 303, headers: { Location: `/?waitlist=${ok ? 'ok' : 'errore'}#tester` } });
}
