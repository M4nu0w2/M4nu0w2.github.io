---
id: WF-011
title: Implementare pagina settaggi e tracking opzionali
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: manu
assignment: manu
assignment_mode: flexible
blocked_by: []
---

# Implementare pagina settaggi e tracking opzionali

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): creare il ticket di implementazione
delle decisioni già prese in
[Definire pagina settaggi e tracking opzionali](WF-007-settaggi.md).
Questo ticket implementa quelle decisioni senza ridiscuterle; l'obiettivo
dell'acqua è trattato a parte in
[Rendere configurabile l'obiettivo dell'acqua](WF-012-obiettivo-acqua.md).

Perimetro:

- **Settaggi account** validi per tutti i piani dell'**Account Google**,
  salvati in localStorage con chiave legata al `sub` Google, mai all'email.
- **Tracking opzionale** acqua attivo di default, olio disattivo di default.
- Con olio attivo, l'olio si registra come **quantità effettiva** sulla voce
  olio del pasto, secondo le regole del ticket di decisione: la spunta usa la
  quantità prevista, modificabile; passi di ½ cucchiaino (1 = 4 g) o di 2 g con
  preferenza grammi; ingredienti di ricette spuntate inclusi, alternative
  escluse; totale del giorno confrontato con il previsto.
- Unità preferite per menu e olio, default unità del PDF con nota in grammi;
  lista della spesa invariata.
- Disattivare un tracking lo nasconde e conserva lo storico; cancellazione dello
  storico separata, per singolo tracking, su tutti i piani, con doppia conferma.
- Nuova rotta settaggi nella sidebar desktop e nella navigazione mobile
  (tab bar o header compatto), protetta dal login come le altre pagine.

## Vincoli

- Piani e tracking sono dati sanitari in `diet_plan_archive:<sub>`
  ([planStore.mjs](../../src/lib/planStore.mjs)). Le quantità effettive vanno
  nel piano; oggi `saveTracking` accetta solo `checked` e `water`, quindi il
  nuovo campo richiede un'estensione esplicita compatibile con gli archivi
  esistenti.
- Rispettare la revisione dell'archivio per rilevare modifiche da altre schede,
  anche per i settaggi.
- Nessuna nuova chiamata di rete che invii settaggi o tracking senza ok del PO.
- Persistenza locale per ora: se
  [Definire persistenza e dati condivisi con l'assistente](WF-003-dati.md)
  deciderà una sincronizzazione, servirà una migrazione successiva.
- Il tracking oggi è per giorno della settimana del piano, non per data reale:
  vedi [Definire come conservare le date reali del tracking](WF-014-date-tracking.md).

## Acceptance criteria

- Primo accesso di un account: acqua visibile, olio nascosto, unità del PDF.
- I settaggi sopravvivono a ricarica, logout/login e cambio del **piano attivo**;
  due account sullo stesso browser non condividono settaggi.
- Spegnere e riaccendere un tracking non perde dati; la cancellazione chiede due
  conferme e tocca solo il tracking scelto.
- Olio: nessun doppio conteggio fra spunta e quantità effettiva; le voci olio
  spuntate a tracking spento contano la quantità prevista all'accensione.
- Archivi salvati prima di questo ticket si aprono senza errori né perdita dati.
- Rotta raggiungibile da desktop e mobile; senza sessione rimanda al login.
- `npm test` e `npm run test:browser` verdi, con test nuovi per settaggi e olio.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.

## Implementation comment

2026-10-10 — implementazione locale (Manu con Claude), non committata né pubblicata.

- Settaggi account dentro `diet_plan_archive:<sub>` (campo `settings`), così una
  sola revisione copre piani e preferenze; archivi senza il campo usano i default.
- Nuovo campo `oil` per piano: solo le quantità effettive modificate; senza
  modifica una voce olio spuntata vale la quantità prevista. Logica pura in
  `src/lib/tracking.mjs`.
- Pagina `/settings` con interruttori acqua e olio, unità, cancellazione dello
  storico con doppia conferma; voce "Settaggi" nella sidebar e nella tab bar
  mobile (5 colonne); rotta protetta anche dal server.
- Il default "unità del PDF" cambia la vista attuale: il menu mostrava i grammi
  convertiti, ora mostra la misura del PDF con i grammi in nota.
- Verifiche: `npm test` 51/51, `npm run test:browser` 16/16 (Playwright 1.63
  fuori dal repo), nuovi `tests/settings.test.cjs` e `tests/settings.e2e.cjs`.
- Da fare per chiudere: commit e push su `dev` con ultimo commit senza
  `[skip ci]`, verifica sul dominio pubblico.
