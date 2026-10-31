'use strict';

// Categories left to the rules below or to the plan itself. Left on, the model reads the codes of
// the alternatives (Alt. column) as building numbers and postal codes, the grams of the unit
// table as ages, and eats dates and quantities: the plan would be useless (see
// docs/research/rizzo-pii-valutazione.md).
const LEAVE_OUT = ['BUILDINGNUM', 'ZIPCODE', 'AGE', 'AMOUNT', 'DATE', 'TIME'];

class AnonymizerError extends Error {
  constructor(status, code, message) { super(message); this.name = 'AnonymizerError'; this.status = status; this.code = code; this.safeMessage = message; }
}

// Second layer, no model: identifiers that have a fixed shape. It catches what the model misses
// and covers the postal code, which is in LEAVE_OUT. Quantities and alternatives codes (2 to 4
// digits) are not touched.
const RULES = [
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:[.][A-Za-z0-9-]+)+/g, '[EMAIL]'],
  ['url', /https?:[/][/][^ ]+|www[.][^ ]+/gi, '[URL]'],
  ['iban', /(?<![0-9A-Za-z])[A-Z]{2}[0-9]{2}(?: ?[0-9A-Z]){11,30}(?![0-9A-Za-z])/g, '[IBAN]'],
  ['cf', /(?<![0-9A-Za-z])[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z](?![0-9A-Za-z])/gi, '[CF]'],
  ['phone', /(?<![0-9A-Za-z])(?:(?:[+]|00)39[ .-]?)?(?:3[0-9]{2}[ .-]?[0-9]{3}[ .-]?[0-9]{3,4}|0[0-9]{1,3}[ .-]?[0-9]{5,8})(?![0-9A-Za-z])/g, '[TEL]'],
  ['cap', /(?<![0-9A-Za-z])[0-9]{5}(?![0-9A-Za-z])/g, '[CAP]']
];

function scrub(text) {
  const counts = {};
  let out = text;
  for (const [name, regex, placeholder] of RULES) out = out.replace(regex, () => { counts[name] = (counts[name] || 0) + 1; return placeholder; });
  return { text: out, counts };
}

// The anonymiser runs in our own container (Rizzo-PII) and is reached over the internal network.
// Whatever happens here, the caller either gets clean text or an error: never the original text.
function createAnonymizer({ url = '', fetchImpl = globalThis.fetch, timeoutMs = 120000, maxConcurrent = 2 } = {}) {
  let base = '';
  try { const parsed = new URL(url); if (['http:', 'https:'].includes(parsed.protocol)) base = parsed.origin; } catch {}
  let busy = 0;
  const unavailable = () => new AnonymizerError(503, 'anonymizer_unavailable', 'Il servizio di anonimizzazione non è disponibile. Riprova più tardi.');
  const failed = () => new AnonymizerError(502, 'anonymizer_error', 'Il servizio di anonimizzazione non ha risposto correttamente.');
  function status() { return { configured: Boolean(base) }; }
  async function anonymize(text) {
    if (!base) throw unavailable();
    if (busy >= maxConcurrent) throw new AnonymizerError(429, 'busy', 'Servizio occupato. Riprova tra poco.');
    busy++;
    try {
      let response;
      try {
        response = await fetchImpl(`${base}/analyze`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, include_mapping: false, exclude_tags: LEAVE_OUT }) });
      } catch { throw unavailable(); }
      if (!response.ok) throw failed();
      const data = await response.json().catch(() => null);
      if (typeof data?.anonymized_text !== 'string' || !data.anonymized_text.trim()) throw failed();
      return scrub(data.anonymized_text);
    } finally { busy--; }
  }
  return { status, anonymize };
}

module.exports = { createAnonymizer, scrub, AnonymizerError, LEAVE_OUT };
