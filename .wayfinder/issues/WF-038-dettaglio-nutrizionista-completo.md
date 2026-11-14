---
id: WF-038
title: Vista di dettaglio nutrizionista completa
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Vista di dettaglio nutrizionista completa

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: `PatientDetail` in
[src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx)
(riga 78) mostra solo `item.name` e `item.qty` grezzo per ogni voce del pasto.
Non mostra:

- le alternative alimentari (`getFoodChoices`, già visibili al paziente in
  `Meals` dentro [src/App.jsx](../../src/App.jsx));
- l'unità originale del PDF quando la quantità è stata convertita (`rawQty` e
  `conversionNote`, già gestiti da `displayQty` in
  [src/lib/tracking.mjs](../../src/lib/tracking.mjs), riga 51);
- gli avvisi di qualità dell'importazione (`metadata.quality.warnings`);
- il tracking dell'olio, già salvato sul server (campo `oil` restituito da
  `GET /api/nutritionist/patients/:id/compliance`, vedi
  [server/app.cjs](../../server/app.cjs)) ma non renderizzato nella vista di
  dettaglio.

## Vincoli

- Riusare `displayQty` e `getFoodChoices` così come sono, senza duplicarne la
  logica di conversione o di estrazione delle alternative.
- Vista in sola lettura: il nutrizionista consulta, non modifica il tracking
  del paziente da qui.

## Acceptance criteria

- Alternative, unità originale con nota di conversione, avvisi di qualità
  dell'import e tracking olio visibili nel dettaglio paziente.
- Nessuna duplicazione della logica di `displayQty` / `getFoodChoices`.
- Test e2e in
  [tests/nutritionist.e2e.cjs](../../tests/nutritionist.e2e.cjs) che verifica
  la presenza di almeno uno di questi elementi nel dettaglio.
- `npm run test:browser` verde.

## Out of scope

- Qualunque azione di modifica del piano dalla vista di dettaglio (vedi
  [Editor del piano nell'app](WF-045-editor-piano-app.md)).
