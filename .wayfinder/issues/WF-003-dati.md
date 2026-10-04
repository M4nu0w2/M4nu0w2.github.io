---
id: WF-003
title: Definire persistenza e dati condivisi con l’assistente
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
blocked_by: [WF-001, WF-002]
---

# Definire persistenza e dati condivisi con l’assistente

## Question

Una volta definiti archivio e canale, quali dati vanno sincronizzati per utente,
quali sono conservati soltanto localmente e quali vengono inviati a Gemini?

Oggi il piano resta nel browser; login e archivio remoto cambierebbero quel
perimetro. Il PO ha chiesto un assistente collegato a Gemini, ma non ha ancora
specificato conservazione del documento originale, selezione del contesto,
esclusione di dati identificativi e conservazione delle conversazioni.

Raccomandazione iniziale: utilizzare solo il contesto necessario del piano
selezionato; tenere separate identità dell’utente e contenuto nutrizionale
quando l’identità non serve alla risposta. La scelta definitiva richiede il PO.

Da questa decisione dipendono la valutazione dell’architettura, la gestione degli
accessi e la verifica delle condizioni applicabili al servizio Gemini scelto.
Nessun invio di PDF o contenuti del piano è autorizzato da questo ticket aperto.
