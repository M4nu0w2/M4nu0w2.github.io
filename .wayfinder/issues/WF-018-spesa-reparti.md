---
id: WF-018
title: Raggruppare la lista della spesa per reparto
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: []
---

# Raggruppare la lista della spesa per reparto

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): reparti come frutta e verdura, carne
e pesce, latticini, dispensa, altro; raggruppamento anche nell'export testuale.
Collegato a [Usare la lista della spesa come checklist in app](WF-017-spesa-checklist.md):
coordinare le modifiche alla stessa vista.

## Open questions for PO

- Metodo di assegnazione. Raccomandazione da approvare: mappa statica di parole
  chiave nel codice, con reparto "altro" di ripiego; nessun servizio esterno.
- Elenco definitivo dei reparti e loro ordine.
- Voce con alternative di reparti diversi (es. pollo oppure tofu): reparto della
  prima alternativa oppure "altro"?

Non implementare prima che le risposte del PO siano annotate qui.

## Vincoli

- Classificazione solo locale e deterministica; nessuna chiamata di rete, Gemini
  incluso, senza ok del PO.
- Le alternative restano raggruppate nella stessa voce, mai divise fra reparti.
- `buildShoppingList` in [dietEngine.mjs](../../src/lib/dietEngine.mjs) ha test
  esistenti: devono restare verdi.

## Acceptance criteria

- Lista in app ed export testuale divisi per reparto, nello stesso ordine.
- Alimenti non riconosciuti in "altro", mai persi.
- Test sulla classificazione dei nomi presenti nel piano di esempio.
- `npm test` e `npm run test:browser` verdi.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
