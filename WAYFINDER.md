---
id: WF-MAP-001
title: NutriPro — archivio personale e assistente del piano
labels: [wayfinder:map]
status: open
assignee: null
created: 2026-10-04
---

# NutriPro — archivio personale e assistente del piano

## Destination

Definire una specifica condivisa per login Google, archivio personale dei piani
alimentari e chatbot Gemini dentro l’app, per domande sul piano e sulla nutrizione
in generale, e sostituzioni rapide degli ingredienti con quantità adattate a calorie
e macronutrienti quasi equivalenti, più una pagina settaggi per funzioni e tracking
opzionali. La mappa raccoglie
decisioni prima dell’implementazione; potrà essere ampliata con le prossime idee del PO.

## Notes

- Richiesta del PO del 2026-10-06: implementare ora la login Google reale e
  rendere la home accessibile soltanto dopo login. Supera il limite di sola
  raccolta per questa funzionalità; archivio e chatbot restano da specificare.

- Richiesta del PO del 2026-10-04: iniziare a segnare evolutive, non implementarle.
- Obiettivi acquisiti: autenticazione Google e piani persistenti, uno per PDF,
  catalogati nel tempo con CRUD e menu dedicato; chatbot per domande sul piano e
  sulla nutrizione in generale con
  Gemini 3.7 Flash, per cui serve una credenziale API.
- Il PO ha precisato che il chatbot è disponibile dentro NutriPro; rimane da
  concordare come sceglie il piano di riferimento, nel ticket
  [Definire contesto delle risposte del chatbot](.wayfinder/issues/WF-002-assistente.md).
- Nuovo requisito del PO: bacchetta magica accanto a ogni elemento del pasto,
  con 2-3 sostituti e rispettive quantità, calorie e macro quasi identici.
  Serve per sostituzioni occasionali in extremis, mantenendo il risultato
  nutrizionale del piano come obiettivo; equivalenza e tolleranze definite in
  [Definire equivalenza nutrizionale delle sostituzioni rapide](.wayfinder/issues/WF-006-sostituzioni.md).
- Stato di partenza: app client-side, un solo piano in localStorage, nessun
  backend. La preview della lista della spesa è online; branch locale `dev`,
  commit locale `1252f93`, push bloccato per permessi di scrittura al 2026-10-04.
  Questa mappa non cambia codice o deploy.
- Requisito del 2026-10-05: pagina settaggi con attivazione facoltativa del
  tracking acqua e olio; ulteriori opzioni sono proposte da valutare.
- Modello richiesto presente nel catalogo ufficiale come `gemini-3.7-flash`,
  verificato il 2026-10-04: [documentazione Google](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash).
  Disponibilità nel progetto API, credenziale, quote e costi restano da verificare
  prima di configurare l’integrazione. Login Google e accesso API Gemini sono
  esigenze separate.
- Nessuna credenziale acquisita, nessuna richiesta inviata a Gemini e nessun
  dato del piano trasferito per questa attività di pianificazione.
- Skill: `wayfinder`; `grilling` per decisioni del PO; `domain-modeling` per
  [glossario](CONTEXT.md); `research` quando serviranno indagini documentali.
- Requisito del PO del 2026-10-06: i ticket possono essere assegnati a Manu o
  Claudio, anche in modo vincolante su richiesta esplicita. I campi `assignment`
  e `assignment_mode` seguono le regole del tracker; `assignee` registra chi
  lavora effettivamente il ticket. Nessun ticket è stato assegnato d'ufficio.
- Tracker locale: [.wayfinder/TRACKER.md](.wayfinder/TRACKER.md). Non è stato
  configurato un tracker esterno; nessuna issue pubblica creata. Per configurarne
  uno si può usare `/setup-matt-pocock-skills`.
- Il PO ha autorizzato il push completo su `dev`, inclusi handoff, mappa, ticket
  e glossario, il 2026-10-04. Non inserire PDF personali o segreti nei ticket.

## Decisions so far

- [Archivio e gestione dei piani](.wayfinder/issues/WF-001-archivio.md): nuovo
  piano conserva il precedente inattivo; sostituzione con doppia conferma;
  un solo piano attivo, con tracking distinto per piano.

- [Definire canale e ambito del chatbot](.wayfinder/issues/WF-005-canale-ambito.md):
  chatbot nell’app, con domande sul proprio piano e sulla nutrizione generale.

- [Definire contesto delle risposte del chatbot](.wayfinder/issues/WF-002-assistente.md):
  piano attivo di default, cambiabile in chat; invio solo con interruttore per
  conversazione, spento di default; fonte citata; prescrizioni mai modificate.

- [Definire equivalenza nutrizionale delle sostituzioni rapide](.wayfinder/issues/WF-006-sostituzioni.md):
  solo alimenti del piano con stesso ruolo nel pasto; stime Gemini per 100 g,
  calorie ±5%, macro ±5 g/15%; sola consultazione.

Le altre raccomandazioni nei ticket non sono decisioni approvate.

## Not yet specified

- Esperienza del menu archivio, ricerca dei piani e gestione di errori e duplicati.
- Passaggio dai dati attuali in localStorage all’archivio personale e comportamento
  della consultazione offline quando l’utente non è collegato.
- Architettura concreta, servizio di persistenza, deploy e operatività futura
  dell’app autenticata: dipendono dal perimetro dei dati concordato.
- Conversazioni nel tempo e collegamento ai pasti e alle alternative.
- Gestione delle preferenze personali e dei vincoli alimentari nelle
  sostituzioni rapide.
- Eventuali altre evolutive che il PO aggiungerà alla raccolta iniziale.

## Out of scope

- Implementare, attivare login o Gemini, creare credenziali, committare o distribuire
  nuove funzionalità in questa sessione di raccolta.

Eccezione autorizzata il 2026-10-06: preparare login Google e protezione della
home, compresa l'infrastruttura necessaria; l'attivazione richiede configurazione
OAuth e verifica reale. La richiesta non chiude le decisioni aperte sull'archivio.

## React e storico - 2026-10-06

Il PO richiede il refactor completo del frontend in React e una pagina moderna
per i piani precedenti. Implementati `/plans` con ricerca/filtri e `/plans/:id`
in sola lettura; consultare non modifica il piano attivo. WF-009 completato.
Login, parser PDF, conversioni e archivio per account conservati.
Codice locale su dev; pubblicazione non eseguita.
