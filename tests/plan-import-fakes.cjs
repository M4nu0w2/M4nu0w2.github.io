'use strict';
const http = require('node:http');

// Test doubles for the two services a plan import crosses. They record what they receive, so tests can
// say what never reached each side.
const PLAN = { days: [{ day: 'lun', meals: [
  { type: 'colazione', name: 'Colazione', items: [{ name: 'Tè verde', qty: '1 tazza' }, { name: 'Kiwi', qty: 'n. 1', alternatives: [{ name: 'Ananas', qty: '70 g' }] }] },
  { type: 'pranzo', name: 'Pranzo', items: [{ name: 'Riso integrale', qty: '8 cucchiai' }] }] }] };

async function fakeRizzo({ status = 200, body } = {}) {
  const received = [];
  const server = http.createServer((req, res) => {
    let raw = ''; req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      const input = JSON.parse(raw || '{}'); received.push({ url: req.url, input });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      // Stand-in for the model: names become placeholders, nothing else changes.
      res.end(JSON.stringify(body ?? { anonymized_text: String(input.text).replace(/Mario Rossi|MARIO ROSSI/g, '[FULLNAME_1]'), mapping_enabled: false }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, received, close: () => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }) };
}

function fakeGemini(result = JSON.stringify(PLAN)) {
  const calls = [];
  return { calls, status: () => ({ enabled: true }), generate: async () => ({ text: 'x' }),
    extract: async (account, input) => { calls.push({ account, ...input }); if (result instanceof Error) throw result; return { text: result }; } };
}

module.exports = { fakeRizzo, fakeGemini, PLAN };
