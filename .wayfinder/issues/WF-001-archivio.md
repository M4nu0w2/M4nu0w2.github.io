---
id: WF-001
title: Definire archivio personale e gestione dei piani
parent: WF-MAP-001
labels: [wayfinder:grilling]
status: closed
assignee: codex
assignment: null
assignment_mode: flexible
blocked_by: []
resolved: 2026-10-06
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

## Requirement update

2026-10-06 — il PO richiede di implementare prima la login Google e rendere
la home accessibile solo dopo autenticazione. L'esecuzione è scorporata nel
ticket [Implementare login Google e proteggere la home](WF-008-login-google.md).
Questo ticket resta aperto per le decisioni su archivio, persistenza e CRUD.

## Working comment

2026-10-06 — preso in carico dopo la conferma del PO che la login Google
funziona in locale. Il codice attuale conserva un solo piano per account nel
browser: ogni caricamento sostituisce quello precedente. Mancano elenco dei
piani, identificativi indipendenti, selezione del piano attivo e CRUD.

Domande inviate al PO: conservazione del PDF originale, disponibilità fra
dispositivi e comportamento in caso di caricamento duplicato.
Queste risposte determinano dati conservati e responsabilità dell'archivio;
non vengono dedotte dalla sola conferma della login.

Flusso da validare dopo le risposte: importare settembre e ottobre, vederli
entrambi nel menu archivio, scegliere quale consultare, rinominarlo senza
modificare alimenti e dosi, eliminarlo con conferma. Il significato di piano
attivo, la separazione del tracking e la modifica dei contenuti restano da
concordare. Nessuna migrazione o trasmissione dei piani avviata.

## Resolution comment

2026-10-06 — decisione esplicita del PO in conversazione:

- Al primo accesso caricare il PDF e creare il proprio piano.
- Un apposito bottone consente Carica nuovo piano: diventa attivo e archivia
  senza cancellare il precedente.
- Sostituisci piano attuale reimporta un PDF e sovrascrive il contenuto attivo;
  operazione rara e distruttiva, protetta da doppia convalida.
- Piani attivi/inattivi, con un solo attivo alla volta.
- Creare un ticket dedicato alla consultazione dello storico.

Implementato in locale: archivio per account nel browser, menu Gestisci piani,
prima conferma prima del PDF e seconda dopo la lettura con presa d'atto esplicita.
Solo un PDF valido e il salvataggio riuscito effettuano la sostituzione.
Annullare, errori di lettura, quota e modifica in altra scheda conservano il
contenuto precedente. Ogni piano ha spunte e acqua indipendenti; la sostituzione
le azzera dopo avviso. Il piano esistente dell'account viene migrato una volta,
con le vecchie chiavi conservate come backup; i dati senza proprietario non vengono
importati. Il PDF sorgente non viene conservato o trasmesso.

La consultazione degli inattivi senza cambiarne lo stato è nel nuovo
[WF-009 — Storico dei piani](WF-009-storico-piani.md).
Conservazione del PDF originale, sincronizzazione fra dispositivi, rinomina e
modifica puntuale degli alimenti rimangono da concordare; non sono decisioni
dedotte da questa richiesta e non impediscono il flusso locale richiesto.
