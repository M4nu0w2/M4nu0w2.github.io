---
id: WF-007
title: Definire pagina settaggi e tracking opzionali
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire pagina settaggi e tracking opzionali

## Question

Quali funzioni si possono attivare dalla pagina settaggi, con quali valori
iniziali, e cosa succede ai dati quando un tracking viene disattivato?

Requisito acquisito dal PO il 2026-10-05: pagina settaggi per abilitare o
disabilitare funzioni, tra cui tracking dell'acqua e tracking dell'olio.
Il tracking dell'acqua esiste già; quello dell'olio è una nuova evolutiva.

Da definire per l'olio: registrazione per pasto o giornaliera, unità
(grammi, ml, cucchiaini), totale consumato e confronto con la quantità
prevista dal piano, evitando di contare due volte lo stesso consumo.
Obiettivi e conversioni devono distinguere valori del piano e scelte personali.

Ulteriori opzioni proposte, non ancora approvate:
- Promemoria facoltativi per acqua e pasti, con orari e fascia silenziosa.
- Unità di visualizzazione preferite: grammi o misure domestiche, dove supportate.
- Mostrare o nascondere il riepilogo di calorie e macro quando disponibili.
- Preferenze alimentari e ingredienti da escludere dalle sostituzioni rapide.

Da concordare: settaggi globali dell'utente o specifici del piano; persistenza
locale o sincronizzazione fra dispositivi; comportamento senza login;
valori iniziali dei singoli interruttori. Disattivare una funzione e cancellarne
lo storico sono operazioni distinte da discutere. La disponibilità di valori
nutrizionali e notifiche non è assunta.

La scelta di dove salvare queste preferenze dipende dal ticket
[Definire persistenza e dati condivisi con l’assistente](WF-003-dati.md);
la definizione iniziale delle funzioni opzionali può procedere indipendentemente.
