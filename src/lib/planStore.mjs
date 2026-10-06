  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  function validData(data) {
    return data && typeof data.days === 'object' && data.days !== null &&
      Object.values(data.days).some(day => Array.isArray(day.meals) && day.meals.some(meal => Array.isArray(meal.items) && meal.items.length));
  }
  function createStore(storage, account, { id = () => crypto.randomUUID(), now = () => new Date().toISOString() } = {}) {
    if (!account) throw new Error('Account richiesto.');
    const key = `diet_plan_archive:${account}`;
    function read() {
      const raw = storage.getItem(key);
      if (!raw) return { version: 1, revision: 0, activeId: null, plans: [] };
      let archive;
      try { archive = JSON.parse(raw); } catch { throw new Error('Archivio non leggibile. I dati salvati non sono stati modificati.'); }
      if (archive.version !== 1 || !Array.isArray(archive.plans) || !Number.isInteger(archive.revision) ||
          archive.plans.some(p => !p.id || !validData(p.data)) ||
          new Set(archive.plans.map(p => p.id)).size !== archive.plans.length ||
          (archive.activeId !== null && !archive.plans.some(p => p.id === archive.activeId))) {
        throw new Error('Archivio non valido. I dati salvati non sono stati modificati.');
      }
      return archive;
    }
    function write(archive) {
      archive.revision++;
      // One write: a quota failure leaves the previous archive and active plan untouched.
      try { storage.setItem(key, JSON.stringify(archive)); }
      catch { throw new Error('Salvataggio non riuscito: spazio del browser esaurito o non disponibile. Il piano precedente è conservato.'); }
      return copy(archive);
    }
    function makePlan(data, sourceName) {
      if (!validData(data)) throw new Error('Il PDF non contiene un piano valido.');
      const date = now();
      return { id: id(), name: (sourceName || 'Piano alimentare').replace(/\.pdf$/i, ''),
        sourceName: sourceName || null, createdAt: date, updatedAt: date,
        data: copy(data), checked: {}, water: {} };
    }
    function migrate() {
      if (storage.getItem(key) !== null) return read();
      const raw = storage.getItem(`diet_plan_data:${account}`);
      if (!raw) return read();
      let data;
      try { data = JSON.parse(raw); } catch { throw new Error('Piano precedente non leggibile. Nessun dato modificato.'); }
      const plan = makePlan(data, 'Piano precedente');
      for (const [field, prefix] of [['checked', 'diet_checked_items'], ['water', 'diet_water_tracker']]) {
        try { plan[field] = JSON.parse(storage.getItem(`${prefix}:${account}`)) || {}; } catch { plan[field] = {}; }
      }
      // Keep legacy data as a backup; never import unowned keys without an account suffix.
      return write({ version: 1, revision: 0, activeId: plan.id, plans: [plan] });
    }
    function importPlan(data, { mode = 'new', sourceName, expectedRevision, targetId } = {}) {
      const archive = read();
      if (expectedRevision !== undefined && archive.revision !== expectedRevision) throw new Error('Il piano è cambiato in un’altra scheda. Riapri la gestione piani e riprova.');
      if (mode === 'replace') {
        const target = archive.plans.find(p => p.id === targetId);
        if (!target || archive.activeId !== targetId) throw new Error('Il piano da sostituire non è più attivo. Nessun dato modificato.');
        const replacement = makePlan(data, sourceName);
        archive.plans = archive.plans.map(p => p.id === targetId ? { ...replacement, id: target.id, createdAt: target.createdAt } : p);
      } else if (mode === 'new') {
        const plan = makePlan(data, sourceName);
        archive.plans.push(plan);
        archive.activeId = plan.id;
      } else throw new Error('Operazione non valida.');
      return write(archive);
    }
    function setActive(planId, expectedRevision) {
      const archive = read();
      if (expectedRevision !== undefined && archive.revision !== expectedRevision) throw new Error('La gestione piani è cambiata. Chiudi e riapri il menu.');
      if (planId !== null && !archive.plans.some(p => p.id === planId)) throw new Error('Piano non trovato.');
      archive.activeId = planId;
      return write(archive);
    }
    function saveTracking(planId, field, value) {
      if (!['checked', 'water'].includes(field)) throw new Error('Tracking non valido.');
      const archive = read();
      const plan = archive.plans.find(p => p.id === planId);
      if (!plan || archive.activeId !== planId) throw new Error('Il piano attivo è cambiato. Ricarica la pagina.');
      plan[field] = copy(value);
      return write(archive);
    }
    return { key, read, migrate, importPlan, setActive, saveTracking };
  }

export { createStore, validData };
