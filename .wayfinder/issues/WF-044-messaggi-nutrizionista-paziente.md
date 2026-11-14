---
id: WF-044
title: Messaggi tra nutrizionista e paziente
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: claudio
assignment_mode: flexible
blocked_by: [WF-034]
---

# Messaggi tra nutrizionista e paziente

## Assignment comment

2026-11-15 — il PO (Manu) ha chiesto di assegnare a Claudio tutte le
decisioni aperte (ticket `grilling`) del tracker, da sbrigare quando ha
tempo. Modalità `flexible`: chiunque può comunque lavorarci.

## Requirement comment

2026-11-14 — proposta emersa dall'analisi della dashboard nutrizionista, da
confermare dal PO.

Fatto verificato il 2026-11-14: `POST /api/chat` e `ChatPage` (vedi
[server/app.cjs](../../server/app.cjs) e
[src/components/ChatPage.jsx](../../src/components/ChatPage.jsx)) servono
oggi solo la conversazione tra il paziente e l'assistente Gemini. La
dashboard nutrizionista ([src/components/NutritionistPage.jsx](../../src/components/NutritionistPage.jsx))
non ha alcuna funzione di comunicazione diretta tra nutrizionista e paziente.

Bloccato da [Ottenere una consulenza legale su dati sanitari e ruoli GDPR](WF-034-consulenza-legale-dati-sanitari.md):
un canale di messaggi tra professionista e paziente su dati di salute ha
implicazioni di conservazione e responsabilità che quel parere deve coprire
prima di aprire la funzione.

## Decisioni aperte per il PO

Non sono decisioni prese.

1. **Ambito**: testo libero, o messaggi legati a un pasto/voce specifica del
   piano?
2. **Canale e notifiche**: solo in app, o anche notifica esterna (email,
   push)? Con quale urgenza attesa di risposta.
3. **Conservazione e cancellazione**: per quanto tempo si conservano i
   messaggi, cosa succede se il nutrizionista cessa l'abbonamento o il
   paziente viene scollegato.
4. **Rapporto con l'assistente Gemini**: i messaggi tra persone sono separati
   dalla conversazione con l'assistente, o convergono nello stesso spazio?
5. **Rapporto con i ruoli GDPR**: chi è titolare dei messaggi (stesso
   ragionamento di [Definire la conservazione sul server dei dati dei pazienti](WF-030-conservazione-dati-lato-server.md)).
6. **Chi può scrivere per primo**: solo il nutrizionista, solo su richiesta
   del paziente, o entrambi senza restrizioni?

## Acceptance criteria del ticket

- Risposte annotate alle sei domande sopra.
- Perimetro di WF-034 confermato sufficiente a coprire questo canale, o nuova
  domanda aggiunta al ticket legale se non lo è.

## Out of scope

- Implementazione: ticket successivo, dopo le risposte.
