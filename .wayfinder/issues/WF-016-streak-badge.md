---
id: WF-016
title: Implementare streak e badge di aderenza
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: [WF-015]
---

# Implementare streak e badge di aderenza

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): giorni consecutivi con piano
rispettato e pochi badge semplici, calcolati in locale. Usa i dati per data di
[Implementare il calendario aderenza](WF-015-calendario-aderenza.md).

## Open questions for PO

- Soglia di "giorno rispettato": percentuale minima di alimenti spuntati
  (es. 100% o 80%), e se contano acqua e olio quando il tracking è attivo.
- Un giorno senza dati interrompe la streak?
- La streak segue solo il **piano attivo** o prosegue cambiando piano?
- Elenco dei badge e relative condizioni (es. prima settimana, 7 o 30 giorni).

Non implementare prima che le risposte del PO siano annotate qui.

## Vincoli

- Calcolo solo locale dai dati in `diet_plan_archive:<sub>`; nessuna chiamata
  di rete, nessuna condivisione esterna dei risultati.
- Badge derivati dai dati, senza stato duplicato che possa divergere.

## Acceptance criteria

- Streak corrente e migliore visibili; badge ottenuti e mancanti.
- Risultati identici ricaricando la pagina o aprendo un'altra scheda.
- `npm test` e `npm run test:browser` verdi, con test sui casi limite della
  soglia e dei giorni mancanti.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
