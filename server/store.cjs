'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROLES = ['nutritionist', 'patient'];
const TRACKING_FIELDS = ['checked', 'water', 'oil'];
const DAY_KEYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

// Same shape check as the client archive: at least one day with one meal with items.
function validPlanData(data) {
  return Boolean(data && typeof data.days === 'object' && data.days !== null && !Array.isArray(data.days) &&
    Object.values(data.days).some(day => day && Array.isArray(day.meals) && day.meals.some(meal => meal && Array.isArray(meal.items) && meal.items.length)));
}

// The product and every user are in Italy; the server's "today" must be Rome's local day
// regardless of the container's own timezone (the Dockerfile sets no TZ, so it runs in UTC).
const ROME_WEEKDAY = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short' });
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const dayKeyFor = now => DAY_KEYS[WEEKDAY_INDEX[ROME_WEEKDAY.format(new Date(now))]];

// Versioned migrations: each entry runs once, inside a transaction, recorded in schema_migrations.
const MIGRATIONS = [
  [1, `
    CREATE TABLE roles (
      sub TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('nutritionist', 'patient')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE role_grants (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('nutritionist', 'patient')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nutritionist_sub TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      invite_token TEXT NOT NULL UNIQUE,
      invite_sent_at TEXT,
      google_sub TEXT UNIQUE,
      last_seen_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (nutritionist_sub, email)
    );
    CREATE TABLE plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX plans_patient ON plans(patient_id, id);
    CREATE TABLE plan_tracking (
      patient_sub TEXT NOT NULL,
      plan_id INTEGER NOT NULL REFERENCES plans(id),
      day TEXT NOT NULL,
      field TEXT NOT NULL CHECK (field IN ('checked', 'water', 'oil')),
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (patient_sub, plan_id, day, field)
    );
  `]
];

// SQLite file on a persistent volume, opened lazily like the waitlist store so the
// app still starts when the volume is missing. ':memory:' is used by tests.
function createAppStore(dbPath, now = Date.now) {
  let db;
  const iso = () => new Date(now()).toISOString();
  function open() {
    if (db) return db;
    const { DatabaseSync } = require('node:sqlite');
    if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map(row => row.version));
    for (const [version, sql] of MIGRATIONS) {
      if (applied.has(version)) continue;
      db.exec('BEGIN');
      try {
        db.exec(sql);
        db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, iso());
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    return db;
  }
  const patientRow = row => !row ? null : {
    id: row.id, nutritionistSub: row.nutritionist_sub, email: row.email, name: row.name,
    inviteToken: row.invite_token, inviteSentAt: row.invite_sent_at, googleSub: row.google_sub,
    lastSeenAt: row.last_seen_at, createdAt: row.created_at
  };
  return {
    open,
    roleOf(sub) {
      if (typeof sub !== 'string' || !sub) return null;
      return open().prepare('SELECT role FROM roles WHERE sub = ?').get(sub)?.role || null;
    },
    assignRole(sub, role) {
      if (!ROLES.includes(role)) throw new Error('Ruolo non valido.');
      open().prepare('INSERT INTO roles (sub, role, created_at) VALUES (?, ?, ?) ON CONFLICT(sub) DO UPDATE SET role = excluded.role').run(sub, role, iso());
    },
    grantRole(email, role) {
      if (!ROLES.includes(role)) throw new Error('Ruolo non valido.');
      open().prepare('INSERT INTO role_grants (email, role, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET role = excluded.role').run(email.toLowerCase(), role, iso());
    },
    // One-shot: the grant is consumed when the account first signs in.
    takeGrant(email) {
      const grants = open();
      const row = grants.prepare('SELECT role FROM role_grants WHERE email = ?').get(email.toLowerCase());
      if (row) grants.prepare('DELETE FROM role_grants WHERE email = ?').run(email.toLowerCase());
      return row?.role || null;
    },
    addPatient(nutritionistSub, { name, email }) {
      const token = crypto.randomBytes(32).toString('base64url');
      const result = open().prepare('INSERT INTO patients (nutritionist_sub, email, name, invite_token, invite_sent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(nutritionistSub, email.toLowerCase(), name, token, iso(), iso());
      return patientRow(open().prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid));
    },
    listPatients(nutritionistSub) {
      return open().prepare('SELECT * FROM patients WHERE nutritionist_sub = ? ORDER BY created_at DESC, id DESC').all(nutritionistSub).map(patientRow);
    },
    patientOf(nutritionistSub, id) {
      return patientRow(open().prepare('SELECT * FROM patients WHERE id = ? AND nutritionist_sub = ?').get(id, nutritionistSub));
    },
    patientBySub(googleSub) {
      return patientRow(open().prepare('SELECT * FROM patients WHERE google_sub = ?').get(googleSub));
    },
    patientByToken(token) {
      if (typeof token !== 'string' || !/^[\w-]{20,100}$/.test(token)) return null;
      return patientRow(open().prepare('SELECT * FROM patients WHERE invite_token = ?').get(token));
    },
    unlinkedPatientByEmail(email) {
      return patientRow(open().prepare('SELECT * FROM patients WHERE email = ? AND google_sub IS NULL ORDER BY created_at DESC LIMIT 1').get(email.toLowerCase()));
    },
    linkPatient(id, googleSub) {
      open().prepare('UPDATE patients SET google_sub = ?, last_seen_at = ? WHERE id = ? AND google_sub IS NULL').run(googleSub, iso(), id);
      this.assignRole(googleSub, 'patient');
    },
    touchPatient(googleSub) {
      open().prepare('UPDATE patients SET last_seen_at = ? WHERE google_sub = ?').run(iso(), googleSub);
    },
    assignPlan(patientId, { name, data }) {
      if (!validPlanData(data)) throw Object.assign(new Error('invalid_plan'), { status: 422, code: 'invalid_plan' });
      const result = open().prepare('INSERT INTO plans (patient_id, name, data_json, created_at) VALUES (?, ?, ?, ?)')
        .run(patientId, String(name || 'Piano alimentare').slice(0, 200), JSON.stringify(data), iso());
      return Number(result.lastInsertRowid);
    },
    // The latest upload is the patient's plan; earlier rows stay as history.
    planForPatient(patientId) {
      const row = open().prepare('SELECT * FROM plans WHERE patient_id = ? ORDER BY id DESC LIMIT 1').get(patientId);
      return row ? { id: row.id, name: row.name, data: JSON.parse(row.data_json), createdAt: row.created_at } : null;
    },
    saveTracking(patientSub, planId, day, field, value) {
      if (!TRACKING_FIELDS.includes(field)) throw Object.assign(new Error('invalid_field'), { status: 422, code: 'invalid_field' });
      if (typeof day !== 'string' || !/^[a-z0-9_-]{1,20}$/i.test(day)) throw Object.assign(new Error('invalid_day'), { status: 422, code: 'invalid_day' });
      const json = JSON.stringify(value === undefined ? null : value);
      if (json.length > 65536) throw Object.assign(new Error('payload_too_large'), { status: 413, code: 'payload_too_large' });
      open().prepare(`INSERT INTO plan_tracking (patient_sub, plan_id, day, field, value_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(patient_sub, plan_id, day, field) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`)
        .run(patientSub, planId, day, field, json, iso());
    },
    trackingFor(patientSub, planId, day) {
      const rows = day
        ? open().prepare('SELECT day, field, value_json, updated_at FROM plan_tracking WHERE patient_sub = ? AND plan_id = ? AND day = ?').all(patientSub, planId, day)
        : open().prepare('SELECT day, field, value_json, updated_at FROM plan_tracking WHERE patient_sub = ? AND plan_id = ?').all(patientSub, planId);
      const tracking = {};
      for (const row of rows) {
        tracking[row.day] ||= {};
        try { tracking[row.day][row.field] = { value: JSON.parse(row.value_json), updatedAt: row.updated_at }; } catch { /* skip unreadable row */ }
      }
      return tracking;
    },
    close() { if (db) { db.close(); db = undefined; } }
  };
}

module.exports = { createAppStore, validPlanData, dayKeyFor, ROLES, TRACKING_FIELDS };
