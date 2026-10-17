// /admin e sottopagine: area riservata non ancora realizzata. Per ora non entra nessuno.
export function onRequest() {
  return new Response('Accesso negato.', {
    status: 403,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
  });
}
