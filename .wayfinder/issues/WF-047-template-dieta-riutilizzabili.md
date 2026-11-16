---
id: WF-047
title: Template di dieta riutilizzabili
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: claudio
assignment_mode: flexible
blocked_by: [WF-045]
---

# Template di dieta riutilizzabili

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Bloccato da [Editor del piano nell'app](WF-045-editor-piano-app.md): un
template riutilizzabile presuppone un modo di creare o modificare un piano
senza partire da un PDF, che quel ticket deve ancora definire.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Cos'è un template**: un piano senza paziente associato, o una struttura
   diversa (solo pasti tipo, senza giorni)?
2. **Assegnazione e personalizzazione**: un template si assegna a un
   paziente e poi si personalizza liberamente, o resta vincolato al
   template d'origine (con aggiornamenti che si propagano)?
3. **Distinzione da un piano storico**: come si distingue, nell'archivio del
   nutrizionista, un template da un piano già assegnato a un paziente reale?
4. **Dati personali**: un template può contenere dati riconducibili a un
   paziente reale (es. "piano di Mario adattato"), o deve restare sempre
   generico?

## Acceptance criteria del ticket

- Risposte annotate alle quattro domande sopra.

## Out of scope

- Implementazione: ticket successivo, dopo le risposte e dopo
  [Editor del piano nell'app](WF-045-editor-piano-app.md).
- Generazione assistita con AI dei template: questione separata, legata al
  ticket Gemini.
