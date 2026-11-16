---
id: WF-043
title: Andamento compliance e idratazione nel dettaglio paziente
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-042, WF-015]
---

# Andamento compliance e idratazione nel dettaglio paziente

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Oggi `PatientDetail` in
[src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx)
mostra solo la compliance del giorno corrente (vedi anche
[Vista di dettaglio nutrizionista completa](WF-038-dettaglio-nutrizionista-completo.md),
che riguarda i dati già disponibili oggi). Senza uno storico per data
(WF-042) non è possibile mostrare un andamento nel tempo.

## Vincoli

- Bloccato da [Tracking per data reale anche sul server](WF-042-tracking-data-reale-server.md):
  serve lo storico per data prima di poter calcolare una finestra a 7 o 30
  giorni.
- Bloccato da [Implementare il calendario aderenza](WF-015-calendario-aderenza.md):
  riusa le stesse definizioni di "giorno rispettato" e le stesse regole di
  calcolo, per non avere due nozioni di aderenza diverse tra vista paziente e
  vista nutrizionista.
- Regole di colore e accessibilità coerenti con il resto dell'app (vedi anche
  [Accessibilità della dashboard nutrizionista](WF-040-accessibilita-dashboard-nutrizionista.md)).

## Acceptance criteria

- Compliance a 7 e 30 giorni e andamento idratazione nel dettaglio paziente.
- Heatmap giorno × pasto nella vista di dettaglio.
- Sparkline a 7 barre nella riga della lista pazienti.
- Stessa definizione di aderenza usata in WF-015/WF-016, non una nuova.
- `npm run test:browser` verde.

## Out of scope

- Streak e badge per il nutrizionista: restano una vista del paziente
  (WF-016), questo ticket mostra solo l'andamento, non introduce streak lato
  nutrizionista.
