---
id: WF-015
title: Implementare il calendario aderenza
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: [WF-014]
---

# Implementare il calendario aderenza

## Requirement comment

2026-10-10 — richiesta in sessione (Manu): vista mensile con la percentuale di
alimenti spuntati per giorno, per il **piano attivo**. Valutare se mostrare
anche i **piani inattivi** in sola lettura.

Bloccato da [Definire come conservare le date reali del tracking](WF-014-date-tracking.md):
oggi le spunte non hanno data reale.

## Open questions for PO

- Mostrare anche i piani inattivi in sola lettura? Se sì, come distinguere i
  giorni registrati su piani diversi nello stesso mese.
- Giorni senza alcuna spunta: 0% oppure "nessun dato"?

Non implementare prima che le risposte del PO siano annotate qui.

## Vincoli

- Calcolo solo in locale da `diet_plan_archive:<sub>`; nessuna chiamata di rete.
- La percentuale usa le voci del menu del giorno del piano corrispondente,
  come il contatore "Progressi del giorno" in "Oggi" (sottovoci di ricetta
  comprese).

## Acceptance criteria

- Vista mensile navigabile, con percentuale per giorno coerente con i progressi
  della pagina "Oggi" per la stessa data.
- Leggibile su mobile senza scroll orizzontale; rotta protetta dal login.
- Storico non datato gestito come deciso nel ticket delle date.
- `npm test` e `npm run test:browser` verdi, con test sul calcolo per data.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
