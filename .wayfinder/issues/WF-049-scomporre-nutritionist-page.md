---
id: WF-049
title: Scomporre NutritionistPage e centralizzare il caricamento dati
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Scomporre NutritionistPage e centralizzare il caricamento dati

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14:
[src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx)
è un solo file di 149 righe, con 17 chiamate a `useState` e una funzione
`api()` locale (riga 9) che avvolge `fetch` a mano, duplicando quello che
ogni chiamata alle API nutrizionista ripete (gestione CSRF, parsing JSON,
errori).

## Vincoli

- Nessun cambio visivo: stesso markup, stesse classi CSS.
- Nessuna nuova libreria, coerente con la scelta di architettura leggera già
  presa in
  [Definire l'architettura di un backend leggero e robusto](WF-024-architettura-backend.md)
  (che riguardava il backend, ma lo spirito — pochi pacchetti, moduli solo
  con un seam vero — vale anche qui).
- I test esistenti ([tests/nutritionist.e2e.cjs](../../tests/nutritionist.e2e.cjs),
  [tests/nutritionist.test.cjs](../../tests/nutritionist.test.cjs)) restano
  verdi senza modifiche al loro contenuto: verificano comportamento, non
  struttura dei componenti.

## Acceptance criteria

- Componenti separati per: riga paziente nella lista, dettaglio paziente,
  form invito, upload piano (i componenti già esistenti oggi come funzioni
  nello stesso file: `PatientList`, `PatientDetail`, `AddPatientForm`,
  `PlanUpload`, `CopyInvite`, da spostare in file propri).
- Un hook condiviso per il caricamento dati che sostituisce la funzione
  `api()` duplicata.
- Nessun cambio visivo verificabile.
- `npm run test:browser` verde senza modifiche ai test esistenti.

## Out of scope

- Qualunque nuova funzionalità: questo ticket è solo un refactor.

## Nota

Prerequisito consigliato, non bloccante, per
[Lista pazienti — ricerca, filtri, ordinamento, scorciatoie e aggiornamento](WF-039-lista-pazienti-ricerca-filtri.md)
e
[Andamento compliance e idratazione nel dettaglio paziente](WF-043-andamento-compliance-dettaglio.md):
farlo prima riduce il lavoro di quei due ticket, ma non li blocca
formalmente.

## Resolution comment

2026-11-16 — implementato (commit `b13ac1c`): `NutritionistPage.jsx` ridotto a
14 righe; `CopyInvite`, `AddPatientForm`, `PlanUpload`, `PatientDetail`,
`PatientList` in [src/components/nutritionist/](../../src/components/nutritionist/),
caricamento condiviso in `api.mjs` (`useNutriApi`/`useLoader`). Nessun cambio
visivo o di comportamento: 98/98 `npm test`, 20/20 `npm run test:browser`.
Stato `closed` registrato il 2026-11-27: la chiusura era già nella mappa
(commit `6fb9933`) ma il ticket era rimasto `open`.
