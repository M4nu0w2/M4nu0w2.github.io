---
id: WF-039
title: Lista pazienti — ricerca, filtri, ordinamento, scorciatoie e aggiornamento
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: closed
assignee: claude
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Lista pazienti — ricerca, filtri, ordinamento, scorciatoie e aggiornamento

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: `PatientList` in
[src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx)
carica l'elenco una sola volta all'apertura (`useEffect` con `load` chiamato
al montaggio) e non ha ricerca, filtri, ordinamento, scorciatoie da tastiera
né un meccanismo di refetch o polling: se il nutrizionista lascia la scheda
aperta, non vede un paziente appena diventato attivo finché non ricarica la
pagina.

La pagina `/plans` lato paziente ha già un pattern di ricerca e filtri simile
(classi `.search-input` e `.filter-tabs`, componente `PlansPage` in
[src/App.jsx](../../src/App.jsx)): da riusare, non da reinventare.

## Vincoli

- Nessuna nuova dipendenza per ricerca/filtri/ordinamento: logica semplice su
  array già in memoria, come fa `PlansPage` oggi.
- L'aggiornamento periodico non deve introdurre polling aggressivo: al focus
  della scheda e a un intervallo ragionevole (ordine dei minuti, non secondi)
  bastano.
- Riuso delle classi `.search-input` e `.filter-tabs` già presenti in
  [src/styles.css](../../src/styles.css).

## Acceptance criteria

- Ricerca per nome o email, attivabile con la scorciatoia `/`.
- Filtri: "compliance bassa", "senza accesso da N giorni", "senza piano",
  "invito in attesa" (soglie esatte da definire in implementazione, non in
  questo ticket).
- Ordinamento della lista (criterio di default da proporre in
  implementazione).
- Scorciatoia `N` apre il form "Nuovo paziente".
- La lista si aggiorna al ritorno del focus sulla scheda e a un intervallo
  ragionevole, senza nuove dipendenze.
- `npm run test:browser` verde, con un test che copre almeno ricerca e un
  filtro.

## Out of scope

- Paginazione: non necessaria alle dimensioni attuali del prodotto.
- Sincronizzazione in tempo reale (websocket o simili).

## Resolution comment

2026-11-16 — implementato in
[PatientList.jsx](../../src/components/nutritionist/PatientList.jsx), tutte
scelte di implementazione (non decisioni del PO, come indicato nel ticket):

- **Ricerca**: per nome o email, nessun debounce (filtro locale su array già
  in memoria). Scorciatoia `/` porta il focus sul campo, ignorata se si sta
  già scrivendo in un altro campo.
- **Filtri**: compliance bassa (< 50%), senza accesso da 7+ giorni (solo
  attivi), senza piano, invito in attesa. Riusano `.search-input`/
  `.filter-tabs` di [styles.css](../../src/styles.css), stesso pattern di
  `PlansPage`.
- **Ordinamento**: alfabetico per nome (`localeCompare` it-IT), unico
  criterio, non configurabile.
- **Scorciatoia `n`**: apre il form "Nuovo paziente" tramite una prop
  `openSignal` (contatore) che [AddPatientForm.jsx](../../src/components/nutritionist/AddPatientForm.jsx)
  osserva, non un ref DOM.
- **Aggiornamento**: su `visibilitychange` (ritorno alla scheda) e ogni 2
  minuti mentre la scheda è visibile; nessuna nuova dipendenza.
- Stato vuoto distinto tra "nessun paziente ancora" e "nessun paziente
  trovato" (ricerca/filtro senza risultati).

Test e2e: ricerca per nome, filtro "Invito in attesa", scorciatoie `/` e
`n`, aggiornamento senza reload dopo un paziente aggiunto fuori banda, in
[tests/nutritionist.e2e.cjs](../../tests/nutritionist.e2e.cjs). `npm test`
100/100, `npm run test:browser` 22/22 verdi.
