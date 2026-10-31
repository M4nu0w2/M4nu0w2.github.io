'use strict';
const RANK = { info: 20, warn: 30, error: 40, silent: 100 };

// One JSON object per line on stdout: readable with `docker logs` and by any collector.
// Callers pass only fields they have judged safe (never queries, bodies, tokens, identities);
// this module cannot see a request, so it cannot leak one.
function createLogger({ level = 'info', write = line => process.stdout.write(line + '\n') } = {}) {
  const min = RANK[level] ?? RANK.info;
  const emit = (name, rank) => (event, fields) => {
    if (rank >= min) write(JSON.stringify({ ts: new Date().toISOString(), level: name, event, ...fields }));
  };
  return { info: emit('info', RANK.info), warn: emit('warn', RANK.warn), error: emit('error', RANK.error) };
}

module.exports = { createLogger, LEVELS: Object.keys(RANK) };
