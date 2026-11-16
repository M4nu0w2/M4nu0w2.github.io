import { useCallback, useEffect, useState } from 'react';

function useNutriApi(csrf) {
  return useCallback(async (route, body) => {
    const options = { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(30000) };
    if (body !== undefined) Object.assign(options, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } });
    const response = await fetch(route, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'request_failed'), { status: response.status, code: data.error });
    return data;
  }, [csrf]);
}

// Shared load state: a GET that runs on mount and on every dependency change, with one error message.
function useLoader(fetcher, deps, errorMessage) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setData(await fetcher()); setError(''); }
    catch { setError(errorMessage); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return [data, error, load];
}

export { useNutriApi, useLoader };
