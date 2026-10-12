---
id: WF-012
title: Rendere configurabile l'obiettivo dell'acqua
parent: WF-MAP-001
labels: [wayfinder:implementation]
status: open
assignee: null
assignment: manu
assignment_mode: flexible
blocked_by: [WF-011]
---

# Rendere configurabile l'obiettivo dell'acqua

## Requirement comment

2026-10-10 — richiesta in sessione (Manu). Oggi il tracker in "Oggi" è fisso:
12 bicchieri da 200 ml, 2,4 L. Nei **settaggi account**: obiettivo giornaliero
in litri e misura del bicchiere; il tracker ricalcola il numero di bicchieri.
Dipende dalla pagina creata in
[Implementare pagina settaggi e tracking opzionali](WF-011-settaggi-implementazione.md).

## Open questions for PO

- **Conflitto con una decisione chiusa.** In
  [Definire pagina settaggi e tracking opzionali](WF-007-settaggi.md) il PO ha
  deciso: obiettivo dal piano se il PDF lo indica, altrimenti 2,4 L, nessun
  obiettivo personale. Questa richiesta lo supera? Se sì, quale valore prevale
  quando il PDF indica un obiettivo: quello personale o quello del piano?
- Limiti ammessi per obiettivo e misura del bicchiere (minimo, massimo, passo).

Non implementare prima che le risposte del PO siano annotate qui.

## Vincoli

- Lo storico acqua oggi salva il numero di bicchieri per giorno del piano
  (`water[day]`, massimo 12). Cambiare la misura del bicchiere non deve
  reinterpretare in silenzio lo storico: decidere in implementazione se salvare
  ml oppure bicchieri insieme alla misura usata, con migrazione compatibile.
- Dati per `sub` in `diet_plan_archive:<sub>`, revisione dell'archivio
  rispettata, nessuna nuova chiamata di rete.

## Acceptance criteria

- Obiettivo e misura modificabili dai settaggi; "Oggi" mostra bicchieri e litri
  coerenti, anche quando l'obiettivo non è multiplo della misura.
- Lo storico già salvato si legge senza errori e mantiene i litri registrati.
- Con il tracking acqua spento anche questi controlli sono nascosti.
- `npm test` e `npm run test:browser` verdi, con test sulla conversione e sulla
  compatibilità dello storico.
- Ogni push su `dev` fa deploy automatico: l'ultimo commit di un push che
  contiene codice non deve avere `[skip ci]`.
