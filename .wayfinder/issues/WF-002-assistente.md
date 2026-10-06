---
id: WF-002
title: Definire contesto delle risposte del chatbot
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: [WF-005]
---

# Definire contesto delle risposte del chatbot

## Question

Come il chatbot identifica il piano su cui l’utente sta facendo una domanda,
e distingue una domanda sul piano da una domanda nutrizionale generale?

Requisito acquisito: chatbot dentro NutriPro mediante Gemini 3.7 Flash, per domande
sul proprio piano e sulla nutrizione generale. Canale e ambito sono risolti nel
ticket [Definire canale e ambito del chatbot](WF-005-canale-ambito.md).

Raccomandazione iniziale: contesto del piano selezionato,
con risposte che distinguono i contenuti del piano da ciò che non vi compare.
Non è una decisione approvata; il canale in-app è invece richiesto dal PO.

Caso concreto da discutere: con due piani salvati, «cosa posso mangiare stasera?»
si riferisce al piano selezionato, a quello attivo o a un piano scelto nella chat?
Conservazione delle conversazioni da definire in seguito.

## Updated model requirement - 2026-10-06

Il PO richiede ora una opzione Gemini gratuita e veloce ("turbo").
La vecchia indicazione 3.7 Flash non e una scelta tecnica confermata.
Verificare modello e quote ufficiali nella prossima sessione, tramite WF-010.
