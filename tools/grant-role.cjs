#!/usr/bin/env node
'use strict';
// Dev only: promette un ruolo a un'email, prima ancora che quell'account abbia
// mai fatto login. Il ruolo viene assegnato davvero al primo accesso Google.
// Uso: node tools/grant-role.cjs tua.email@gmail.com nutritionist
const path = require('node:path');
const { createAppStore } = require('../server/store.cjs');

const [email, role] = process.argv.slice(2);
if (!email || !role) {
  console.error('Uso: node tools/grant-role.cjs <email> <nutritionist|patient>');
  process.exit(1);
}
const dbPath = process.env.APP_DB_PATH || path.join(__dirname, '..', 'data', 'nutra.sqlite');
const store = createAppStore(dbPath);
try {
  store.grantRole(email, role);
  console.log(`Ok: ${email} riceverà il ruolo "${role}" al primo login Google.`);
} finally {
  store.close();
}
