---
id: WF-033
title: Raccogliere campioni di PDF e feedback dai nutrizionisti tester
parent: WF-MAP-001
labels: [wayfinder:task]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Raccogliere campioni di PDF e feedback dai nutrizionisti tester

## Question

Quanti template di PDF circolano davvero, che cosa chiedono i pazienti e che
cosa pagherebbe un nutrizionista? Il compito produce i fatti da cui dipendono
parser, enum dei pasti e prezzi.

Il PO ha detto (2026-10-18) di avere nutrizionisti disposti a testare.

## Checklist (HITL: richiede le persone)

1. **Elenco dei tester** (3-5 per cominciare) e un referente per ciascuno.
2. **Campioni di PDF**: per ogni gestionale, 3-4 esempi **anonimizzati** (nome,
   data di nascita, contatti e studio tolti prima dell'invio). Mai in questo
   repository né in una chat: cartella privata fuori dal repo. Annotare quale
   software l'ha prodotto e come lo mandano ai pazienti.
3. **Domande da fare in 20 minuti**: quale software usano; come consegnano
   oggi la dieta; cosa chiedono più spesso i pazienti; cosa vorrebbero vedere del
   paziente (aderenza, peso); disponibilità a pagare, quanto e come (a studio, a
   paziente).
4. **Consenso**: dire chiaramente come verranno usati i campioni e i commenti.
5. **Esito scritto nel ticket**: elenco dei gestionali, numero di template,
   richieste più frequenti, intervalli di prezzo emersi.

## Acceptance criteria

- Almeno tre gestionali o template diversi documentati.
- Un campione anonimizzato per template, conservato fuori dal repository.
- Sintesi delle risposte sui prezzi e sulle richieste dei pazienti.

## Dependencies

Alimenta [Definire l'enum dei tipi di pasto e coprirne tutti gli scenari](WF-023-tipi-di-pasto-enum.md),
[Comprendere i pasti di qualsiasi PDF con Gemini, a prescindere dal template](WF-021-comprensione-pdf-gemini.md)
e [Definire il modello di ricavo e i due piani a pagamento](WF-032-modello-di-ricavo.md).
