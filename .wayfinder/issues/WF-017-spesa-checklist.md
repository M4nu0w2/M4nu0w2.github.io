---
id: WF-017
title: Usare la lista della spesa come checklist in app
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: manu
assignment: manu
assignment_mode: flexible
blocked_by: []
---

# Usare la lista della spesa come checklist in app

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): oltre a copia, condivisione e `.txt`,
la lista si apre come checklist spuntabile mentre si fa la spesa, salvata per
piano. Ogni **voce della lista della spesa** mantiene insieme le sue
**alternative alimentari** con le rispettive quantità.

Coordinarsi con [Raggruppare la lista della spesa per reparto](WF-018-spesa-reparti.md),
che modifica la stessa vista.

## Open questions for PO

- Durata della checklist: una sola lista per piano, che si azzera generandone
  una nuova, oppure più liste conservate?
- Spuntare una voce con alternative vale per l'intera voce o per la singola
  alternativa acquistata?

Non implementare prima che le risposte del PO siano annotate qui.

## PO answers

2026-10-21 — risposte in sessione (Manu):

- Durata: una sola checklist per piano. Cambiando i giorni scelti, le spunte
  restano sulle voci ancora presenti nella lista.
- Voce con alternative: si spunta la singola alternativa acquistata; la voce
  risulta completata.
- Pulsante per svuotare tutte le spunte della spesa del piano: sì.
- Voci spuntate: barrate e spostate in fondo alla lista.

## Implementation comment

2026-10-21 — implementato in locale, non ancora committato né pubblicato:

- `buildShoppingGroups` in `dietEngine.mjs` dà voci e alternative con chiavi
  indipendenti dalle quantità sommate; `buildShoppingList` ne deriva il testo.
- Nuovo campo `shopping` del piano (`{ chiave voce: chiave alternativa }`),
  vuoto nei piani nuovi e sostituiti; archivi esistenti senza campo validi.
- "Apri checklist" nella finestra di esportazione; "Svuota spunte" azzera il
  campo del piano. Chiavi di voci assenti restano salvate ma non contano.
- Per [Raggruppare la lista della spesa per reparto](WF-018-spesa-reparti.md):
  raggruppare sopra `buildShoppingGroups`, senza cambiare le chiavi.
- `npm test` 56/56, `npm run test:browser` 17/17 verdi.

Chiusura dopo push su `dev` con deploy riuscito.

## Vincoli

- Stato della checklist nel piano in `diet_plan_archive:<sub>`; oggi
  `saveTracking` accetta solo `checked` e `water`, quindi serve un campo
  esplicito, distinto dalle spunte dei pasti e compatibile con gli archivi
  esistenti.
- Revisione dell'archivio rispettata per modifiche da altre schede.
- Nessuna nuova chiamata di rete; la condivisione resta quella già presente,
  avviata dall'utente.

## Acceptance criteria

- Dalla finestra di esportazione si apre la checklist per i giorni scelti.
- Spunte della spesa salvate per piano, indipendenti dalle spunte dei pasti.
- Copia, condivisione e `.txt` continuano a funzionare come oggi.
- Usabile su mobile; sopravvive alla ricarica della pagina.
- `npm test` e `npm run test:browser` verdi.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
