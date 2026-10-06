---
id: WF-003
title: Definire persistenza e dati condivisi con l’assistente
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
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

## Update from WF-002 - 2026-10-06

Sbloccato: [Definire contesto delle risposte del chatbot](WF-002-assistente.md)
ha deciso che il **piano di riferimento** (attivo di default, cambiabile in chat)
viene inviato solo con l'interruttore per conversazione acceso, spento di default,
insieme a giorno della settimana e ora locale. Resta da decidere qui quali campi
del piano di riferimento si inviano: pasti, quantità, alternative, ricette,
equivalenze delle unità, tracking e spunte, metadati del PDF come nome e date.

## Update from WF-006 - 2026-10-06

[Definire equivalenza nutrizionale delle sostituzioni rapide](WF-006-sostituzioni.md)
ha deciso che le stime Gemini per alimento (ruolo nel pasto, calorie e macro per
100 g) sono salvate con il piano e riusate. Includerle nel perimetro dei dati
persistenti. Per la bacchetta si inviano a Gemini solo nomi degli alimenti e
grammature, senza dati identificativi.

## Update from WF-007 - 2026-10-06

[Definire pagina settaggi e tracking opzionali](WF-007-settaggi.md) ha deciso
settaggi globali per account (interruttori acqua e olio, unità preferite) e
quantità effettive dell'olio registrate per voce del pasto, con storico
conservato alla disattivazione. Includere settaggi account e quantità effettive
nel perimetro: salvataggio locale o sincronizzato fra dispositivi.
