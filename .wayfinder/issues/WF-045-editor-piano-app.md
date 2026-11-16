---
id: WF-045
title: Editor del piano nell'app
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: claudio
assignment_mode: flexible
blocked_by: []
---

# Editor del piano nell'app

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: oggi l'unico modo per cambiare il piano di un
paziente è caricare un nuovo PDF (`PlanUpload` in
[src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx),
che chiama `POST /api/nutritionist/patients/:id/plan`). Non esiste un editor
che modifichi singole voci, quantità o pasti senza ripartire da un PDF
intero.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Campi modificabili**: voci del pasto, quantità, conversioni, alternative
   alimentari, pasti interi — tutti, o un sottoinsieme in una prima versione?
2. **Spunte già registrate**: una modifica al piano cosa fa alle spunte del
   paziente già salvate per quel piano? Si azzerano, restano agganciate alla
   voce per id, o si perdono se la voce cambia struttura?
3. **Versionamento e storico**: ogni modifica crea una nuova versione del
   piano (come fa oggi un nuovo caricamento PDF) o modifica in-place lo
   stesso piano?
4. **Chi vede la modifica e quando**: il paziente vede subito il piano
   aggiornato, o solo al prossimo accesso (come oggi per i nuovi piani)?
5. **Relazione con "Sostituzione del piano"**: il glossario in
   [CONTEXT.md](../../CONTEXT.md) definisce "Sostituzione del piano" come
   reimportazione distruttiva del PDF, protetta da due conferme. Un editor
   diretto è una terza operazione distinta, o è la stessa cosa con
   un'interfaccia diversa? Il glossario andrebbe esteso con una nuova voce se
   la risposta è "distinta".

## Acceptance criteria del ticket

- Risposte annotate alle cinque domande sopra.
- Decisione esplicita su quale termine del glossario usare o aggiungere.

## Out of scope

- Implementazione: ticket successivo, dopo le risposte.
- Generazione assistita con AI del contenuto del piano (vedi
  [Template di dieta riutilizzabili](WF-047-template-dieta-riutilizzabili.md)
  e il ticket Gemini, se si deciderà di collegarli).
