---
id: WF-036
title: Correggere il calcolo della compliance dei piatti composti
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Correggere il calcolo della compliance dei piatti composti

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: `complianceFor` in
[server/app.cjs](../../server/app.cjs) (riga 36) conta ogni riga di
`meal.items` come un alimento, senza distinguere la riga madre di un piatto
composto dalle sue righe `isSubItem`. Lato paziente,
[src/App.jsx](../../src/App.jsx) (righe 137-138, componente `Dashboard`) fa lo
stesso conteggio (`items = meal.items.map(...)`, `completed =
items.filter(...)`): un piatto composto come "Pasta e lenticchie" (riga madre +
2 sottovoci) pesa 3 voci invece di 1, gonfiando sia il numeratore sia il
denominatore ogni volta che viene spuntato.

Verificato anche `dayOil` in [src/lib/tracking.mjs](../../src/lib/tracking.mjs)
(righe 16-35): tratta già madre e figli in modo coerente, con una regola di
fallback esplicita (spuntare la madre conta anche i figli ai fini dell'olio).
Nessuna delle due logiche di compliance replica questa coerenza.

## Vincoli

- Una sola regola di conteggio condivisa tra client (`Dashboard`) e server
  (`complianceFor`), per non avere due definizioni di "alimento" che divergono.
- La proposta di partenza è: la riga madre di un piatto composto non viene
  contata, si contano solo le righe `isSubItem`; ma è una proposta, non una
  decisione — va annotata qui dal PO, non assunta in silenzio.
- Non toccare le spunte già salvate (`plan.checked`): la correzione riguarda
  solo come si **contano**, non cosa viene salvato.

## Acceptance criteria

- Regola di conteggio definita e annotata in questo ticket prima
  dell'implementazione.
- Stessa regola applicata sia in `complianceFor` sia nel calcolo lato paziente.
- Test in [tests/nutritionist.test.cjs](../../tests/nutritionist.test.cjs) con
  una fixture che contiene un piatto composto (riga madre senza quantità + una
  o più righe `isSubItem`).
- `npm test` e `npm run test:browser` verdi.

## Out of scope

- Cambiare come `dayOil` tratta madre e figli: è già coerente, resta invariato.
- Qualsiasi modifica al formato dei dati del piano (`dietEngine.mjs`).
