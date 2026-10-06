---
id: WF-001
title: Definire archivio personale e gestione dei piani
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: open
assignee: null
assignment: null
assignment_mode: flexible
blocked_by: []
---

# Definire archivio personale e gestione dei piani

## Question

Quali dati e operazioni rendono il piano un’entità personale gestibile nel tempo?

Requisiti acquisiti dal PO: login Google, persistenza del proprio piano, un piano
per ogni PDF, catalogazione nel tempo, CRUD e menu dedicato.

Confini ancora da decidere: conservazione del PDF originale o del solo piano
estratto; date e nome del piano; cosa è modificabile; nuovo caricamento come
entità distinta o aggiornamento; gestione dello stesso PDF caricato due volte;
effetto dell’eliminazione su PDF, piano e dati collegati; significato di piano
attivo rispetto ai piani storici.

Caso concreto da discutere: importo un PDF di settembre e uno di ottobre.
Posso consultarli entrambi e scegliere quello attivo; rinominarne uno non
modifica automaticamente alimenti e dosi. Questo comportamento è una proposta,
non una decisione già approvata.

Raccomandazione iniziale: mantenere entità distinte e storia leggibile, con
proprietà dell’utente autenticato. Portabilità fra dispositivi da concordare.
