---
id: WF-040
title: Accessibilità della dashboard nutrizionista
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Accessibilità della dashboard nutrizionista

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14 in
[src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx)
(riga 98) e, per lo stesso pattern già esistente lato paziente, in
[src/App.jsx](../../src/App.jsx) (riga 128, componente `DayPicker`):

- i tab dei giorni sono elementi `button` con `aria-pressed` dentro un
  contenitore `role="group"`, senza `role="tablist"` / `role="tab"` /
  `aria-selected` né navigazione con le frecce;
- il form "Nuovo paziente" (`AddPatientForm`, righe 27-54) apre e chiude con
  `setOpen(true)` / `setOpen(false)` senza spostare il focus sul primo campo
  all'apertura né restituirlo al pulsante che lo ha aperto alla chiusura;
- l'elemento `<progress>` della compliance (riga 107) ha un `aria-label` sul
  gruppo ma nessun testo equivalente per il valore numerico accanto alla
  barra.

## Vincoli

- Correzione solo di markup e gestione del focus: nessun cambio della logica
  applicativa.
- Mantenere invariato l'aspetto visivo esistente.

## Acceptance criteria

- Tab dei giorni con `role="tablist"` / `role="tab"` / `aria-selected` e
  navigazione da tastiera con le frecce, nella dashboard nutrizionista e,
  se il PO lo conferma qui, anche nel `DayPicker` condiviso lato paziente.
- Focus gestito esplicitamente all'apertura e alla chiusura del form nuovo
  paziente.
- Testo equivalente leggibile da uno screen reader per il valore di ogni
  `<progress>` di compliance.
- Verifica con un lettore di schermo o con i controlli automatici di
  accessibilità già presenti nei test esistenti.

## Out of scope

- Audit di accessibilità completo di tutta l'app: solo la dashboard
  nutrizionista e il pattern condiviso dei tab giorno, se esteso.
