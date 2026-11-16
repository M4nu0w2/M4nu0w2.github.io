---
id: WF-040
title: Accessibilità della dashboard nutrizionista
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: claude
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

## Decisione del PO - 2026-11-16

Confermata l'estensione: stesso pattern `tablist`/`tab`/`aria-selected` e
navigazione a freccia anche nel `DayPicker` condiviso lato paziente, non
solo nella dashboard nutrizionista.

## Resolution comment

2026-11-16 — implementato.

- **Tab dei giorni**: `role="tablist"` sul contenitore, `role="tab"` +
  `aria-selected` + `tabIndex` roving sui bottoni, sia in `DayPicker`
  ([src/App.jsx](../../src/App.jsx)) sia nel dettaglio nutrizionista
  ([PatientDetail.jsx](../../src/components/nutritionist/PatientDetail.jsx)).
  Navigazione Freccia sinistra/destra/Home/End condivisa in
  [src/lib/tabs.mjs](../../src/lib/tabs.mjs) (`dayTabKeyDown`), usata da
  entrambi. Non unificati in un solo componente: markup leggermente diverso
  tra i due (il `DayPicker` ha `day-full`/`day-short` per il responsive),
  stessa regola di accessibilità applicata due volte.
- **Focus del form "Nuovo paziente"**
  ([AddPatientForm.jsx](../../src/components/nutritionist/AddPatientForm.jsx)):
  il bottone che apre il form resta montato ma `hidden` (non viene rimosso),
  così può essere rifocalizzato alla chiusura; l'apertura porta il focus sul
  primo campo.
- **`<progress>` di compliance**
  ([PatientList.jsx](../../src/components/nutritionist/PatientList.jsx)):
  aggiunto `aria-valuetext` con la percentuale, accanto all'`aria-label`
  già presente.
- Test aggiornati per i nuovi ruoli (`tests/mobile-layout.e2e.cjs`,
  `tests/settings.e2e.cjs`, che usavano `role="button"`/`aria-pressed` sui
  tab giorno) e nuovi controlli aggiunti: navigazione a freccia con verifica
  del focus, focus all'apertura/chiusura del form paziente, `aria-valuetext`
  della compliance (`tests/nutritionist.e2e.cjs`). Non verificato con un
  lettore di schermo reale, solo con i ruoli/attributi ARIA via Playwright:
  nessun controllo automatico di accessibilità esisteva già nei test, a
  differenza di quanto il ticket presupponeva. `npm test` 100/100,
  `npm run test:browser` 20/20 verdi.
