'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROLES = ['Nutrizionista', 'Dietista', 'Biologo nutrizionista', 'Altro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Validation mirrors the landing form rules. Returns { ok: true, value } or { ok: false, errors }.
function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: { form: 'Formato non valido.' } };
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
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, email, role, patients: patientsRaw ? Number(patientsRaw) : null } };
}

// SQLite file on a persistent volume. Opened lazily so the app still starts when the
// volume is missing: only the waitlist endpoint reports an error in that case.
function createWaitlistStore(dbPath, now = Date.now) {
  let db;
  function open() {
    if (db) return db;
    const { DatabaseSync } = require('node:sqlite');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec(`CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      patients INTEGER,
      consent_at TEXT NOT NULL
    )`);
    return db;
  }
  return {
    // An already registered email is not an error and is not revealed.
    add({ name, email, role, patients }) {
      open().prepare('INSERT INTO waitlist (name, email, role, patients, consent_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING')
        .run(name, email, role, patients, new Date(now()).toISOString());
    },
    close() { if (db) { db.close(); db = undefined; } }
  };
}

module.exports = { validate, createWaitlistStore, ROLES };
